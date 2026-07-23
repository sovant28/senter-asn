from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.presensi import PresensiRaw, PresensiAgregatOPD
from app.models.master import OPD


class PresensiRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_agregat_by_periode(
        self, tahun: int, bulan: int
    ) -> list[PresensiAgregatOPD]:
        result = await self.session.execute(
            select(PresensiAgregatOPD)
            .join(OPD, PresensiAgregatOPD.opd_id == OPD.id)
            .where(
                PresensiAgregatOPD.tahun == tahun,
                PresensiAgregatOPD.bulan == bulan,
                OPD.is_active == True,
            )
            .order_by(PresensiAgregatOPD.total_skor.desc())
        )
        return list(result.scalars().all())

    async def get_opd_ranking(
        self, tahun: int, bulan: int
    ) -> list[dict]:
        result = await self.session.execute(
            select(
                OPD.id,
                OPD.nama_opd,
                OPD.kode_opd,
                PresensiAgregatOPD.total_skor,
                PresensiAgregatOPD.kategori,
                func.rank()
                .over(order_by=PresensiAgregatOPD.total_skor.desc())
                .label("ranking"),
            )
            .join(OPD, PresensiAgregatOPD.opd_id == OPD.id)
            .where(
                PresensiAgregatOPD.tahun == tahun,
                PresensiAgregatOPD.bulan == bulan,
                OPD.is_active == True,
            )
            .order_by(PresensiAgregatOPD.total_skor.desc())
        )
        return [dict(row._mapping) for row in result]

    async def bulk_insert_raw(self, rows: list[PresensiRaw]) -> None:
        self.session.add_all(rows)
        await self.session.commit()

    async def get_raw_by_pegawai_periode(
        self, pegawai_id: int, tahun: int, bulan: int
    ) -> PresensiRaw | None:
        result = await self.session.execute(
            select(PresensiRaw).where(
                PresensiRaw.pegawai_id == pegawai_id,
                PresensiRaw.tahun == tahun,
                PresensiRaw.bulan == bulan,
            )
        )
        return result.scalar_one_or_none()
