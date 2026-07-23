# Module 01 — Excel Parser

> Tanggung jawab: Menerima file Excel presensi, memvalidasi, mengekstrak data, dan mengembalikannya dalam format siap-simpan.

---

## 🎯 Tujuan

Mengubah file Excel presensi mentah (Sheet1, 1000+ baris) menjadi list of dict Python yang siap di-insert ke database, dengan validasi lengkap dan error reporting detail.

---

## 📥 Input

- **File:** `.xlsx` (bukan `.xls` atau `.csv`)
- **Size:** max 10 MB
- **Sheet:** hanya sheet pertama yang dibaca (`Sheet1` atau default)
- **Struktur:** lihat [`docs/data-model.md`](../data-model.md) §"Input #1"

---

## 📤 Output

```python
@dataclass
class ParseResult:
    success: bool
    rows: list[PresensiRow]      # data valid
    errors: list[ParseError]      # data invalid per baris
    warnings: list[ParseWarning]  # data mencurigakan
    metadata: ParseMetadata      # info file, hash, stats

@dataclass
class PresensiRow:
    no_urut: int
    nip: Optional[str]
    nama: str
    tahun: int
    unit_kerja: str
    bulan: int
    # ... semua 25 kolom counter

@dataclass
class ParseError:
    row_number: int
    column: str
    value: Any
    reason: str
    severity: Literal["error", "warning"]
```

---

## 🏗️ Implementasi

### Lokasi File
- `backend/app/services/excel_parser.py`
- `backend/app/schemas/presensi.py` (Pydantic schemas)
- `backend/app/api/presensi.py` (endpoint upload)
- `backend/tests/test_excel_parser.py`

### Library
- `openpyxl` — untuk baca .xlsx (preserve format & validasi)
- `pandas` — untuk bulk processing setelah validasi
- `pydantic` — untuk schema validation

### Pseudocode

```python
# backend/app/services/excel_parser.py

from openpyxl import load_workbook
from pydantic import ValidationError
import hashlib
import logging

class ExcelPresensiParser:
    REQUIRED_COLUMNS = ['NO URUT', 'NIP', 'NAMA', 'TAHUN', 'UNIT KERJA', 'BULAN',
                        'TM1', 'TM2', 'TM3', 'PC1', 'PC2', 'PC3', 'TMM', 'PCM',
                        'ITM', 'IPC', 'IDLI', 'IDLO', 'TK', 'TB', 'HN', 'ITMPC',
                        'IDL', 'DL', 'CT', 'CS', 'CB', 'CM', 'CKAP', 'LJ', 'LN']

    def parse(self, file_path: str, max_size_mb: int = 10) -> ParseResult:
        # 1. Validasi file (size, format)
        self._validate_file(file_path, max_size_mb)

        # 2. Hitung hash untuk audit
        file_hash = self._compute_hash(file_path)

        # 3. Buka workbook
        wb = load_workbook(file_path, read_only=True, data_only=True)
        ws = wb.active

        # 4. Validasi header
        headers = [cell.value for cell in ws[1]]
        self._validate_headers(headers)

        # 5. Parse rows
        rows = []
        errors = []
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            try:
                presensi = self._parse_row(row, row_idx)
                rows.append(presensi)
            except ValidationError as e:
                errors.append(ParseError(
                    row_number=row_idx,
                    reason=str(e),
                    severity="error"
                ))

        return ParseResult(
            success=len(errors) == 0,
            rows=rows,
            errors=errors,
            metadata=ParseMetadata(
                file_hash=file_hash,
                total_rows=len(rows),
                error_count=len(errors),
            )
        )

    def _validate_headers(self, headers: list) -> None:
        missing = set(self.REQUIRED_COLUMNS) - set(headers)
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

    def _parse_row(self, row: tuple, row_idx: int) -> PresensiRow:
        # Map row ke dict
        data = dict(zip(self.REQUIRED_COLUMNS, row))

        # Validasi per field
        if data['TAHUN'] < 2020 or data['TAHUN'] > 2030:
            raise ValueError(f"TAHUN out of range: {data['TAHUN']}")

        if not (1 <= data['BULAN'] <= 12):
            raise ValueError(f"BULAN invalid: {data['BULAN']}")

        if data['NIP'] and not (data['NIP'].isdigit() and len(data['NIP']) == 18):
            raise ValueError(f"NIP must be 18 digits or None: {data['NIP']}")

        # Convert counter columns to int (default 0)
        for col in ['TM1', 'TM2', ...]:
            if data[col] is None:
                data[col] = 0
            elif not isinstance(data[col], int):
                raise ValueError(f"{col} must be integer")

        return PresensiRow(**data)
```

---

## ✅ Validation Rules

### Hard Errors (baris ditolak)
| Field | Rule |
|-------|------|
| Header | Semua 31 kolom wajib ada |
| NO URUT | Integer positive |
| NIP | 18 digit angka ATAU None (untuk honorer) |
| NAMA | String, max 200 char, tidak kosong |
| TAHUN | Integer 2020-2030 |
| UNIT KERJA | String, harus ada di `master.opd` |
| BULAN | Integer 1-12 |
| Semua counter | Integer ≥ 0 |

### Soft Warnings (baris diterima, tapi di-flag)
- NAMA mengandung karakter non-alfabet
- UNIT KERJA typo (tidak exact match, fuzzy match < 80% similarity)
- Sum counter > 31 hari (kemungkinan input salah)
- Counter > 5 di kolom yang jarang (mis. CKAP, CB)

---

## 🔐 Security

- ✅ File dibaca di **sandbox process** (bukan main API process)
- ✅ File asli **dihash** (SHA-256) untuk audit trail
- ✅ File asli **diencrypt** (AES-256) sebelum disimpan di object storage
- ✅ File otomatis **dihapus** dari disk setelah 30 hari
- ✅ MIME type & magic byte divalidasi
- ✅ Antivirus scan via ClamAV sebelum parsing
- ✅ Size limit 10 MB (configurable)

---

## 🧪 Testing

### Unit Tests (wajib)
- [x] Parse file valid → sukses
- [x] File kosong → error yang jelas
- [x] Header kolom salah → error
- [x] NIP invalid → baris di-skip, error per baris
- [x] UNIT KERJA tidak ada di master → warning/error
- [x] Counter non-integer → error
- [x] File corrupt → error yang aman (no stack trace)

### Integration Tests
- [x] Upload via API → return presensi parsed
- [x] Upload file 1000+ baris → selesai < 5 detik
- [x] Upload dengan 5% baris invalid → partial success, error report

### Performance Target
- 100 baris: < 500ms
- 1000 baris: < 5 detik
- 5000 baris: < 20 detik

---

## 📊 Error Reporting Format

Response ke user:

```json
{
  "status": "partial_success",
  "summary": {
    "total_rows": 1042,
    "success": 1030,
    "errors": 12,
    "warnings": 8
  },
  "errors": [
    {
      "row": 15,
      "column": "NIP",
      "value": "12345",
      "reason": "NIP must be 18 digits"
    },
    {
      "row": 27,
      "column": "UNIT KERJA",
      "value": "DINAS PENDIDIKAN ",  // trailing space
      "reason": "OPD not found in master"
    }
  ],
  "warnings": [
    {
      "row": 102,
      "column": "HN",
      "value": 25,
      "reason": "Counter > 20 (jumlah hari kerja normal)"
    }
  ]
}
```

---

## 🔗 Integrasi dengan Modul Lain

- **Input:** request dari API endpoint `POST /api/presensi/upload`
- **Output:** `ParseResult` → diteruskan ke:
  - `presensi_service.py` untuk insert ke DB
  - `audit_service.py` untuk catat upload event
  - Response ke user dengan error report

---

## 📚 Referensi

- [`docs/data-model.md`](../data-model.md) §"Input #1: Template Presensi Per Pegawai"
- [`docs/security.md`](../security.md) §"File Upload Security"
- [`samples/template-presensi.xlsx`](../../samples/template-presensi.xlsx) — contoh template
- [openpyxl docs](https://openpyxl.readthedocs.io/)
- [pydantic docs](https://docs.pydantic.dev/)

---

> **Module selanjutnya: [`02-database.md`](02-database.md)** — schema migrations & data access layer.
