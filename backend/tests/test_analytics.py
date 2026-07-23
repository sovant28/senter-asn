import pytest

from app.schemas.analytics import AgregatCounter, PresensiRowAggr
from app.services.analytics import (
    hitung_counter_agregat,
    hitung_persentase,
    hitung_skor,
    tentukan_kategori,
    KATEGORI_SANGAT_DISIPLIN,
    KATEGORI_DISIPLIN,
    KATEGORI_CUKUP,
    KATEGORI_KURANG,
)


def make_row(
    pegawai_id=1,
    opd_id=1,
    jenis_asn="PNS",
    hn=20,
    tm1=0,
    tm2=0,
    tm3=0,
    pc1=0,
    pc2=0,
    pc3=0,
    **kwargs,
):
    return PresensiRowAggr(
        pegawai_id=pegawai_id,
        opd_id=opd_id,
        jenis_asn=jenis_asn,
        hn=hn,
        tm1=tm1,
        tm2=tm2,
        tm3=tm3,
        pc1=pc1,
        pc2=pc2,
        pc3=pc3,
        **kwargs,
    )


class TestHitungCounterAgregat:
    def test_normal_data(self):
        rows = [
            make_row(pegawai_id=1, jenis_asn="PNS", hn=20, tm1=2),
            make_row(pegawai_id=2, jenis_asn="PPPK", hn=18, pc1=1),
            make_row(pegawai_id=3, jenis_asn="PPPK_PW", hn=22),
        ]
        hari_kerja = 22

        c = hitung_counter_agregat(rows, hari_kerja)

        assert c.pns == 1
        assert c.pppk == 1
        assert c.pppk_pw == 1
        assert c.jumlah_asn == 3
        assert c.hari_kerja == 22
        assert c.total_kewajiban_hadir == 66
        assert c.jumlah_hadir == 66
        assert c.jumlah_terlambat == 2
        assert c.jumlah_pulang_cepat == 1
        assert c.jumlah_hadir_normal == 60
        assert c.jumlah_tidak_hadir == 0

    def test_empty_rows(self):
        c = hitung_counter_agregat([], 20)

        assert c.pns == 0
        assert c.pppk == 0
        assert c.pppk_pw == 0
        assert c.jumlah_asn == 0
        assert c.total_kewajiban_hadir == 0
        assert c.jumlah_hadir == 0
        assert c.hari_kerja == 20

    def test_mixed_jenis_asn(self):
        rows = [
            make_row(pegawai_id=1, jenis_asn="PNS", hn=0, tk=20),
            make_row(pegawai_id=2, jenis_asn="PNS", hn=10, tk=10),
            make_row(pegawai_id=3, jenis_asn="PPPK", hn=5, tk=15),
        ]

        c = hitung_counter_agregat(rows, 20)

        assert c.pns == 2
        assert c.pppk == 1
        assert c.pppk_pw == 0
        assert c.jumlah_hadir == 15
        assert c.jumlah_tidak_hadir == 45

    def test_tidak_hadir_positive(self):
        rows = [
            make_row(pegawai_id=1, jenis_asn="PNS", hn=5, tm1=10, tm2=3, tk=4),
        ]
        c = hitung_counter_agregat(rows, 22)

        assert c.total_kewajiban_hadir == 22
        assert c.jumlah_hadir == 18
        assert c.jumlah_terlambat == 13
        assert c.jumlah_pulang_cepat == 0
        assert c.jumlah_hadir_normal == 5
        assert c.jumlah_tidak_hadir == 4

    def test_tidak_hadir_clamped_to_zero(self):
        rows = [
            make_row(pegawai_id=1, jenis_asn="PNS", hn=30, tm1=0),
        ]
        c = hitung_counter_agregat(rows, 22)

        assert c.jumlah_tidak_hadir == 0


class TestHitungPersentase:
    def test_normal_case(self):
        c = AgregatCounter(
            total_kewajiban_hadir=66,
            jumlah_hadir=60,
            jumlah_terlambat=5,
            jumlah_pulang_cepat=1,
            jumlah_hadir_normal=50,
            jumlah_tidak_hadir=0,
        )

        p = hitung_persentase(c)

        assert p.persentase_kehadiran == round((60 / 66) * 100, 2)
        assert p.persentase_pelanggaran == round((6 / 66) * 100, 2)
        assert p.persentase_hadir_efektif == round((50 / 66) * 100, 2)
        assert p.persentase_ketidakhadiran == 0.0

    def test_zero_kewajiban(self):
        c = AgregatCounter()
        p = hitung_persentase(c)

        assert p.persentase_kehadiran == 0.0
        assert p.persentase_pelanggaran == 0.0
        assert p.persentase_hadir_efektif == 0.0
        assert p.persentase_ketidakhadiran == 0.0


class TestHitungSkor:
    def test_perfect_score(self):
        from app.schemas.analytics import AgregatPersentase

        p = AgregatPersentase(
            persentase_kehadiran=100.0,
            persentase_pelanggaran=0.0,
            persentase_hadir_efektif=100.0,
            persentase_ketidakhadiran=0.0,
        )

        s = hitung_skor(p)

        assert s.skor_kehadiran == 25.0
        assert s.skor_kepatuhan_jam_kerja == 20.0
        assert s.skor_ketidakhadiran == 15.0
        assert s.skor_hadir_efektif == 40.0
        assert s.total_skor == 100.0

    def test_mid_range_score(self):
        from app.schemas.analytics import AgregatPersentase

        p = AgregatPersentase(
            persentase_kehadiran=80.0,
            persentase_pelanggaran=10.0,
            persentase_hadir_efektif=70.0,
            persentase_ketidakhadiran=10.0,
        )

        s = hitung_skor(p)

        assert s.skor_kehadiran == 20.0
        assert s.skor_kepatuhan_jam_kerja == 18.0
        assert s.skor_ketidakhadiran == 13.5
        assert s.skor_hadir_efektif == 28.0
        assert s.total_skor == 79.5

    def test_worst_score(self):
        from app.schemas.analytics import AgregatPersentase

        p = AgregatPersentase(
            persentase_kehadiran=0.0,
            persentase_pelanggaran=100.0,
            persentase_hadir_efektif=0.0,
            persentase_ketidakhadiran=100.0,
        )

        s = hitung_skor(p)

        assert s.skor_kehadiran == 0.0
        assert s.skor_kepatuhan_jam_kerja == 0.0
        assert s.skor_ketidakhadiran == 0.0
        assert s.skor_hadir_efektif == 0.0
        assert s.total_skor == 0.0


class TestTentukanKategori:
    @pytest.mark.parametrize("skor,expected", [
        (95.0, KATEGORI_SANGAT_DISIPLIN),
        (90.0, KATEGORI_SANGAT_DISIPLIN),
        (89.9, KATEGORI_DISIPLIN),
        (85.0, KATEGORI_DISIPLIN),
        (80.0, KATEGORI_DISIPLIN),
        (79.9, KATEGORI_CUKUP),
        (75.0, KATEGORI_CUKUP),
        (70.0, KATEGORI_CUKUP),
        (69.9, KATEGORI_KURANG),
        (50.0, KATEGORI_KURANG),
        (0.0, KATEGORI_KURANG),
    ])
    def test_all_thresholds(self, skor, expected):
        assert tentukan_kategori(skor) == expected


class TestEndToEnd:
    def test_full_pipeline(self):
        rows = [
            make_row(pegawai_id=1, jenis_asn="PNS", hn=20, tm1=2),
            make_row(pegawai_id=2, jenis_asn="PNS", hn=22),
            make_row(pegawai_id=3, jenis_asn="PPPK", hn=15, pc1=1),
            make_row(pegawai_id=4, jenis_asn="PPPK_PW", hn=18, tm1=1, pc2=1),
        ]
        hari_kerja = 22

        c = hitung_counter_agregat(rows, hari_kerja)
        p = hitung_persentase(c)
        s = hitung_skor(p)
        kategori = tentukan_kategori(s.total_skor)

        assert c.jumlah_asn == 4
        assert c.total_kewajiban_hadir == 88
        assert round(s.total_skor, 2) == round(
            s.skor_kehadiran + s.skor_kepatuhan_jam_kerja + s.skor_ketidakhadiran + s.skor_hadir_efektif,
            2,
        )
        assert kategori in (
            KATEGORI_SANGAT_DISIPLIN,
            KATEGORI_DISIPLIN,
            KATEGORI_CUKUP,
            KATEGORI_KURANG,
        )
