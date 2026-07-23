# ADR-002: Scoring Formula & Bobot

> **Status:** Accepted (with note)
> **Date:** 2026-07-13
> **Deciders:** Project Lead, BKPSDM Representative

---

## Context

Template Excel asli yang diberikan klien (BKPSDM) memiliki **INKONSISTENSI**:

- **Sheet "Petunjuk"** tertulis:
  ```
  BOBOT PENILAIAN:
  - Kehadiran = 60%
  - Kepatuhan Jam Kerja = 20%
  - Ketidakhadiran = 20%
  ```

- **Sheet "Perhitungan"** (formula asli) menggunakan:
  - Skor Kehadiran = `= B2 * 0.25` → **25%**
  - Skor Kepatuhan Jam Kerja = `= F2 * 0.20` → **20%**
  - Skor Ketidakhadiran = `= H2 * 0.15` → **15%**
  - Skor Hadir Efektif = `= E2 * 0.40` → **40%**
  - **Total = 100%**

- **Output PDF** (`samples/output-sample.pdf`) menunjukkan hasil yang **konsisten dengan formula 25/20/15/40**, bukan 60/20/20.

## Decision

Gunakan **bobot 25/20/15/40** (= 100%) sesuai:
1. Formula di Sheet "Perhitungan" (sumber otoritatif)
2. Output PDF yang sudah ada (= konsistensi dengan formula)
3. Logika: Hadir Efektif (40%) mendapat bobot terbesar karena paling mencerminkan produktivitas

### Formula Final

```python
BOBOT = {
    "kehadiran": 0.25,           # 25%
    "kepatuhan_jam_kerja": 0.20, # 20%
    "ketidakhadiran": 0.15,      # 15%
    "hadir_efektif": 0.40,       # 40%
}
# Total = 100%
```

```python
skor_kehadiran = persentase_kehadiran * 0.25
skor_kepatuhan = (100 - persentase_pelanggaran) * 0.20
skor_ketidakhadiran = (100 - persentase_ketidakhadiran) * 0.15
skor_hadir_efektif = persentase_hadir_efektif * 0.40
total_skor = skor_kehadiran + skor_kepatuhan + skor_ketidakhadiran + skor_hadir_efektif
```

## Category Thresholds

| Total Skor | Kategori |
|------------|----------|
| ≥ 90 | **Sangat Disiplin** |
| 80-89.99 | **Disiplin** |
| 70-79.99 | **Cukup** |
| < 70 | **Kurang** (Perlu Pembinaan) |

## Alternatives Considered

### Opsi A: Pakai bobot 60/20/20 (sesuai Petunjuk)
**Cons:**
- Formula di Perhitungan sheet tidak match → Excel error
- Output PDF tidak akan match dengan sample
- Butuh re-design template & PDF

**Verdict:** Ditolak — inkonsisten dengan sumber otoritatif (formula)

### Opsi B: Tambah komponen ke bobot (mis. tambah insentif kedisiplinan)
**Pros:** Lebih granular
**Cons:** Butuh approval klien, redesign template

**Verdict:** Ditunda — bisa di-consider di v2 setelah MVP stabil

### Opsi C: Pakai skala berbeda (mis. 0-1000)
**Cons:** Tidak match dengan template existing

**Verdict:** Ditolak — pakai skala 0-100 sesuai template

## Consequences

### Positive
- ✅ Konsisten dengan formula asli di Excel
- ✅ Output PDF match dengan sample (acceptance criterion terpenuhi)
- ✅ Implementasi straightforward (tinggal copy formula)

### Negative
- ❌ Inkonsistensi di template asli tetap ada (perlu klarifikasi ke klien)
- ❌ Petunjuk harus di-update agar match dengan formula

### Action Items
- [ ] **TASK:** Konfirmasi ke klien BKPSDM bahwa bobot 25/20/15/40 yang dipakai
- [ ] **TASK:** Update sheet "Petunjuk" di template Excel (kalau klien setuju)
- [ ] **TASK:** Dokumentasikan di user manual bahwa skor maksimal = 100

## Notes

- **Threshold 70, 80, 90** untuk kategori adalah standar umum di Indonesia untuk penilaian disiplin
- **40% bobot untuk Hadir Efektif** masuk akal karena ini indikator produktivitas paling kuat
- **15% ketidakhadiran** bobotnya kecil karena terbalik dengan kehadiran (sudah ter-representasi di 25% kehadiran)

## Future Considerations

- Kalau klien ingin revisi bobot, sistem bisa di-parameterize via config (tidak hardcode)
- Bisa ditambahkan faktor: masa kerja, jabatan, jenis OPD (khusus vs umum)
