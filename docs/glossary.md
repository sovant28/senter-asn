# Glossary — SENTER ASN

> Daftar istilah yang digunakan di proyek ini. Diperlukan untuk konsistensi komunikasi antara stakeholder, developer, dan AI agent.

---

## 🏛️ Instansi & Organisasi

| Istilah | Definisi |
|---------|----------|
| **BKPSDM** | Badan Kepegawaian dan Pengembangan Sumber Daya Manusia — perangkat daerah yang mengelola ASN di Tana Toraja |
| **OPD** | Organisasi Perangkat Daerah — unit kerja di pemerintahan daerah (Dinas, Badan, Sekretariat, Inspektorat) |
| **SIMPEGNAS** | Sistem Informasi Kepegawaian Nasional — sumber data presensi ASN |
| **SENTER ASN** | **Sistem Early Warning Presensi** — nama produk aplikasi ini |
| **BKN** | Badan Kepegawaian Negara — lembaga nasional yang mengelola ASN |

## 👥 Kepegawaian

| Istilah | Definisi |
|---------|----------|
| **ASN** | Aparatur Sipil Negara — Pegawai yang bekerja di instansi pemerintah |
| **PNS** | Pegawai Negeri Sipil — ASN yang diangkat secara tetap |
| **PPPK** | Pegawai Pemerintah dengan Perjanjian Kerja — ASN dengan kontrak |
| **PPPK PW** | PPPK Paruh Waktu — PPPK dengan jam kerja lebih sedikit |
| **NIP** | Nomor Induk Pegawai — identifier unik ASN (18 digit) |
| **PTT** | Pegawai Tidak Tetap — honorer (tidak punya NIP) |

## 📅 Presensi & Absensi

| Istilah | Definisi |
|---------|----------|
| **Presensi** | Kehadiran — catatan masuk dan pulang kerja |
| **Absensi** | Ketidakhadiran |
| **TM1** | Terlambat Masuk 30 menit |
| **TM2** | Terlambat Masuk 60 menit |
| **TM3** | Terlambat Masuk 90 menit |
| **PC1** | Pulang Cepat 30 menit |
| **PC2** | Pulang Cepat 60 menit |
| **PC3** | Pulang Cepat 90 menit |
| **TMM** | Terlambat Masuk (gabungan) |
| **PCM** | Pulang Cepat (gabungan) |
| **ITM** | Ijin Tidak Masuk |
| **IPC** | Ijin Pulang Cepat |
| **IDLI** | Ijin Dinas Luar (pagi) |
| **IDLO** | Ijin Dinas Luar (lainnya) |
| **IDL** | Ijin Dinas Luar (total) |
| **TK** | Tugas Kantor — tugas di kantor lain, dihitung hadir |
| **TB** | Tugas Belajar — dihitung hadir |
| **DL** | Dinas Luar — tugas lapangan, dihitung hadir tapi缺席 efektif |
| **HN** | Hadir Normal — hadir tepat waktu (tidak telat, tidak cepat pulang) |
| **ITMPC** | Ijin Terlambat & Pulang Cepat |

## 🏖️ Cuti

| Istilah | Definisi |
|---------|----------|
| **CT** | Cuti Tahunan |
| **CS** | Cuti Sakit |
| **CB** | Cuti Besar |
| **CM** | Cuti Melahirkan |
| **CKAP** | Cuti karena Alasan Penting |

## ⏰ Lembur

| Istilah | Definisi |
|---------|----------|
| **LJ** | Lembur (dalam Jam) |
| **LN** | Lembur (dalam Nominal/Uang) |

## 📊 Metrik & Perhitungan

| Istilah | Definisi |
|---------|----------|
| **Hari Kerja** | Jumlah hari kerja efektif dalam 1 bulan (16-22 hari, exclude weekend & libur nasional) |
| **Total Kewajiban Hadir** | Jumlah ASN × Hari Kerja |
| **Jumlah Hadir** | Pegawai yang hadir minimal 1 hari dalam bulan |
| **Jumlah Hadir Normal** | Total hari hadir tepat waktu (sum HN) |
| **Pelanggaran** | Terlambat + Pulang Cepat (dalam hari) |
| **Persentase Kehadiran** | (Jumlah Hadir / Total Kewajiban) × 100 |
| **Persentase Pelanggaran** | (Total Pelanggaran / Total Kewajiban) × 100 |
| **Persentase Hadir Efektif** | (Jumlah Hadir Normal / Total Kewajiban) × 100 |
| **Persentase Ketidakhadiran** | (Jumlah Tidak Hadir / Total Kewajaran) × 100 |
| **Nilai Kepatuhan Jam Kerja** | 100 - Persentase Pelanggaran |
| **Nilai Ketidakhadiran** | 100 - Persentase Ketidakhadiran |
| **Skor** | Nilai 0-100 hasil perkalian persentase × bobot |
| **Total Skor** | Penjumlahan 4 sub-skor (Kehadiran + Kepatuhan + Ketidakhadiran + Hadir Efektif) |

## 🏆 Kategori Disiplin

| Istilah | Definisi | Skor |
|---------|----------|------|
| **Sangat Disiplin** | Kategori tertinggi, warna hijau tua | ≥ 90 |
| **Disiplin** | Kategori baik, warna hijau muda | 80-89 |
| **Cukup** | Kategori sedang, warna kuning | 70-79 |
| **Kurang** / **Perlu Pembinaan** | Kategori terendah, warna merah | < 70 |

## 💻 Teknologi

| Istilah | Definisi |
|---------|----------|
| **PWA** | Progressive Web App — web app yang bisa di-install & diakses offline |
| **JWT** | JSON Web Token — format token untuk autentikasi |
| **RBAC** | Role-Based Access Control — kontrol akses berdasarkan role |
| **ORM** | Object-Relational Mapping — teknik mapping tabel ke object |
| **MFA** | Multi-Factor Authentication — autentikasi 2+ faktor |
| **TLS/SSL** | Transport Layer Security — protokol enkripsi komunikasi |
| **UU PDP** | Undang-Undang Pelindungan Data Pribadi (UU No. 27/2022) |

## 📈 Dashboard & Reporting

| Istilah | Definisi |
|---------|----------|
| **KPI** | Key Performance Indicator — metrik kunci |
| **Highlight** | Poin penting yang ditonjolkan di laporan |
| **Ranking** | Peringkat OPD berdasarkan skor |
| **Top 5 Terbaik** | 5 OPD dengan skor tertinggi |
| **OPD Perlu Pembinaan** | OPD dengan skor terendah (perlu intervensi) |
| **Distribusi Kategori** | Sebaran OPD di 4 kategori (pie chart) |
| **Ringkasan Hasil** | Summary insight di akhir laporan |
| **Fakta Menarik** | Insight tambahan yang eye-catching |
| **Indikator Kategori** | Threshold & warna untuk setiap kategori |

---

## 📚 Singkatan Umum

| Singkatan | Arti |
|-----------|------|
| **API** | Application Programming Interface |
| **UI/UX** | User Interface / User Experience |
| **DB** | Database |
| **CRUD** | Create, Read, Update, Delete |
| **DRY** | Don't Repeat Yourself |
| **YAGNI** | You Aren't Gonna Need It |
| **KISS** | Keep It Simple, Stupid |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **SLA** | Service Level Agreement |
| **WIP** | Work In Progress |

---

> **Istilah yang belum ada di sini?** Tambahkan via PR ke file ini.
