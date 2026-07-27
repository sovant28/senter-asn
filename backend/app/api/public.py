from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.presensi_repo import PresensiRepository

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/ranking")
async def public_opd_ranking(
    tahun: int = Query(),
    bulan: int = Query(ge=1, le=12),
    db: AsyncSession = Depends(get_db),
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
