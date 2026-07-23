import openpyxl
import pytest

from app.schemas.presensi import EXCEL_HEADER_COLS
from app.services.excel_parser import ExcelPresensiParser


def make_test_xlsx(path, rows, headers=None):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    h = headers or EXCEL_HEADER_COLS
    ws.append(h)
    for row in rows:
        if isinstance(row, dict):
            ws.append([row.get(col) for col in h])
        else:
            ws.append(list(row))
    wb.save(path)
    wb.close()


@pytest.fixture
def parser():
    return ExcelPresensiParser()


@pytest.fixture
def parser_with_opd():
    return ExcelPresensiParser(
        opd_names={"Dinas Pendidikan", "Dinas Kesehatan", "BKPSDM"}
    )


class TestFileValidation:
    def test_reject_non_xlsx_extension(self, tmp_path, parser):
        f = tmp_path / "test.csv"
        f.write_text("a,b,c")
        with pytest.raises(ValueError, match="Only .xlsx files"):
            parser.parse(str(f))

    def test_reject_oversized_file(self, tmp_path, parser, monkeypatch):
        monkeypatch.setattr(ExcelPresensiParser, "MAX_SIZE_MB", 0)
        f = tmp_path / "test.xlsx"
        make_test_xlsx(f, [])
        with pytest.raises(ValueError, match="exceeds maximum"):
            parser.parse(str(f))

    def test_reject_not_a_zip(self, tmp_path, parser):
        f = tmp_path / "fake.xlsx"
        f.write_bytes(b"not a zip file at all")
        with pytest.raises(ValueError, match="not a valid .xlsx"):
            parser.parse(str(f))


class TestValidParsing:
    def test_parse_valid_rows(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [
            {
                "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Budi Santoso",
                "TAHUN": 2026, "UNIT KERJA": "Dinas Pendidikan", "BULAN": 5,
                "HN": 20, "TM1": 2, "PC1": 0,
            },
            {
                "NO URUT": 2, "NIP": None, "NAMA": "Ani Mulyani",
                "TAHUN": 2026, "UNIT KERJA": "Dinas Kesehatan", "BULAN": 5,
                "HN": 22, "DL": 3,
            },
        ])

        result = parser.parse(str(f))

        assert result.success
        assert len(result.rows) == 2
        assert result.metadata.total_rows == 2
        assert result.metadata.success_rows == 2
        assert result.metadata.error_rows == 0

        row0 = result.rows[0]
        assert row0.nip == "123456789012345678"
        assert row0.nama == "Budi Santoso"
        assert row0.hn == 20
        assert row0.tm1 == 2
        assert row0.pc1 == 0

        row1 = result.rows[1]
        assert row1.nip is None
        assert row1.dl == 3
        assert row1.tm1 == 0

    def test_parse_with_sha256_hash(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
        }])

        result = parser.parse(str(f))

        assert result.metadata.file_hash is not None
        assert len(result.metadata.file_hash) == 64
        assert all(c in "0123456789abcdef" for c in result.metadata.file_hash)


class TestHeaderValidation:
    def test_missing_header_column(self, tmp_path, parser):
        f = tmp_path / "bad.xlsx"
        bad_headers = [h for h in EXCEL_HEADER_COLS if h != "NIP"]
        make_test_xlsx(f, [
            {
                "NO URUT": 1, "NAMA": "Test",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            }
        ], headers=bad_headers)

        result = parser.parse(str(f))

        assert not result.success
        assert len(result.errors) == 1
        assert "NIP" in result.errors[0].reason

    def test_extra_header_column(self, tmp_path, parser):
        f = tmp_path / "bad.xlsx"
        extra_headers = EXCEL_HEADER_COLS + ["EXTRA_COL"]
        make_test_xlsx(f, [
            {
                "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
                "EXTRA_COL": "x",
            }
        ], headers=extra_headers)

        result = parser.parse(str(f))

        assert not result.success
        assert "Unexpected extra columns" in result.errors[0].reason


class TestRowValidation:
    def test_invalid_nip_rejected(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [
            {
                "NO URUT": 1, "NIP": "12345", "NAMA": "Bad NIP",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            },
            {
                "NO URUT": 2, "NIP": "123456789012345678", "NAMA": "Good NIP",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            },
        ])

        result = parser.parse(str(f))

        assert not result.success
        assert result.metadata.success_rows == 1
        assert result.metadata.error_rows == 1
        assert len(result.errors) == 1
        assert result.errors[0].row_number == 2
        assert "NIP" in result.errors[0].reason

    def test_year_out_of_range(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2019, "UNIT KERJA": "BKPSDM", "BULAN": 6,
        }])

        result = parser.parse(str(f))

        assert not result.success
        assert len(result.errors) == 1

    def test_month_out_of_range(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 13,
        }])

        result = parser.parse(str(f))

        assert not result.success
        assert len(result.errors) == 1

    def test_none_counters_default_to_zero(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            "HN": 20, "TM1": None, "PC1": None,
        }])

        result = parser.parse(str(f))

        assert result.success
        assert result.rows[0].tm1 == 0
        assert result.rows[0].pc1 == 0
        assert result.rows[0].hn == 20

    def test_skip_all_none_rows(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [
            {
                "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "One",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            },
            {col: None for col in EXCEL_HEADER_COLS},
            {
                "NO URUT": 3, "NIP": "987654321098765432", "NAMA": "Two",
                "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            },
        ])

        result = parser.parse(str(f))

        assert result.success
        assert len(result.rows) == 2
        assert result.metadata.total_rows == 2


class TestWarnings:
    def test_opd_not_in_master(self, tmp_path, parser_with_opd):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2026, "UNIT KERJA": "DINAS PENDIDIKAN", "BULAN": 6,
        }])

        result = parser_with_opd.parse(str(f))

        assert result.success
        assert len(result.warnings) == 1
        assert "OPD" in result.warnings[0].reason
        assert "Dinas Pendidikan" in result.warnings[0].reason

    def test_counter_sum_exceeds_31_days(self, tmp_path, parser):
        f = tmp_path / "presensi.xlsx"
        make_test_xlsx(f, [{
            "NO URUT": 1, "NIP": "123456789012345678", "NAMA": "Test",
            "TAHUN": 2026, "UNIT KERJA": "BKPSDM", "BULAN": 6,
            "HN": 15, "TM1": 10, "TM2": 5, "TM3": 5, "DL": 5,
        }])

        result = parser.parse(str(f))

        assert result.success
        assert result.metadata.warning_count >= 1
        assert any("exceeds" in w.reason for w in result.warnings)
