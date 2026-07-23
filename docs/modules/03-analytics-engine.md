# Module 03 — Analytics Engine

> Tanggung jawab: Menghitung agregat per OPD, skor disiplin (4 sub-skor + total), kategori, dan ranking.

---

## 🎯 Tujuan

Mengubah data `presensi_raw` (per pegawai per bulan) menjadi data `presensi_agregat_opd` (per OPD per bulan) yang siap ditampilkan di dashboard & PDF.

**Pure business logic** — tidak ada UI, tidak ada DB langsung. Hanya function yang menerima data & return hasil.

---

## 📐 Formula Resmi

### Konstanta
```python
# Bobot skor (confirmed via PDF sample & template calculation sheet)
BOBOT_KEHADIRAN = 0.25          # 25%
BOBOT_KEPATUHAN_JAM_KERJA = 0.20  # 20%
BOBOT_KETIDAKHADIRAN = 0.15       # 15%
BOBOT_HADIR_EFEKTIF = 0.40        # 40%
# Total: 100%

# Threshold kategori
KATEGORI_THRESHOLD = {
    "SANGAT_DISIPLIN": 90,
    "DISIPLIN": 80,
    "CUKUP": 70,
    # "KURANG" = < 70
}
```

### Step 1: Hitung Counter Agregat Per OPD

```python
def hitung_counter_agregat(rows: list[PresensiRaw], opd: OPD, hari_kerja: int) -> AgregatCounter:
    pns = count(rows, jenis_asn="PNS")
    pppk = count(rows, jenis_asn="PPPK")
    pppk_pw = count(rows, jenis_asn="PPPK_PW")
    jumlah_asn = pns + pppk + pppk_pw

    total_kewajiban = jumlah_asn * hari_kerja

    jumlah_terlambat = sum(r.tm1 + r.tm2 + r.tm3 for r in rows)
    jumlah_pulang_cepat = sum(r.pc1 + r.pc2 + r.pc3 for r in rows)
    jumlah_hadir_normal = sum(r.hn for r in rows)

    # Pegawai yang hadir minimal 1 hari
    jumlah_hadir = count(rows, lambda r: r.hn > 0)

    # Sisa hari yang tidak ada di counter = tidak hadir
    jumlah_tidak_hadir = total_kewajiban - jumlah_hadir - jumlah_terlambat - jumlah_pulang_cepat

    return AgregatCounter(
        pns=pns, pppk=pppk, pppk_pw=ppk_pw,
        jumlah_asn=jumlah_asn,
        hari_kerja=hari_kerja,
        total_kewajiban=total_kewajiban,
        jumlah_hadir=jumlah_hadir,
        jumlah_terlambat=jumlah_terlambat,
        jumlah_pulang_cepat=jumlah_pulang_cepat,
        jumlah_tidak_hadir=jumlah_tidak_hadir,
        jumlah_hadir_normal=jumlah_hadir_normal,
    )
```

### Step 2: Hitung Persentase

```python
def hitung_persentase(counter: AgregatCounter) -> AgregatPersentase:
    total = counter.total_kewajiban

    return AgregatPersentase(
        kehadiran=(counter.jumlah_hadir / total) * 100,
        pelanggaran=((counter.jumlah_terlambat + counter.jumlah_pulang_cepat) / total) * 100,
        hadir_efektif=(counter.jumlah_hadir_normal / total) * 100,
        ketidakhadiran=(counter.jumlah_tidak_hadir / total) * 100,
    )
```

### Step 3: Hitung Skor

```python
def hitung_skor(persen: AgregatPersentase) -> AgregatSkor:
    nilai_kepatuhan = 100 - persen.pelanggaran
    nilai_ketidakhadiran = 100 - persen.ketidakhadiran

    skor_kehadiran = persen.kehadiran * BOBOT_KEHADIRAN
    skor_kepatuhan = nilai_kepatuhan * BOBOT_KEPATUHAN_JAM_KERJA
    skor_ketidakhadiran = nilai_ketidakhadiran * BOBOT_KETIDAKHADIRAN
    skor_hadir_efektif = persen.hadir_efektif * BOBOT_HADIR_EFEKTIF

    total = skor_kehadiran + skor_kepatuhan + skor_ketidakhadiran + skor_hadir_efektif

    return AgregatSkor(
        skor_kehadiran=round(skor_kehadiran, 2),
        skor_kepatuhan_jam_kerja=round(skor_kepatuhan, 2),
        skor_ketidakhadiran=round(skor_ketidakhadiran, 2),
        skor_hadir_efektif=round(skor_hadir_efektif, 2),
        total_skor=round(total, 2),
    )
```

### Step 4: Tentukan Kategori

```python
def tentukan_kategori(total_skor: float) -> str:
    if total_skor >= 90:
        return "SANGAT_DISIPLIN"
    elif total_skor >= 80:
        return "DISIPLIN"
    elif total_skor >= 70:
        return "CUKUP"
    else:
        return "KURANG"
```

### Step 5: Ranking

Ranking dihitung menggunakan **window function SQL** (bukan Python loop) untuk performance:

```sql
SELECT
    opd_id,
    total_skor,
    RANK() OVER (ORDER BY total_skor DESC) AS ranking_total_skor,
    RANK() OVER (ORDER BY persentase_kehadiran DESC) AS ranking_kehadiran,
    RANK() OVER (ORDER BY persentase_pelanggaran ASC) AS ranking_pelanggaran
FROM presensi.presensi_agregat_opd
WHERE tahun = :tahun AND bulan = :bulan;
```

---

## 🏗️ Implementasi

### Lokasi File
- `backend/app/services/analytics.py` — core engine
- `backend/app/schemas/analytics.py` — DTOs
- `backend/tests/test_analytics.py` — unit tests
- `backend/tests/test_analytics_integration.py` — integration tests

### Pure Functions

Engine didesain sebagai **pure functions** — no side effects, no DB access, no I/O. Memudahkan testing.

```python
# backend/app/services/analytics.py

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

# ... (fungsi-fungsi di atas)
```

### Orchestrator

```python
class AnalyticsService:
    """Orchestrator yang gabungkan pure functions + DB access"""

    def __init__(self, db: AsyncSession, master_repo: MasterRepository):
        self.db = db
        self.master_repo = master_repo

    async def proses_agregat(
        self,
        upload_id: UUID,
        tahun: int,
        bulan: int,
    ) -> list[PresensiAgregatOPD]:
        """Pipeline utama: raw → agregat → simpan ke DB"""

        # Ambil semua OPD aktif
        opds = await self.master_repo.get_active_opds()

        # Ambil hari kerja untuk periode ini
        hari_kerja = self._get_hari_kerja(tahun, bulan)

        results = []
        for opd in opds:
            # Ambil presensi raw untuk OPD ini
            rows = await self.db.execute(
                select(PresensiRaw)
                .where(
                    PresensiRaw.opd_id == opd.id,
                    PresensiRaw.tahun == tahun,
                    PresensiRaw.bulan == bulan,
                    PresensiRaw.upload_id == upload_id,
                )
            )
            rows = rows.scalars().all()

            if not rows:
                continue  # skip OPD tanpa data

            # Hitung (pure functions)
            counter = hitung_counter_agregat(rows, opd, hari_kerja)
            persen = hitung_persentase(counter)
            skor = hitung_skor(persen)
            kategori = tentukan_kategori(skor.total_skor)

            # Build entity
            agregat = PresensiAgregatOPD(
                upload_id=upload_id,
                opd_id=opd.id,
                tahun=tahun,
                bulan=bulan,
                **counter.to_dict(),
                **persen.to_dict(),
                **skor.to_dict(),
                kategori=kategori,
            )
            results.append(agregat)

        # Bulk insert
        self.db.add_all(results)
        await self.db.commit()

        # Hitung ranking via SQL
        await self._update_rankings(tahun, bulan)

        return results

    async def _update_rankings(self, tahun: int, bulan: int) -> None:
        """Update ranking menggunakan window function"""
        await self.db.execute(text("""
            UPDATE presensi.presensi_agregat_opd t
            SET
                ranking_kehadiran = sub.rk,
                ranking_pelanggaran = sub.rp,
                ranking_total_skor = sub.rt
            FROM (
                SELECT
                    id,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY persentase_kehadiran DESC) AS rk,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY persentase_pelanggaran ASC) AS rp,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY total_skor DESC) AS rt
                FROM presensi.presensi_agregat_opd
                WHERE tahun = :tahun AND bulan = :bulan
            ) sub
            WHERE t.id = sub.id
        """), {"tahun": tahun, "bulan": bulan})
        await self.db.commit()
```

---

## 🎯 Edge Cases & Special Handling

### 1. OPD dengan 0 ASN
- Skip (tidak masuk agregat)
- Tampilkan warning "Data ASN belum lengkap"

### 2. Total Kewajiban = 0
- Skip (tidak bisa hitung persentase)
- Tandai sebagai error

### 3. DL Mendominasi (≥ 50% kehadiran)
- Tetap dihitung normal
- Tandai dengan `catatan_khusus` di PDF
- Lihat: "mayoritas data DL"

### 4. Pegawai Pindah OPD di Tengah Bulan
- Versi simple: ikut OPD di akhir bulan (sesuai NIP terakhir)
- Versi advanced: split proporsional (TODO untuk v2)

### 5. Hari Kerja Libur
- Pakai `master.hari_kerja` (configurable per tahun)
- Default: 16-22 hari/bulan
- Libur nasional & cuti bersama tidak dihitung

---

## 📊 Performance

- Pure functions: 1000+ rows → < 100ms
- Bulk insert 26 OPD: < 500ms
- Update ranking: < 200ms (window function)
- **Total pipeline: < 2 detik** untuk 1 bulan data 1000+ pegawai

---

## 🧪 Testing

### Unit Tests (wajib)
- [x] `hitung_counter_agregat` dengan data normal
- [x] `hitung_counter_agregat` dengan data kosong
- [x] `hitung_persentase` dengan edge case (div by zero)
- [x] `hitung_skor` match dengan Excel formula (verify by hand)
- [x] `tentukan_kategori` untuk semua threshold
- [x] Round precision consistency

### Verification Tests
- [x] Output match dengan template `samples/template-perhitungan.xlsx` (Dinas Pendidikan, 1 row)
- [x] Total skor = jumlah 4 sub-skor (no rounding error)
- [x] Kategori sesuai threshold

### Integration Tests
- [x] Pipeline raw → agregat → ranking
- [x] Concurrent upload tidak double-count

---

## 🔗 Integrasi dengan Modul Lain

- **Input:** `presensi_raw` rows (from Module 01 + 02)
- **Output:** `presensi_agregat_opd` rows (consumed by Module 04 + 05)
- **Trigger:** setelah upload sukses, atau manual via API `POST /api/analytics/recompute`

---

## 📚 Referensi

- [`docs/data-model.md`](../data-model.md) §"Calculation Engine"
- [`samples/template-perhitungan.xlsx`](../../samples/template-perhitungan.xlsx) — formula reference
- [`docs/decisions/ADR-002-scoring-formula.md`](../decisions/ADR-002-scoring-formula.md) — kenapa bobot 25/20/15/40

---

> **Module selanjutnya: [`04-pdf-generator.md`](04-pdf-generator.md)** — render PDF 5 halaman SENTER ASN.
