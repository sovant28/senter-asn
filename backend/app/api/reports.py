import tempfile
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.models.master import OPD, User
from app.models.presensi import PresensiAgregatOPD
from app.schemas.pdf import LaporanData, OPDLaporan
from app.services.auth import verify_access_token, get_user_by_id
from app.services.pdf_generator import SenterAsnPDFGenerator

router = APIRouter(prefix="/reports", tags=["reports"])

BULAN_NAMES = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


async def _auth_pdf(
    token: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token:
        payload = verify_access_token(token)
        user = await get_user_by_id(db, int(payload["sub"]))
        if not user or not user.is_active:
            raise HTTPException(401, "Invalid token")
        return user
    raise HTTPException(401, "Not authenticated")


@router.get("/pdf")
async def generate_pdf(
    tahun: int = Query(),
    bulan: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_auth_pdf),
):
    result = await db.execute(
        select(PresensiAgregatOPD, OPD.nama_opd, OPD.kode_opd, OPD.tipe_opd)
        .join(OPD, PresensiAgregatOPD.opd_id == OPD.id)
        .where(
            PresensiAgregatOPD.tahun == tahun,
            PresensiAgregatOPD.bulan == bulan,
        )
    )
    rows = result.all()
    if not rows:
        raise HTTPException(404, f"No data for {tahun}-{bulan:02d}")

    opd_list = []
    for a, nama, kode, tipe in rows:
        opd_list.append(OPDLaporan(
            kode_opd=kode,
            nama_opd=nama,
            jumlah_asn=a.jumlah_asn,
            pns=a.pns,
            pppk=a.pppk,
            pppk_pw=a.pppk_pw,
            hari_kerja=a.hari_kerja,
            total_kewajiban_hadir=a.total_kewajiban_hadir,
            jumlah_hadir=a.jumlah_hadir,
            jumlah_terlambat=a.jumlah_terlambat,
            jumlah_pulang_cepat=a.jumlah_pulang_cepat,
            jumlah_tidak_hadir=a.jumlah_tidak_hadir,
            jumlah_hadir_normal=a.jumlah_hadir_normal,
            persentase_kehadiran=float(a.persentase_kehadiran),
            persentase_pelanggaran=float(a.persentase_pelanggaran),
            persentase_hadir_efektif=float(a.persentase_hadir_efektif),
            persentase_ketidakhadiran=float(a.persentase_ketidakhadiran),
            skor_kehadiran=float(a.skor_kehadiran),
            skor_kepatuhan_jam_kerja=float(a.skor_kepatuhan_jam_kerja),
            skor_ketidakhadiran=float(a.skor_ketidakhadiran),
            skor_hadir_efektif=float(a.skor_hadir_efektif),
            total_skor=float(a.total_skor),
            kategori=a.kategori,
            ranking_kehadiran=a.ranking_kehadiran,
            ranking_pelanggaran=a.ranking_pelanggaran,
            ranking_total_skor=a.ranking_total_skor,
        ))

    data = LaporanData(
        periode=date(tahun, bulan, 1),
        bulan_name=BULAN_NAMES[bulan],
        tahun=tahun,
        bulan=bulan,
        opd_list=opd_list,
    )

    gen = SenterAsnPDFGenerator(data)
    pdf_bytes = gen.generate()

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.write(pdf_bytes)
    tmp.close()

    return FileResponse(
        tmp.name,
        media_type="application/pdf",
        filename=f"SENTER-ASN-{tahun}-{bulan:02d}.pdf",
    )
