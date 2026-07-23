from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.middleware.auth import get_current_user, require_role
from app.models.master import User, OPD
from app.models.presensi import PresensiAgregatOPD
from app.repositories.presensi_repo import PresensiRepository

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/opd-ranking")
async def opd_ranking(
    tahun: int = Query(),
    bulan: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = PresensiRepository(db)
    rankings = await repo.get_opd_ranking(tahun, bulan)

    return {
        "periode": {"tahun": tahun, "bulan": bulan},
        "opd_count": len(rankings),
        "rankings": [
            {
                "rank": r["ranking"],
                "opd_id": r["id"],
                "nama_opd": r["nama_opd"],
                "kode_opd": r["kode_opd"],
                "total_skor": float(r["total_skor"]),
                "kategori": r["kategori"],
            }
            for r in rankings
        ],
    }


@router.get("/opd/{opd_id}")
async def opd_detail(
    opd_id: int,
    tahun: int = Query(),
    bulan: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PresensiAgregatOPD, OPD.nama_opd, OPD.kode_opd)
        .join(OPD, PresensiAgregatOPD.opd_id == OPD.id)
        .where(
            PresensiAgregatOPD.opd_id == opd_id,
            PresensiAgregatOPD.tahun == tahun,
            PresensiAgregatOPD.bulan == bulan,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(404, f"OPD id={opd_id} not found for {tahun}-{bulan:02d}")

    a, nama_opd, kode_opd = row
    return {
        "nama_opd": nama_opd,
        "kode_opd": kode_opd,
        "periode": {"tahun": a.tahun, "bulan": a.bulan},
        "komposisi": {"pns": a.pns, "pppk": a.pppk, "pppk_pw": a.pppk_pw, "jumlah": a.jumlah_asn},
        "counter": {
            "total_kewajiban_hadir": a.total_kewajiban_hadir,
            "jumlah_hadir": a.jumlah_hadir,
            "jumlah_terlambat": a.jumlah_terlambat,
            "jumlah_pulang_cepat": a.jumlah_pulang_cepat,
            "jumlah_tidak_hadir": a.jumlah_tidak_hadir,
            "jumlah_hadir_normal": a.jumlah_hadir_normal,
            "hari_kerja": a.hari_kerja,
        },
        "persentase": {
            "kehadiran": float(a.persentase_kehadiran),
            "pelanggaran": float(a.persentase_pelanggaran),
            "hadir_efektif": float(a.persentase_hadir_efektif),
            "ketidakhadiran": float(a.persentase_ketidakhadiran),
        },
        "skor": {
            "kehadiran": float(a.skor_kehadiran),
            "kepatuhan_jam_kerja": float(a.skor_kepatuhan_jam_kerja),
            "ketidakhadiran": float(a.skor_ketidakhadiran),
            "hadir_efektif": float(a.skor_hadir_efektif),
            "total": float(a.total_skor),
        },
        "kategori": a.kategori,
        "ranking": {
            "total_skor": a.ranking_total_skor,
            "kehadiran": a.ranking_kehadiran,
            "pelanggaran": a.ranking_pelanggaran,
        },
    }


@router.post("/run")
async def run_analytics(
    tahun: int = Query(),
    bulan: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN", "HR_MANAGER")),
):
    from app.services.analytics import AnalyticsService
    from app.models.presensi import UploadLog

    from uuid import uuid4

    upload_result = await db.execute(
        select(UploadLog.id).where(UploadLog.tahun == tahun, UploadLog.bulan == bulan)
        .order_by(UploadLog.created_at.desc()).limit(1)
    )
    upload_row = upload_result.first()
    upload_id = upload_row[0] if upload_row else uuid4()

    analytics = AnalyticsService(db)
    await analytics.proses_agregat(upload_id, tahun, bulan)
    await analytics.update_rankings(tahun, bulan)

    result = await db.execute(
        select(func.count(PresensiAgregatOPD.id)).where(
            PresensiAgregatOPD.tahun == tahun, PresensiAgregatOPD.bulan == bulan
        )
    )

    return {"status": "done", "tahun": tahun, "bulan": bulan, "opd_count": result.scalar()}
