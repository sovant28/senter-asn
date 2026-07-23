# Data Model — SENTER ASN

> **Dokumen ini menjelaskan APA datanya — schema database, template input Excel, dan rumus perhitungan.**
> Untuk konteks bisnis, lihat [`context.md`](context.md). Untuk arsitektur, lihat [`architecture.md`](architecture.md).

---

## 📥 Input #1: Template Presensi Per Pegawai (Raw)

File: `samples/template-presensi.xlsx` (satu sheet: `Sheet1`)

### Struktur Kolom

| # | Kolom | Tipe | Wajib | Keterangan |
|---|-------|------|-------|------------|
| 1 | NO URUT | int | ✅ | Nomor urut baris |
| 2 | NIP | string(18) | ✅ | NIP ASN (18 digit, kadang None untuk non-PNS) |
| 3 | NAMA | string(100) | ✅ | Nama lengkap pegawai |
| 4 | TAHUN | int(4) | ✅ | Tahun presensi (mis. 2026) |
| 5 | UNIT KERJA | string(100) | ✅ | Nama OPD (lihat master OPD) |
| 6 | BULAN | int(1-12) | ✅ | Bulan presensi (1=Jan, 12=Des) |
| 7-31 | TM1, TM2, TM3, PC1, PC2, PC3, TMM, PCM, ITM, IPC, IDLI, IDLO, TK, TB, HN, ITMPC, IDL, DL, CT, CS, CB, CM, CKAP, LJ, LN | int | ❌ | Counter hari dengan status tertentu. **Nilai default 0** jika tidak ada. |

### Kamus Kode Presensi

| Kode | Arti | Kategori |
|------|------|----------|
| **TM1** | Terlambat Masuk 30 menit | Pelanggaran Ringan |
| **TM2** | Terlambat Masuk 60 menit | Pelanggaran Sedang |
| **TM3** | Terlambat Masuk 90 menit | Pelanggaran Berat |
| **PC1** | Pulang Cepat 30 menit | Pelanggaran Ringan |
| **PC2** | Pulang Cepat 60 menit | Pelanggaran Sedang |
| **PC3** | Pulang Cepat 90 menit | Pelanggaran Berat |
| **TMM** | Terlambat Masuk (gabungan) | Calculated |
| **PCM** | Pulang Cepat (gabungan) | Calculated |
| **ITM** | Ijin Tidak Masuk | Absensi |
| **IPC** | Ijin Pulang Cepat | Absensi |
| **IDLI** | Ijin Dinas Luar (pagi) | Absensi |
| **IDLO** | Ijin Dinas Luar (lainnya) | Absensi |
| **TK** | Tugas Kantor | Dianggap Hadir |
| **TB** | Tugas Belajar | Dianggap Hadir |
| **HN** | Hadir Normal (tepat waktu) | Hadir |
| **ITMPC** | Ijin Terlambat & Pulang Cepat | Absensi |
| **IDL** | Ijin Dinas Luar (total) | Absensi |
| **DL** | Dinas Luar (tugas lapangan) | Dianggap Hadir* |
| **CT** | Cuti Tahunan | Absensi |
| **CS** | Cuti Sakit | Absensi |
| **CB** | Cuti Besar | Absensi |
| **CM** | Cuti Melahirkan | Absensi |
| **CKAP** | Cuti karena Alasan Penting | Absensi |
| **LJ** | Lembur (Jam) | Netral |
| **LN** | Lembur (Nominal) | Netral |

> **Catatan DL:** Dinas Luar sering ditandai khusus — secara administratif dianggap hadir, tapi **dapat menurunkan skor kehadiran efektif** karena pegawai tidak di kantor. Ini konteks penting yang ditampilkan di PDF.

### Validasi Template

Sebelum diproses, file Excel **wajib** lolos:
1. Header kolom persis seperti di atas (case-sensitive)
2. Tidak ada kolom kosong di tengah
3. Kolom wajib tidak boleh None/NaN
4. NIP harus 18 digit angka (atau None untuk honorer)
5. TAHUN antara 2020-2030
6. BULAN antara 1-12
7. UNIT KERJA harus ada di master OPD (lihat [`02-database.md`](modules/02-database.md))

---

## 📥 Input #2: Template Perhitungan Per OPD (Agregat)

File: `samples/template-perhitungan.xlsx` — ini adalah **target output calculation**, BUKAN input. Sistem kita akan generate equivalent sheet ini otomatis dari data presensi.

### Sheet: `Input Data` (template agregat)

| Kolom | Tipe | Sumber |
|-------|------|--------|
| No | int | Auto |
| Nama OPD | string | Master OPD |
| PNS | int | Count dari presensi_raw |
| PPPK | int | Count dari presensi_raw |
| PPPK PW | int | Count dari presensi_raw |
| Jumlah ASN | int | PNS + PPPK + PPPK PW |
| Hari Kerja | int | Master (default 16-22/bulan) |
| Total Kewajiban Hadir | int | Jumlah ASN × Hari Kerja |
| Jumlah Hadir | int | Count pegawai dengan HN > 0 |
| Jumlah Terlambat | int | Sum TM1+TM2+TM3 dari semua pegawai |
| Jumlah Pulang Cepat | int | Sum PC1+PC2+PC3 dari semua pegawai |
| Jumlah Tidak Hadir | int | ASN × Hari Kerja - Hadir - Terlambat - Pulang Cepat (simplified) |
| Jumlah Hadir Normal | int | Sum HN dari semua pegawai |

### Sheet: `Perhitungan` (formula otomatis)

Rumus di bawah ini **HARUS sama** dengan formula di template asli:

```excel
B2 = ('Input Data'!I2 / 'Input Data'!H2) * 100
     → Persentase Kehadiran = (Jumlah Hadir / Total Kewajiban) × 100

C2 = 'Input Data'!J2 + 'Input Data'!K2
     → Total Pelanggaran = Terlambat + Pulang Cepat

D2 = (C2 / 'Input Data'!H2) * 100
     → Persentase Pelanggaran = (Total Pelanggaran / Total Kewajiban) × 100

E2 = ('Input Data'!M2 / 'Input Data'!H2) * 100
     → Persentase Kehadiran Efektif = (Hadir Normal / Total Kewajiban) × 100

F2 = 100 - D2
     → Nilai Kepatuhan Jam Kerja = 100 - Persentase Pelanggaran

G2 = ('Input Data'!L2 / 'Input Data'!H2) * 100
     → Persentase Ketidakhadiran = (Tidak Hadir / Total Kewajiban) × 100

H2 = 100 - G2
     → Nilai Ketidakhadiran = 100 - Persentase Ketidakhadiran
```

### Bobot Skor (Confirmed: 25/20/15/40)

| Komponen | Bobot | Sumber |
|----------|-------|--------|
| Skor Kehadiran | **25%** | `= B2 * 0.25` |
| Skor Kepatuhan Jam Kerja | **20%** | `= F2 * 0.20` |
| Skor Ketidakhadiran | **15%** | `= H2 * 0.15` |
| Skor Hadir Efektif | **40%** | `= E2 * 0.40` |
| **Total Skor** | **100%** | `= SUM(I2:L2)` |

> ⚠️ **Catatan:** Template asli di sheet "Petunjuk" tertulis bobot 60/20/20, tapi formula di sheet "Perhitungan" pakai 25/20/15/40. **Yang dipakai: 25/20/15/40** (sesuai formula & output PDF). Detail di [`decisions/ADR-002-scoring-formula.md`](decisions/ADR-002-scoring-formula.md).

### Kategori

| Total Skor | Kategori | Warna (di PDF) |
|------------|----------|----------------|
| ≥ 90 | **Sangat Disiplin** | Hijau tua |
| 80-89 | **Disiplin** | Hijau muda |
| 70-79 | **Cukup** | Kuning |
| < 70 | **Kurang** / **Perlu Pembinaan** | Merah |

Formula:
```excel
N2 = IF(M2 >= 90, "Sangat Disiplin",
     IF(M2 >= 80, "Disiplin",
        IF(M2 >= 70, "Cukup", "Perlu Pembinaan")))
```

---

## 🗄️ Database Schema (PostgreSQL)

### Schema: `master` (Data Referensi)

#### Table: `opd` (master OPD)
```sql
CREATE TABLE master.opd (
    id              SERIAL PRIMARY KEY,
    kode_opd        VARCHAR(20) UNIQUE NOT NULL,   -- mis. "DINKES", "DISDIK"
    nama_opd        VARCHAR(200) NOT NULL,
    tipe_opd        VARCHAR(20) NOT NULL,          -- DINAS / BADAN / SEKRETARIAT / INSPEKTORAT
    is_active       BOOLEAN DEFAULT TRUE,
    catatan_khusus  TEXT,                          -- mis. "mayoritas data DL"
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_opd_kode ON master.opd(kode_opd);
```

#### Table: `pegawai` (master ASN)
```sql
CREATE TABLE master.pegawai (
    id              SERIAL PRIMARY KEY,
    nip             VARCHAR(20) UNIQUE NOT NULL,
    nama            VARCHAR(200) NOT NULL,
    opd_id          INT NOT NULL REFERENCES master.opd(id),
    jenis_asn       VARCHAR(10) NOT NULL,          -- PNS / PPPK / PPPK_PW
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pegawai_nip ON master.pegawai(nip);
CREATE INDEX idx_pegawai_opd ON master.pegawai(opd_id);
```

#### Table: `users` (user sistem)
```sql
CREATE TABLE master.users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt
    nama_lengkap    VARCHAR(200) NOT NULL,
    role            VARCHAR(30) NOT NULL,          -- SUPER_ADMIN / HR_MANAGER / KEPALA_OPD / EKSEKUTIF / PEGAWAI
    opd_id          INT REFERENCES master.opd(id), -- NULL untuk role non-OPD
    is_active       BOOLEAN DEFAULT TRUE,
    mfa_secret      VARCHAR(100),                  -- opsional, untuk admin
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema: `presensi` (Data Presensi)

#### Table: `presensi_raw` (data per pegawai per bulan)
```sql
CREATE TABLE presensi.presensi_raw (
    id              BIGSERIAL PRIMARY KEY,
    upload_id       UUID NOT NULL,                 -- FK ke presensi.upload_log
    pegawai_id      INT NOT NULL REFERENCES master.pegawai(id),
    tahun           SMALLINT NOT NULL,
    bulan           SMALLINT NOT NULL,             -- 1-12
    -- Kolom-kolom counter (semua integer, default 0)
    tm1             INT DEFAULT 0,
    tm2             INT DEFAULT 0,
    tm3             INT DEFAULT 0,
    pc1             INT DEFAULT 0,
    pc2             INT DEFAULT 0,
    pc3             INT DEFAULT 0,
    tmm             INT DEFAULT 0,
    pcm             INT DEFAULT 0,
    itm             INT DEFAULT 0,
    ipc             INT DEFAULT 0,
    idli            INT DEFAULT 0,
    idlo            INT DEFAULT 0,
    tk              INT DEFAULT 0,
    tb              INT DEFAULT 0,
    hn              INT DEFAULT 0,
    itmpc           INT DEFAULT 0,
    idl             INT DEFAULT 0,
    dl              INT DEFAULT 0,
    ct              INT DEFAULT 0,
    cs              INT DEFAULT 0,
    cb              INT DEFAULT 0,
    cm              INT DEFAULT 0,
    ckap            INT DEFAULT 0,
    lj              INT DEFAULT 0,
    ln              INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pegawai_id, tahun, bulan, upload_id)
);
CREATE INDEX idx_presensi_pegawai ON presensi.presensi_raw(pegawai_id);
CREATE INDEX idx_presensi_periode ON presensi.presensi_raw(tahun, bulan);
```

#### Table: `presensi_agregat_opd` (per OPD per bulan — sudah dihitung)
```sql
CREATE TABLE presensi.presensi_agregat_opd (
    id                          BIGSERIAL PRIMARY KEY,
    upload_id                   UUID NOT NULL,
    opd_id                      INT NOT NULL REFERENCES master.opd(id),
    tahun                       SMALLINT NOT NULL,
    bulan                       SMALLINT NOT NULL,
    -- Komposisi ASN
    pns                         INT NOT NULL,
    pppk                        INT NOT NULL,
    pppk_pw                     INT NOT NULL,
    jumlah_asn                  INT NOT NULL,
    hari_kerja                  INT NOT NULL,
    -- Counter agregat
    total_kewajiban_hadir       INT NOT NULL,
    jumlah_hadir                INT NOT NULL,
    jumlah_terlambat            INT NOT NULL,
    jumlah_pulang_cepat         INT NOT NULL,
    jumlah_tidak_hadir          INT NOT NULL,
    jumlah_hadir_normal         INT NOT NULL,
    -- Persentase
    persentase_kehadiran        NUMERIC(5,2) NOT NULL,
    persentase_pelanggaran      NUMERIC(5,2) NOT NULL,
    persentase_hadir_efektif    NUMERIC(5,2) NOT NULL,
    persentase_ketidakhadiran   NUMERIC(5,2) NOT NULL,
    -- Skor
    nilai_kepatuhan_jam_kerja   NUMERIC(5,2) NOT NULL,
    nilai_ketidakhadiran        NUMERIC(5,2) NOT NULL,
    skor_kehadiran              NUMERIC(5,2) NOT NULL,
    skor_kepatuhan_jam_kerja    NUMERIC(5,2) NOT NULL,
    skor_ketidakhadiran         NUMERIC(5,2) NOT NULL,
    skor_hadir_efektif          NUMERIC(5,2) NOT NULL,
    total_skor                  NUMERIC(5,2) NOT NULL,
    kategori                    VARCHAR(20) NOT NULL,  -- SANGAT_DISIPLIN / DISIPLIN / CUKUP / KURANG
    -- Ranking
    ranking_kehadiran           INT,
    ranking_pelanggaran         INT,
    ranking_total_skor          INT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(opd_id, tahun, bulan, upload_id)
);
CREATE INDEX idx_agregat_periode ON presensi.presensi_agregat_opd(tahun, bulan);
CREATE INDEX idx_agregat_opd ON presensi.presensi_agregat_opd(opd_id);
```

#### Table: `upload_log` (audit trail upload)
```sql
CREATE TABLE presensi.upload_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by         INT NOT NULL REFERENCES master.users(id),
    file_hash_sha256    VARCHAR(64) NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    file_name_original  VARCHAR(255) NOT NULL,
    file_path_encrypted VARCHAR(500),                -- path di object storage (encrypted)
    rows_imported       INT NOT NULL,
    rows_rejected       INT DEFAULT 0,
    rejection_reasons   JSONB,                       -- {"row_5": "NIP invalid", "row_12": "Unknown OPD"}
    status              VARCHAR(20) NOT NULL,        -- PROCESSING / SUCCESS / PARTIAL / FAILED
    tahun               SMALLINT,
    bulan               SMALLINT,
    started_at          TIMESTAMPTZ NOT NULL,
    finished_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema: `audit` (Compliance & Audit)

```sql
CREATE TABLE audit.access_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INT REFERENCES master.users(id),
    action          VARCHAR(50) NOT NULL,           -- LOGIN / VIEW_DASHBOARD / EXPORT_PDF / dll
    resource_type   VARCHAR(50),                    -- presensi / opd / user
    resource_id     VARCHAR(100),
    ip_address      INET,
    user_agent      TEXT,
    request_payload JSONB,                          -- tanpa data sensitif
    response_status INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit.access_log(user_id);
CREATE INDEX idx_audit_created ON audit.access_log(created_at);
-- Tabel ini IMMUTABLE — tidak ada UPDATE/DELETE permission untuk role apapun
```

---

## 🧮 Calculation Engine

### Step 1: Validasi & Insert Presensi Raw
- Baca Excel
- Validasi setiap baris
- Match nama OPD dengan `master.opd`
- Match NIP dengan `master.pegawai`
- Insert ke `presensi.presensi_raw`

### Step 2: Hitung Agregat Per OPD
```python
# Pseudocode
for each (opd, tahun, bulan) group:
    rows = presensi_raw.filter(opd, tahun, bulan)
    
    pns = count(rows.jenis_asn == "PNS")
    pppk = count(rows.jenis_asn == "PPPK")
    pppk_pw = count(rows.jenis_asn == "PPPK_PW")
    jumlah_asn = pns + pppk + pppk_pw
    hari_kerja = master.hari_kerja[tahun][bulan]
    total_kewajiban = jumlah_asn * hari_kerja
    
    jumlah_terlambat = sum(rows.tm1 + rows.tm2 + rows.tm3)
    jumlah_pulang_cepat = sum(rows.pc1 + rows.pc2 + rows.pc3)
    jumlah_hadir_normal = sum(rows.hn)
    jumlah_hadir = count(rows.hn > 0)  # pegawai yang hadir minimal 1 hari
    jumlah_tidak_hadir = total_kewajiban - jumlah_hadir - jumlah_terlambat - jumlah_pulang_cepat
```

### Step 3: Hitung Persentase
```python
pct_kehadiran = (jumlah_hadir / total_kewajiban) * 100
pct_pelanggaran = ((jumlah_terlambat + jumlah_pulang_cepat) / total_kewajiban) * 100
pct_hadir_efektif = (jumlah_hadir_normal / total_kewajiban) * 100
pct_ketidakhadiran = (jumlah_tidak_hadir / total_kewajiban) * 100
```

### Step 4: Hitung Skor
```python
nilai_kepatuhan = 100 - pct_pelanggaran
nilai_ketidakhadiran = 100 - pct_ketidakhadiran

skor_kehadiran = pct_kehadiran * 0.25
skor_kepatuhan = nilai_kepatuhan * 0.20
skor_ketidakhadiran = nilai_ketidakhadiran * 0.15
skor_hadir_efektif = pct_hadir_efektif * 0.40
total_skor = skor_kehadiran + skor_kepatuhan + skor_ketidakhadiran + skor_hadir_efektif
```

### Step 5: Kategori
```python
if total_skor >= 90: kategori = "SANGAT_DISIPLIN"
elif total_skor >= 80: kategori = "DISIPLIN"
elif total_skor >= 70: kategori = "CUKUP"
else: kategori = "KURANG"
```

### Step 6: Ranking
```python
# Pakai window function di SQL
RANK() OVER (PARTITION BY tahun, bulan ORDER BY total_skor DESC) AS ranking_total_skor
RANK() OVER (PARTITION BY tahun, bulan ORDER BY pct_kehadiran DESC) AS ranking_kehadiran
RANK() OVER (PARTITION BY tahun, bulan ORDER BY pct_pelanggaran ASC) AS ranking_pelanggaran
```

---

## 📊 Glossary Singkat

| Istilah | Definisi |
|---------|----------|
| **Total Kewajiban Hadir** | ASN × Hari Kerja |
| **Hadir** | Pegawai yang hadir minimal 1 hari dalam bulan |
| **Hadir Normal** | Total hari hadir tepat waktu (tidak telat, tidak cepat pulang) |
| **Pelanggaran** | Terlambat + Pulang Cepat (hari) |
| **Skor** | Nilai 0-100 berdasarkan bobot |
| **Kategori** | Sangat Disiplin / Disiplin / Cukup / Kurang |
| **Dinas Luar (DL)** | Tugas di lapangan, secara administratif hadir tapi tidak di kantor |

Detail glossary di [`glossary.md`](glossary.md).

---

> **Untuk implementasi Excel parser, lihat [`modules/01-excel-parser.md`](modules/01-excel-parser.md).**
> **Untuk database migrations, lihat [`modules/02-database.md`](modules/02-database.md).**
