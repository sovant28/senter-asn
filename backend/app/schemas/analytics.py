from dataclasses import dataclass, field


@dataclass
class AgregatCounter:
    pns: int = 0
    pppk: int = 0
    pppk_pw: int = 0
    jumlah_asn: int = 0
    hari_kerja: int = 0
    total_kewajiban_hadir: int = 0
    jumlah_hadir: int = 0
    jumlah_terlambat: int = 0
    jumlah_pulang_cepat: int = 0
    jumlah_tidak_hadir: int = 0
    jumlah_hadir_normal: int = 0


@dataclass
class AgregatPersentase:
    persentase_kehadiran: float = 0.0
    persentase_pelanggaran: float = 0.0
    persentase_hadir_efektif: float = 0.0
    persentase_ketidakhadiran: float = 0.0


@dataclass
class AgregatSkor:
    nilai_kepatuhan_jam_kerja: float = 0.0
    nilai_ketidakhadiran: float = 0.0
    skor_kehadiran: float = 0.0
    skor_kepatuhan_jam_kerja: float = 0.0
    skor_ketidakhadiran: float = 0.0
    skor_hadir_efektif: float = 0.0
    total_skor: float = 0.0
    kategori: str = ""


@dataclass
class PresensiRowAggr:
    pegawai_id: int
    opd_id: int
    jenis_asn: str
    hn: int = 0
    dl: int = 0
    tk: int = 0
    tb: int = 0
    tm1: int = 0
    tm2: int = 0
    tm3: int = 0
    pc1: int = 0
    pc2: int = 0
    pc3: int = 0
    tmm: int = 0
    pcm: int = 0
    itm: int = 0
    ipc: int = 0
    itmpc: int = 0
    ct: int = 0
    cs: int = 0
    cb: int = 0
    cm: int = 0
    ckap: int = 0

    @property
    def total_hadir(self) -> int:
        return self.hn + self.dl + self.tk + self.tb
