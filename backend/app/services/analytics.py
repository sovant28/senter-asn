from typing import Optional
from uuid import UUID

from sqlalchemy import select, text, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import OPD, Pegawai
from app.models.presensi import PresensiRaw, PresensiAgregatOPD
from app.schemas.analytics import (
    AgregatCounter,
    AgregatPersentase,
    AgregatSkor,
    PresensiRowAggr,
)

BOBOT_KEHADIRAN = 0.25
BOBOT_KEPATUHAN_JAM_KERJA = 0.20
BOBOT_KETIDAKHADIRAN = 0.15
BOBOT_HADIR_EFEKTIF = 0.40

KATEGORI_SANGAT_DISIPLIN = "SANGAT_DISIPLIN"
KATEGORI_DISIPLIN = "DISIPLIN"
KATEGORI_CUKUP = "CUKUP"
KATEGORI_KURANG = "KURANG"

DEFAULT_HARI_KERJA = 22


def hitung_counter_agregat(
    rows: list[PresensiRowAggr], hari_kerja: int
) -> AgregatCounter:
    if not rows:
        return AgregatCounter(hari_kerja=hari_kerja)

    pns = sum(1 for r in rows if r.jenis_asn == "PNS")
    pppk = sum(1 for r in rows if r.jenis_asn == "PPPK")
    pppk_pw = sum(1 for r in rows if r.jenis_asn == "PPPK_PW")
    jumlah_asn = len(rows)
    total_kewajiban = jumlah_asn * hari_kerja

    jumlah_terlambat = sum(r.tm1 + r.tm2 + r.tm3 + r.tmm + r.itm for r in rows)
    jumlah_pulang_cepat = sum(r.pc1 + r.pc2 + r.pc3 + r.pcm + r.ipc for r in rows)
    jumlah_hadir_normal = sum(r.hn + r.dl + r.ct + r.cs + r.cb + r.cm + r.ckap for r in rows)
    jumlah_tidak_hadir = sum(r.tk + r.itmpc + r.tb for r in rows)
    jumlah_hadir = total_kewajiban - jumlah_tidak_hadir

    return AgregatCounter(
        pns=pns,
        pppk=pppk,
        pppk_pw=pppk_pw,
        jumlah_asn=jumlah_asn,
        hari_kerja=hari_kerja,
        total_kewajiban_hadir=total_kewajiban,
        jumlah_hadir=jumlah_hadir,
        jumlah_terlambat=jumlah_terlambat,
        jumlah_pulang_cepat=jumlah_pulang_cepat,
        jumlah_tidak_hadir=jumlah_tidak_hadir,
        jumlah_hadir_normal=jumlah_hadir_normal,
    )


def hitung_persentase(counter: AgregatCounter) -> AgregatPersentase:
    if counter.total_kewajiban_hadir == 0:
        return AgregatPersentase()

    total = counter.total_kewajiban_hadir
    return AgregatPersentase(
        persentase_kehadiran=min(round((counter.jumlah_hadir / total) * 100, 2), 100.0),
        persentase_pelanggaran=min(
            round(((counter.jumlah_terlambat + counter.jumlah_pulang_cepat) / total) * 100, 2),
            100.0,
        ),
        persentase_hadir_efektif=min(round((counter.jumlah_hadir_normal / total) * 100, 2), 100.0),
        persentase_ketidakhadiran=min(
            round((counter.jumlah_tidak_hadir / total) * 100, 2), 100.0
        ),
    )


def hitung_skor(persen: AgregatPersentase) -> AgregatSkor:
    nilai_kepatuhan = round(100 - persen.persentase_pelanggaran, 2)
    nilai_ketidakhadiran = round(100 - persen.persentase_ketidakhadiran, 2)

    skor_kehadiran = round(persen.persentase_kehadiran * BOBOT_KEHADIRAN, 2)
    skor_kepatuhan = round(nilai_kepatuhan * BOBOT_KEPATUHAN_JAM_KERJA, 2)
    skor_ketidakhadiran = round(nilai_ketidakhadiran * BOBOT_KETIDAKHADIRAN, 2)
    skor_hadir_efektif = round(persen.persentase_hadir_efektif * BOBOT_HADIR_EFEKTIF, 2)

    total_skor = round(
        skor_kehadiran + skor_kepatuhan + skor_ketidakhadiran + skor_hadir_efektif, 2
    )

    return AgregatSkor(
        nilai_kepatuhan_jam_kerja=nilai_kepatuhan,
        nilai_ketidakhadiran=nilai_ketidakhadiran,
        skor_kehadiran=skor_kehadiran,
        skor_kepatuhan_jam_kerja=skor_kepatuhan,
        skor_ketidakhadiran=skor_ketidakhadiran,
        skor_hadir_efektif=skor_hadir_efektif,
        total_skor=total_skor,
    )


def tentukan_kategori(total_skor: float) -> str:
    if total_skor >= 90:
        return KATEGORI_SANGAT_DISIPLIN
    if total_skor >= 80:
        return KATEGORI_DISIPLIN
    if total_skor >= 70:
        return KATEGORI_CUKUP
    return KATEGORI_KURANG


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def proses_agregat(
        self,
        upload_id: UUID,
        tahun: int,
        bulan: int,
    ) -> list[PresensiAgregatOPD]:
        result_hari_kerja = await self.session.execute(
            text("""
                SELECT p.opd_id,
                       COALESCE(
                           mode() WITHIN GROUP (ORDER BY (
                                r.hn + r.dl + r.tk + r.tb + r.tm1 + r.tm2 + r.tm3 + r.pc1 + r.pc2 + r.pc3 +
                                r.itm + r.ipc + r.itmpc + r.idl + r.ct + r.cs + r.cb + r.cm + r.ckap
                            )),
                            :default_hari_kerja
                       ) AS mode_days
                FROM presensi.presensi_raw r
                JOIN master.pegawai p ON r.pegawai_id = p.id
                WHERE r.tahun = :tahun AND r.bulan = :bulan
                GROUP BY p.opd_id
            """),
            {"tahun": tahun, "bulan": bulan, "default_hari_kerja": DEFAULT_HARI_KERJA},
        )
        opd_hari_kerja = {row.opd_id: row.mode_days for row in result_hari_kerja.all()}

        # Delete existing aggregates for this period (clean recalculation slate)
        await self.session.execute(
            delete(PresensiAgregatOPD).where(
                PresensiAgregatOPD.tahun == tahun,
                PresensiAgregatOPD.bulan == bulan,
            )
        )

        opds = await self._get_active_opds()
        results: list[PresensiAgregatOPD] = []

        for opd in opds:
            rows = await self._fetch_presensi_rows(opd.id, upload_id, tahun, bulan)
            if not rows:
                continue

            hari_kerja = opd_hari_kerja.get(opd.id, DEFAULT_HARI_KERJA)
            counter = hitung_counter_agregat(rows, hari_kerja)
            if counter.total_kewajiban_hadir == 0:
                continue

            persen = hitung_persentase(counter)
            skor = hitung_skor(persen)
            kategori = tentukan_kategori(skor.total_skor)

            agregat = PresensiAgregatOPD(
                upload_id=upload_id,
                opd_id=opd.id,
                tahun=tahun,
                bulan=bulan,
                pns=counter.pns,
                pppk=counter.pppk,
                pppk_pw=counter.pppk_pw,
                jumlah_asn=counter.jumlah_asn,
                hari_kerja=counter.hari_kerja,
                total_kewajiban_hadir=counter.total_kewajiban_hadir,
                jumlah_hadir=counter.jumlah_hadir,
                jumlah_terlambat=counter.jumlah_terlambat,
                jumlah_pulang_cepat=counter.jumlah_pulang_cepat,
                jumlah_tidak_hadir=counter.jumlah_tidak_hadir,
                jumlah_hadir_normal=counter.jumlah_hadir_normal,
                persentase_kehadiran=persen.persentase_kehadiran,
                persentase_pelanggaran=persen.persentase_pelanggaran,
                persentase_hadir_efektif=persen.persentase_hadir_efektif,
                persentase_ketidakhadiran=persen.persentase_ketidakhadiran,
                nilai_kepatuhan_jam_kerja=skor.nilai_kepatuhan_jam_kerja,
                nilai_ketidakhadiran=skor.nilai_ketidakhadiran,
                skor_kehadiran=skor.skor_kehadiran,
                skor_kepatuhan_jam_kerja=skor.skor_kepatuhan_jam_kerja,
                skor_ketidakhadiran=skor.skor_ketidakhadiran,
                skor_hadir_efektif=skor.skor_hadir_efektif,
                total_skor=skor.total_skor,
                kategori=kategori,
            )
            self.session.add(agregat)
            results.append(agregat)

        await self.session.commit()
        return results

    async def update_rankings(self, tahun: int, bulan: int) -> None:
        await self.session.execute(
            text("""
                UPDATE presensi.presensi_agregat_opd t
                SET
                    ranking_kehadiran = sub.rk,
                    ranking_pelanggaran = sub.rp,
                    ranking_total_skor = sub.rt
                FROM (
                    SELECT
                        a.id,
                        RANK() OVER (PARTITION BY a.tahun, a.bulan ORDER BY a.persentase_kehadiran DESC) AS rk,
                        RANK() OVER (PARTITION BY a.tahun, a.bulan ORDER BY a.persentase_pelanggaran ASC) AS rp,
                        RANK() OVER (PARTITION BY a.tahun, a.bulan ORDER BY a.total_skor DESC) AS rt
                    FROM presensi.presensi_agregat_opd a
                    JOIN master.opd o ON a.opd_id = o.id
                    WHERE a.tahun = :tahun AND a.bulan = :bulan AND o.is_active = True
                ) sub
                WHERE t.id = sub.id
            """),
            {"tahun": tahun, "bulan": bulan},
        )
        await self.session.commit()

    async def _get_active_opds(self) -> list[OPD]:
        result = await self.session.execute(
            select(OPD).where(OPD.is_active == True).order_by(OPD.nama_opd)
        )
        return list(result.scalars().all())

    async def _fetch_presensi_rows(
        self,
        opd_id: int,
        upload_id: UUID,
        tahun: int,
        bulan: int,
    ) -> list[PresensiRowAggr]:
        result = await self.session.execute(
            select(
                PresensiRaw.pegawai_id,
                Pegawai.opd_id,
                Pegawai.jenis_asn,
                PresensiRaw.hn,
                PresensiRaw.dl,
                PresensiRaw.tk,
                PresensiRaw.tb,
                PresensiRaw.tm1,
                PresensiRaw.tm2,
                PresensiRaw.tm3,
                PresensiRaw.tmm,
                PresensiRaw.pc1,
                PresensiRaw.pc2,
                PresensiRaw.pc3,
                PresensiRaw.pcm,
                PresensiRaw.itm,
                PresensiRaw.ipc,
                PresensiRaw.itmpc,
                PresensiRaw.ct,
                PresensiRaw.cs,
                PresensiRaw.cb,
                PresensiRaw.cm,
                PresensiRaw.ckap,
            )
            .join(Pegawai, PresensiRaw.pegawai_id == Pegawai.id)
            .where(
                Pegawai.opd_id == opd_id,
                PresensiRaw.tahun == tahun,
                PresensiRaw.bulan == bulan,
            )
        )
        return [
            PresensiRowAggr(
                pegawai_id=row.pegawai_id,
                opd_id=row.opd_id,
                jenis_asn=row.jenis_asn,
                hn=row.hn or 0,
                dl=row.dl or 0,
                tk=row.tk or 0,
                tb=row.tb or 0,
                tm1=row.tm1 or 0,
                tm2=row.tm2 or 0,
                tm3=row.tm3 or 0,
                tmm=row.tmm or 0,
                pc1=row.pc1 or 0,
                pc2=row.pc2 or 0,
                pc3=row.pc3 or 0,
                pcm=row.pcm or 0,
                itm=row.itm or 0,
                ipc=row.ipc or 0,
                itmpc=row.itmpc or 0,
                ct=row.ct or 0,
                cs=row.cs or 0,
                cb=row.cb or 0,
                cm=row.cm or 0,
                ckap=row.ckap or 0,
            )
            for row in result
        ]
