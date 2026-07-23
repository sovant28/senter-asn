from dataclasses import dataclass, field
from datetime import date


@dataclass
class OPDLaporan:
    kode_opd: str
    nama_opd: str
    jumlah_asn: int
    pns: int
    pppk: int
    pppk_pw: int
    hari_kerja: int
    total_kewajiban_hadir: int
    jumlah_hadir: int
    jumlah_terlambat: int
    jumlah_pulang_cepat: int
    jumlah_tidak_hadir: int
    jumlah_hadir_normal: int
    persentase_kehadiran: float
    persentase_pelanggaran: float
    persentase_hadir_efektif: float
    persentase_ketidakhadiran: float
    skor_kehadiran: float
    skor_kepatuhan_jam_kerja: float
    skor_ketidakhadiran: float
    skor_hadir_efektif: float
    total_skor: float
    kategori: str
    ranking_kehadiran: int | None = None
    ranking_pelanggaran: int | None = None
    ranking_total_skor: int | None = None


@dataclass
class LaporanData:
    periode: date
    bulan_name: str
    tahun: int
    bulan: int
    opd_list: list[OPDLaporan] = field(default_factory=list)

    @property
    def total_opd(self) -> int:
        return len(self.opd_list)

    @property
    def total_asn(self) -> int:
        return sum(o.jumlah_asn for o in self.opd_list)

    @property
    def distribusi_kategori(self) -> dict[str, int]:
        dist = {
            "SANGAT_DISIPLIN": 0,
            "DISIPLIN": 0,
            "CUKUP": 0,
            "KURANG": 0,
        }
        for o in self.opd_list:
            if o.kategori in dist:
                dist[o.kategori] += 1
        return dist

    @property
    def ranking_ketidakhadiran(self) -> list[OPDLaporan]:
        return sorted(
            self.opd_list, key=lambda o: o.persentase_ketidakhadiran
        )

    @property
    def ranking_pelanggaran(self) -> list[OPDLaporan]:
        return sorted(
            self.opd_list, key=lambda o: o.persentase_pelanggaran
        )

    @property
    def ranking_kehadiran(self) -> list[OPDLaporan]:
        return sorted(
            self.opd_list, key=lambda o: o.persentase_kehadiran, reverse=True
        )

    @property
    def ranking_efektif(self) -> list[OPDLaporan]:
        return sorted(
            self.opd_list, key=lambda o: o.persentase_hadir_efektif, reverse=True
        )

    @property
    def ranking_total_skor(self) -> list[OPDLaporan]:
        return sorted(
            self.opd_list, key=lambda o: o.total_skor, reverse=True
        )

    @property
    def top_5(self) -> list[OPDLaporan]:
        return self.ranking_total_skor[:5]

    @property
    def bottom_5(self) -> list[OPDLaporan]:
        return self.ranking_total_skor[-5:][::-1]
