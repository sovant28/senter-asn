import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, save_upload_file
from app.middleware.auth import get_current_user, require_role
from app.models.master import User, Pegawai, OPD
from app.models.presensi import UploadLog, PresensiRaw, PresensiAgregatOPD
from app.schemas.presensi import UploadResponse, UploadErrorSummary, UploadErrorDetail
from app.services.excel_parser import ExcelPresensiParser
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/presensi", tags=["presensi"])


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_presensi(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN", "HR_MANAGER")),
):
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Only .xlsx files are accepted")

    dest = await save_upload_file(file)

    try:
        parser = ExcelPresensiParser()
        result = parser.parse(dest)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(400, str(e))

    upload_log = UploadLog(
        uploaded_by=current_user.id,
        file_hash_sha256=result.metadata.file_hash,
        file_size_bytes=result.metadata.file_size_bytes,
        file_name_original=file.filename or "unknown.xlsx",
        rows_imported=result.metadata.success_rows,
        rows_rejected=result.metadata.error_rows,
        rejection_reasons={e.row_number: e.reason for e in result.errors} if result.errors else None,
        status="SUCCESS" if result.success else "PARTIAL",
        tahun=result.rows[0].tahun if result.rows else None,
        bulan=result.rows[0].bulan if result.rows else None,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
    )
    db.add(upload_log)
    await db.flush()

    # --- Auto-import OPD from UNIT KERJA column (bulk) ---
    unit_names = sorted({r.unit_kerja.strip() for r in result.rows if r.unit_kerja})
    existing_opd_rows = (await db.execute(
        select(OPD.nama_opd, OPD.id, OPD.kode_opd).where(OPD.nama_opd.in_(unit_names))
    )).all()
    opd_by_name: dict[str, tuple[int, str]] = {}
    existing_kodes: set[str] = set()
    for r in existing_opd_rows:
        opd_by_name[r.nama_opd] = (r.id, r.kode_opd)
        existing_kodes.add(r.kode_opd)

    new_opds: list[OPD] = []
    max_id_result = await db.execute(select(func.max(OPD.id)))
    max_id = max_id_result.scalar() or 0
    counter = max_id + 1
    for nama in unit_names:
        if nama in opd_by_name:
            continue
        counter += 1
        kode = f"OPD_{counter:04d}"
        while kode in existing_kodes:
            counter += 1
            kode = f"OPD_{counter:04d}"
        existing_kodes.add(kode)
        new_opds.append(OPD(kode_opd=kode, nama_opd=nama, tipe_opd="DINAS"))

    if new_opds:
        db.add_all(new_opds)
        await db.flush()
        for o in new_opds:
            opd_by_name[o.nama_opd] = (o.id, o.kode_opd)

    # --- Auto-import Pegawai (bulk) ---
    nips_seen: set[str] = set()
    new_pegawai_list: list[dict] = []
    for r in result.rows:
        if not r.nip or not r.unit_kerja:
            continue
        nip = r.nip.strip()
        if nip in nips_seen:
            continue
        nips_seen.add(nip)
        unit = r.unit_kerja.strip()
        new_pegawai_list.append({"nip": nip, "nama": r.nama.strip()[:200], "unit": unit})

    all_nips = [p["nip"] for p in new_pegawai_list]
    existing_pegs = (await db.execute(
        select(Pegawai).where(Pegawai.nip.in_(all_nips))
    )).scalars().all()
    existing_peg_dict = {p.nip: p for p in existing_pegs}
    existing_peg_nips = {p.nip: p.id for p in existing_pegs}

    new_pegs: list[Pegawai] = []
    for p in new_pegawai_list:
        opd_entry = opd_by_name.get(p["unit"])
        if not opd_entry:
            continue
        opd_id = opd_entry[0]

        if p["nip"] in existing_peg_dict:
            peg_obj = existing_peg_dict[p["nip"]]
            # Update department if it has changed (Mutation)
            if peg_obj.opd_id != opd_id:
                peg_obj.opd_id = opd_id
                peg_obj.nama = p["nama"]
            continue

        new_pegs.append(Pegawai(nip=p["nip"], nama=p["nama"], opd_id=opd_id, jenis_asn="PNS"))

    if new_pegs:
        db.add_all(new_pegs)
        await db.flush()
        for pe in new_pegs:
            existing_peg_nips[pe.nip] = pe.id

    # --- Write presensi rows (Clean overwrite for same period & pegawai) ---
    if result.rows:
        target_tahun = result.rows[0].tahun
        target_bulan = result.rows[0].bulan
        peg_ids = [p_id for p_id in existing_peg_nips.values() if p_id is not None]
        if peg_ids:
            await db.execute(
                delete(PresensiRaw).where(
                    PresensiRaw.pegawai_id.in_(peg_ids),
                    PresensiRaw.tahun == target_tahun,
                    PresensiRaw.bulan == target_bulan,
                )
            )

    missing_nips = 0
    for row in result.rows:
        pegawai_id = existing_peg_nips.get(row.nip.strip()) if row.nip else None
        if pegawai_id is None:
            missing_nips += 1
            continue
        raw = PresensiRaw(
            upload_id=upload_log.id,
            pegawai_id=pegawai_id,
            tahun=row.tahun,
            bulan=row.bulan,
            tm1=row.tm1, tm2=row.tm2, tm3=row.tm3, tmm=row.tmm,
            pc1=row.pc1, pc2=row.pc2, pc3=row.pc3, pcm=row.pcm,
            hn=row.hn, dl=row.dl, tk=row.tk, tb=row.tb,
            itm=row.itm, ipc=row.ipc, idli=row.idli, idlo=row.idlo,
            itmpc=row.itmpc, idl=row.idl,
            ct=row.ct, cs=row.cs, cb=row.cb, cm=row.cm, ckap=row.ckap,
            lj=row.lj, ln=row.ln,
        )
        db.add(raw)

    upload_log.rows_imported = result.metadata.success_rows - missing_nips
    await db.commit()

    # Auto-run analytics for the uploaded period
    if result.rows:
        target_tahun = result.rows[0].tahun
        target_bulan = result.rows[0].bulan
        analytics = AnalyticsService(db)
        await analytics.proses_agregat(upload_log.id, target_tahun, target_bulan)
        await analytics.update_rankings(target_tahun, target_bulan)

    error_details = [
        UploadErrorDetail(row=e.row_number, column=e.column, value=str(e.value) if e.value else None, reason=e.reason)
        for e in result.errors
    ]

    return UploadResponse(
        status="success" if result.success else "partial_success",
        upload_id=str(upload_log.id),
        summary=UploadErrorSummary(
            total_rows=result.metadata.total_rows,
            success=result.metadata.success_rows,
            errors=result.metadata.error_rows,
            warnings=result.metadata.warning_count,
        ),
        errors=[e for e in error_details if e],
        warnings=[],
    )


@router.get("/periods")
async def list_periods(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PresensiAgregatOPD.tahun, PresensiAgregatOPD.bulan)
        .distinct()
        .order_by(PresensiAgregatOPD.tahun.desc(), PresensiAgregatOPD.bulan.desc())
        .limit(24)
    )
    periods = [{"tahun": row[0], "bulan": row[1]} for row in result.all()]
    return {"periods": periods}


@router.get("/status-opd")
async def get_opd_upload_status(
    tahun: int = Query(default=2026),
    bulan: int = Query(default=6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    opds = (await db.execute(
        select(OPD.id, OPD.kode_opd, OPD.nama_opd)
        .where(OPD.is_active == True)
        .order_by(OPD.nama_opd)
    )).all()

    aggrs = (await db.execute(
        select(
            PresensiAgregatOPD.opd_id,
            PresensiAgregatOPD.jumlah_asn,
            PresensiAgregatOPD.total_skor,
            PresensiAgregatOPD.kategori,
            PresensiAgregatOPD.created_at,
        ).where(
            PresensiAgregatOPD.tahun == tahun,
            PresensiAgregatOPD.bulan == bulan,
        )
    )).all()

    aggr_dict = {a.opd_id: a for a in aggrs}

    opd_status_list = []
    sudah_count = 0

    for o in opds:
        aggr = aggr_dict.get(o.id)
        is_uploaded = aggr is not None
        if is_uploaded:
            sudah_count += 1

        opd_status_list.append({
            "opd_id": o.id,
            "kode_opd": o.kode_opd,
            "nama_opd": o.nama_opd,
            "status": "SUDAH_UPLOAD" if is_uploaded else "BELUM_UPLOAD",
            "jumlah_asn": aggr.jumlah_asn if aggr else 0,
            "total_skor": float(aggr.total_skor) if aggr and aggr.total_skor is not None else None,
            "kategori": aggr.kategori if aggr else None,
            "created_at": aggr.created_at.isoformat() if aggr and aggr.created_at else None,
        })

    total_opd = len(opds)
    belum_count = total_opd - sudah_count
    percentage = round((sudah_count / total_opd) * 100, 1) if total_opd > 0 else 0.0

    return {
        "periode": {"tahun": tahun, "bulan": bulan},
        "summary": {
            "total_opd": total_opd,
            "sudah_upload": sudah_count,
            "belum_upload": belum_count,
            "persentase_kelengkapan": percentage,
        },
        "opd_list": opd_status_list,
    }
