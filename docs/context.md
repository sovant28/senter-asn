# Context — SENTER ASN

> **Dokumen ini menjelaskan KENAPA proyek ini ada.**
> Baca ini untuk memahami masalah bisnis, stakeholder, dan tujuan proyek sebelum membaca detail teknis.

---

## 🏛️ Latar Belakang Instansi

**BKPSDM Kab. Tana Toraja** (Badan Kepegawaian dan Pengembangan Sumber Daya Manusia) adalah perangkat daerah yang bertanggung jawab atas:
- Manajemen ASN (Aparatur Sipil Negara) di Kabupaten Tana Toraja
- Pengembangan karier, diklat, dan penilaian kinerja
- Disiplin dan kode etik ASN

**Yurisdiksi:** 26 Organisasi Perangkat Daerah (OPD) — terdiri dari Dinas, Badan, Sekretariat, dan Inspektorat.

**Total ASN:** ±1000+ pegawai (terdiri dari PNS, PPPK, PPPK PW).

---

## 😰 Masalah Bisnis

### Sebelum ada SENTER ASN:
1. **Data presensi tersebar** — masing-masing OPD mengelola presensi sendiri, format tidak seragam
2. **Rekapitulasi manual** — HR staff download dari SIMPEGNAS, copy-paste ke Excel, hitung manual
3. **Laporan terlambat** — biasanya baru tersedia 1-2 minggu setelah periode berakhir
4. **Tidak ada early warning** — pelanggaran baru ketahuan setelah rekap bulanan selesai
5. **Pengambilan keputusan tanpa data** — pimpinan tidak punya visibilitas real-time terhadap disiplin OPD
6. **Tidak ada benchmark antar OPD** — sulit menentukan OPD mana yang perlu pembinaan prioritas
7. **Proses repetitif** — HR staff menghabiskan waktu berjam-jam untuk hal yang bisa diotomasi

### Dampak:
- Keputusan pembinaan tidak tepat sasaran
- ASN yang melanggar tidak mendapat feedback tepat waktu
- Culture disiplin sulit terbangun karena tidak ada transparansi data
- Waktu HR terbuang untuk tugas administratif, bukan strategis

---

## 🎯 Tujuan Proyek

### Tujuan Utama
Membangun **sistem informasi monitoring disiplin ASN** yang:
1. **Otomatis** — terima Excel presensi → langsung teranalisis
2. **Real-time** — dashboard selalu update setelah data diupload
3. **Actionable** — menghasilkan early warning & rekomendasi
4. **Transparan** — setiap OPD bisa melihat posisi mereka
5. **Standar** — rumus penilaian seragam untuk semua OPD

### Tujuan Teknis
1. **Replace proses manual** — HR tidak perlu lagi hitung manual
2. **Generate laporan PDF eksekutif** siap-presentasi
3. **Multi-role access** — different view untuk different role
4. **Mobile-friendly** — PWA agar bisa dibuka dari HP tanpa install app

---

## 👥 Stakeholder

| Stakeholder | Kebutuhan | Akses |
|-------------|-----------|-------|
| **Sekretaris Daerah / Bupati** | Lihat ringkasan eksekutif, OPD terbaik/terburuk | Read-only dashboard + PDF |
| **Kepala BKPSDM** | Monitor seluruh OPD, validasi data, laporan | Read + approval |
| **Kepala OPD (26 orang)** | Lihat kinerja OPD-nya, bandingkan dengan OPD lain | Read OPD sendiri + agregat |
| **HR Staff BKPSDM** | Upload data, validasi, koreksi | Read + Write (data) |
| **Tim IT** | Manage user, troubleshooting, maintenance | Admin |
| **ASN (pegawai)** | Lihat presensi sendiri (opsional) | Self-service terbatas |

---

## 📏 Success Criteria

### Wajib (MVP)
- [x] Bisa upload Excel presensi per pegawai
- [x] Sistem hitung agregat per OPD otomatis
- [x] Generate PDF 5 halaman sesuai template SENTER ASN
- [x] Dashboard web minimal bisa tampilkan ranking 26 OPD
- [x] Multi-role login (minimal 3 role)

### Penting
- [x] Hasil analisis akurat (verified dengan Excel sample)
- [x] PDF match dengan design reference
- [x] Performa: proses 1000+ baris < 5 detik
- [x] Mobile-responsive

### Bonus
- [ ] Early warning otomatis untuk OPD dengan tren negatif
- [ ] Narasi insight bahasa alami (LLM)
- [ ] Perbandingan antar periode (bulan ini vs bulan lalu)
- [ ] Export ke format lain (Excel, CSV)

---

## 🚫 Batasan & Non-Goals

### Batasan (constraint)
- **Tidak boleh** modifikasi data SIMPEGNAS langsung (read-only terhadap source)
- **Data harus** disimpan di server Indonesia (compliance UU PDP)
- **Tidak boleh** kirim data ASN ke cloud luar negeri tanpa anonymisasi
- **Aplikasi harus** PWA (bukan native app)

### Non-Goals (tidak akan dibangun di fase awal)
- Integrasi langsung dengan mesin fingerprint/mesin absen
- Mobile app native (iOS/Android)
- Payroll / penggajian (sistem terpisah)
- E-performance / SKP (sistem terpisah)
- Presensi online (selfie, GPS) — ini domain berbeda

---

## 🎨 Prinsip Design

1. **Executive-first** — semua output dioptimasi untuk pengambil keputusan, bukan operator
2. **Visual > Tabel** — chart dan grafik优先, tabel hanya untuk detail
3. **Color-coded categories** — Sangat Disiplin (hijau tua) / Disiplin (hijau) / Cukup (kuning) / Kurang (merah)
4. **Actionable insight** — setiap chart harus jawab "jadi, kita ngapain?"
5. **Standar branding SENTER ASN** — warna, logo, layout konsisten

---

## 📊 Domain Context

### Struktur Organisasi (contoh 26 OPD)
- **Dinas:** Pendidikan, Kesehatan, PUTR, Pertanian, Perikanan, Lingkungan Hidup, Sosial, Perhubungan, Kominfo, Pariwisata, Kebudayaan, Pemuda & Olahraga, Perdagangan, Perindustrian, Transmigrasi, Pemberdayaan Masyarakat, Pemberdayaan Perempuan, dsb
- **Badan:** Kepegawaian (BKPSDM), Keuangan, Perencanaan, Penelitian, Kesbangpol, Penanggulangan Bencana
- **Sekretariat:** Daerah, DPRD
- **Inspektorat**

### Jenis ASN
- **PNS** — Pegawai Negeri Sipil
- **PPPK** — Pegawai Pemerintah dengan Perjanjian Kerja
- **PPPK PW** — PPPK Paruh Waktu

### Istilah Penting
- **SIMPEGNAS** — Sistem Informasi Kepegawaian Nasional (sumber data)
- **DL** — Dinas Luar (tugas di lapangan)
- **TM1/2/3** — Terlambat Masuk 30/60/90 menit
- **PC1/2/3** — Pulang Cepat
- **ITM** — Ijin Tidak Masuk
- **HN** — Hadir Normal (tepat waktu, tidak违反)

Glossary lengkap di [`docs/glossary.md`](docs/glossary.md).

---

## 🗓️ Timeline & Milestone

| Fase | Target | Status |
|------|--------|--------|
| Discovery (context, requirement) | Juli 2026 | ✅ Done |
| Design (arsitektur, data model) | Juli 2026 | ✅ Done |
| MVP (parser + PDF + dummy data) | Juli 2026 | ✅ Done (TASK-101–118) |
| Beta (dashboard + auth + real data) | Agustus 2026 | ⏳ Next |
| Production (security hardening, deploy) | September 2026 | ⏳ |

---

## 🔗 Referensi

- Contoh output PDF: `samples/output-sample.pdf`
- Template input Excel: `samples/template-presensi.xlsx`, `samples/template-perhitungan.xlsx`
- Data dummy 1000+ baris: `samples/dummy-presensi-1000rows.xlsx` (akan di-generate)
- Sumber data: SIMPEGNAS (read-only)
- Regulasi: UU No. 27/2022 tentang Pelindungan Data Pribadi

---

> **Untuk detail teknis (arsitektur, schema, rumus), lanjut ke [`docs/architecture.md`](architecture.md) dan [`docs/data-model.md`](data-model.md).**
