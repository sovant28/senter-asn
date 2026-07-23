import io
import os
from datetime import date

import pytest
from reportlab.lib.pagesizes import A4

from app.schemas.pdf import LaporanData, OPDLaporan
from app.services.pdf_generator import SenterAsnPDFGenerator

SAMPLE_OPD_DATA = {
    "SANGAT_DISIPLIN": {"skor_min": 90, "skor_max": 95, "persen_hadir": 95},
    "DISIPLIN": {"skor_min": 80, "skor_max": 89, "persen_hadir": 85},
    "CUKUP": {"skor_min": 70, "skor_max": 79, "persen_hadir": 75},
    "KURANG": {"skor_min": 50, "skor_max": 69, "persen_hadir": 55},
}

OPD_SAMPLES = [
    ("DISDIK", "Dinas Pendidikan", 130),
    ("DINKES", "Dinas Kesehatan", 115),
    ("SETDA", "Sekretariat Daerah", 90),
    ("PUTR", "Dinas Pekerjaan Umum", 60),
    ("PERTANIAN", "Dinas Pertanian", 50),
    ("SOSIAL", "Dinas Sosial", 45),
    ("BKUD", "Badan Keuangan Daerah", 45),
    ("LINGKUNGAN", "Dinas Lingkungan Hidup", 40),
    ("PERHUBUNGAN", "Dinas Perhubungan", 40),
    ("BKPSDM", "BKPSDM", 40),
    ("PERIKANAN", "Dinas Perikanan", 35),
    ("PERDAGANGAN", "Dinas Perdagangan", 35),
    ("BAPPEDA", "Badan Perencanaan", 35),
    ("SETWAN", "Sekretariat DPRD", 35),
    ("KOMINFO", "Dinas Komunikasi", 30),
    ("PERINDUSTRIAN", "Dinas Perindustrian", 30),
    ("MASYARAKAT", "Dinas Pemberdayaan Masyarakat", 30),
    ("BALITBANG", "Badan Penelitian", 30),
    ("BPBD", "Badan Penanggulangan Bencana", 30),
    ("INSPEKTORAT", "Inspektorat", 30),
    ("PARIWISATA", "Dinas Pariwisata", 25),
    ("KEBUDAYAAN", "Dinas Kebudayaan", 25),
    ("PORA", "Dinas Pemuda dan Olahraga", 25),
    ("TRANS", "Dinas Transmigrasi", 25),
    ("PEMBERDAYAAN", "Dinas Pemberdayaan Perempuan", 25),
    ("KESBANGPOL", "Badan Kesbangpol", 25),
]


def make_opd_laporan(kode, nama, jml_asn, kategori, idx):
    meta = SAMPLE_OPD_DATA[kategori]
    skor = meta["skor_min"] + (idx % 5)
    hadir_pct = meta["persen_hadir"] - (idx % 3)
    pelanggaran_pct = 100 - hadir_pct - 5
    hn = int(jml_asn * 20)
    kewajiban = jml_asn * 22
    tl = int(kewajiban * pelanggaran_pct / 100)
    td = kewajiban - hn - tl

    return OPDLaporan(
        kode_opd=kode,
        nama_opd=nama,
        jumlah_asn=jml_asn,
        pns=int(jml_asn * 0.6),
        pppk=int(jml_asn * 0.3),
        pppk_pw=int(jml_asn * 0.1),
        hari_kerja=22,
        total_kewajiban_hadir=kewajiban,
        jumlah_hadir=hn,
        jumlah_terlambat=tl,
        jumlah_pulang_cepat=max(0, tl // 3),
        jumlah_tidak_hadir=max(0, td),
        jumlah_hadir_normal=hn - tl,
        persentase_kehadiran=hadir_pct,
        persentase_pelanggaran=pelanggaran_pct,
        persentase_hadir_efektif=hadir_pct - 2,
        persentase_ketidakhadiran=5.0 + (idx % 3),
        skor_kehadiran=hadir_pct * 0.25,
        skor_kepatuhan_jam_kerja=(100 - pelanggaran_pct) * 0.20,
        skor_ketidakhadiran=(95 - idx % 3) * 0.15,
        skor_hadir_efektif=(hadir_pct - 2) * 0.40,
        total_skor=skor,
        kategori=kategori,
        ranking_kehadiran=idx + 1,
        ranking_pelanggaran=idx + 1,
        ranking_total_skor=idx + 1,
    )


def make_test_data() -> LaporanData:
    kategoris = ["SANGAT_DISIPLIN", "DISIPLIN", "CUKUP", "KURANG"]
    opds = []
    for i, (kode, nama, jml) in enumerate(OPD_SAMPLES):
        kategoris_list = kategoris * 7
        kat = kategoris_list[i % 26] if i < 26 else kategoris[i % 4]
        opds.append(make_opd_laporan(kode, nama, jml, kat, i))

    return LaporanData(
        periode=date(2026, 5, 1),
        bulan_name="Mei",
        tahun=2026,
        bulan=5,
        opd_list=opds,
    )


@pytest.fixture
def data():
    return make_test_data()


class TestPDFGenerator:
    def test_generate_pdf_bytes(self, data):
        gen = SenterAsnPDFGenerator(data)
        pdf_bytes = gen.generate()

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes[:4] == b"%PDF"

    def test_generate_has_5_pages(self, data):
        gen = SenterAsnPDFGenerator(data)
        pdf_bytes = gen.generate()

        page_count = pdf_bytes.count(b"/Type /Page") - pdf_bytes.count(b"/Type /Pages")
        assert page_count >= 5

    def test_save_to_file(self, data, tmp_path):
        output = tmp_path / "test-output.pdf"
        gen = SenterAsnPDFGenerator(data)
        path = gen.save(str(output))

        assert os.path.isfile(path)
        assert os.path.getsize(path) > 0

    def test_distribusi_kategori(self, data):
        dist = data.distribusi_kategori
        total = sum(dist.values())
        assert total == len(OPD_SAMPLES)
        assert total == 26

    def test_ranking_consistency(self, data):
        r = data.ranking_total_skor
        assert r[0].total_skor >= r[-1].total_skor
        assert len(r) == 26

    def test_top_5_and_bottom_5(self, data):
        assert len(data.top_5) == 5
        assert len(data.bottom_5) == 5


def test_generate_sample_pdf():
    """Generate sample PDF file for manual inspection"""
    data = make_test_data()
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "samples", "sample-output.pdf"
    )
    output_path = os.path.abspath(output_path)
    gen = SenterAsnPDFGenerator(data)
    path = gen.save(output_path)

    file_size = os.path.getsize(path)
    assert file_size > 0
    assert file_size < 5 * 1024 * 1024

    print(f"\nSample PDF generated: {path}")
    print(f"File size: {file_size / 1024:.1f} KB")
    print(f"Page count:  5")
    print(f"Total OPD:   {len(OPD_SAMPLES)}")
