# REKOMENDASI STANDARDISASI DATA DAN PENGELOMPOKAN (KATEGORI) OPD
## SISTEM EARLY WARNING PRESENSI (SENTER ASN)
**Pemerintah Kabupaten Tana Toraja**

---

## 📌 Latar Belakang
Dalam rangka meningkatkan akurasi penilaian tingkat disiplin Aparatur Sipil Negara (ASN) di lingkungan Pemerintah Kabupaten Tana Toraja melalui aplikasi **Senter ASN**, diperlukan standardisasi data mentah presensi (SIMPEGNAS) sebelum dilakukan pengunggahan. 

Rekomendasi ini disusun sebagai acuan kerja bagi BKPSDM dan operator presensi di seluruh unit kerja untuk menjamin keadilan penilaian (*fairness*), kemudahan monitoring pimpinan daerah, serta kebersihan basis data (*data hygiene*).

---

## 🏛️ Bagian I: Usulan Pengelompokan (Kategori) OPD
Saat ini terdapat lebih dari **600 unit kerja** yang terdata di sistem (akibat pecahnya UPT Sekolah dan Puskesmas Pembantu). Untuk mempermudah monitoring oleh Bupati/Sekda dan menjaga keadilan perbandingan, diusulkan penambahan kolom **`KATEGORI OPD`** di dalam Excel presensi dengan pembagian sebagai berikut:

### 1. Dinas, Badan & Sekretariat (OPD Utama / Instansi Induk)
*   **Karakteristik:** Jam kerja administratif standar (Senin–Jumat, 07.30–16.00). Pegawai didominasi staf perkantoran.
*   **Contoh:** Dinas Pendidikan, Dinas Kesehatan, BPKPD, Bappeda, BKPSDM, Inspektorat Daerah, Sekretariat Daerah, Sekretariat DPRD.
*   **Tujuan:** Dashboard utama Bupati/Sekda secara *default* hanya akan menampilkan kategori ini agar pimpinan fokus mengevaluasi 26+ kepala instansi strategis saja.

### 2. UPT Pelayanan Kesehatan (Fasilitas Kesehatan)
*   **Karakteristik:** Memiliki **pelayanan 24 jam dengan pola shift** (pagi/siang/malam) dan piket akhir pekan.
*   **Contoh:** UPT RSUD Lakipadada, UPT Puskesmas Makale, Puskesmas Pembantu (Pustu), Poskesdes, Instalasi Farmasi.
*   **Tujuan:** Mencegah ketidakadilan peringkat. Tingkat disiplin instansi pelayanan shift kesehatan tidak bisa dibandingkan secara langsung dengan dinas administratif biasa.

### 3. UPT Pendidikan (Sekolah & Lembaga Belajar)
*   **Karakteristik:** Jam kerja mengikuti **Kalender Akademik Sekolah**. Pegawai didominasi oleh Jabatan Fungsional Guru yang memiliki hak libur semester sekolah.
*   **Contoh:** UPT TK Negeri 1 Makale, UPT SDN (Sekolah Dasar), UPT SMPN (Sekolah Menengah Pertama), Sanggar Kegiatan Belajar (SKB).
*   **Tujuan:** Meminimalisir protes dari Kepala Sekolah dan Guru karena pola kehadiran guru di luar jam mengajar disesuaikan dengan aturan pendidikan nasional.

### 4. Kecamatan & Kelurahan (Kewilayahan)
*   **Karakteristik:** Unit pelayanan administratif di tingkat wilayah administratif terbawah. Pegawai ASN relatif sedikit per instansi.
*   **Contoh:** Kantor Kecamatan Makale, Kantor Kecamatan Mengkendek, Kelurahan Pasang, Kelurahan Lemo, Kelurahan Tondon Mamullu.
*   **Tujuan:** Memudahkan pemantauan disiplin pelayanan masyarakat di garis depan wilayah kecamatan.

### 5. UPT Operasional Lainnya
*   **Karakteristik:** Unit teknis operasional non-kesehatan dan non-pendidikan.
*   **Contoh:** UPT Pemadam Kebakaran (Damkar), UPT Pengujian Kendaraan Bermotor (Dishub), UPT Tempat Pembuangan Akhir (TPA).

---

## ⚙️ Bagian II: Panduan Standardisasi Data Excel (Clean Data Checklist)
Untuk mencegah error saat impor data ke aplikasi Senter ASN, operator Excel wajib menerapkan aturan penulisan data berikut:

### 1. Format Kolom NIP (Wajib Text)
*   Format kolom NIP harus diatur sebagai **`Text`** (bukan *Number*).
*   Gunakan tanda petik tunggal pembuka (`'`) di depan angka NIP (contoh: `'197207121994062002`). Hal ini penting agar Excel tidak membuang angka `0` di awal NIP PPPK baru, serta mencegah angka berubah menjadi format eksponen (seperti `1.97E+17`).

### 2. Konsistensi Penulisan Nama Instansi (`UNIT KERJA`)
*   Nama instansi harus seragam dan tidak boleh disingkat secara acak (contoh: gunakan nama baku `"Badan Kepegawaian dan Pengembangan Sumber Daya Manusia"` secara konsisten, hindari menulis `"BKPSDM"` di sebagian baris).
*   Gunakan fungsi `=TRIM()` di Excel sebelum file disimpan untuk menghapus spasi ganda atau spasi tidak sengaja di akhir teks nama instansi.

### 3. Konsolidasi Pegawai Mutasi (Pindah Instansi)
*   Dalam satu bulan periode laporan, satu NIP **hanya boleh terdaftar di satu OPD**.
*   Jika terjadi mutasi di pertengahan bulan, gabungkan jumlah presensinya ke dalam satu baris instansi yang baru (atau instansi lama) agar tidak memicu error data ganda (*Duplicate Key Constraint*).

### 4. Usulan Kolom Mandiri: `HARI KERJA EFEKTIF`
*   Disarankan menambahkan kolom khusus `HARI KERJA EFEKTIF` per baris pegawai.
*   Hal ini karena dalam bulan yang sama (misal masa liburan sekolah), guru mungkin hanya memiliki **10 hari kerja efektif**, sedangkan ASN Dinas tetap memiliki **16 hari kerja efektif**. Kolom mandiri ini menjamin pembagi perhitungan persentase kehadiran selalu akurat 100% per bidang kerja.

### 5. Klarifikasi Definisi Singkatan Absensi
Pastikan operator menyepakati pembagian kolom absensi:
*   **`TK` (Tanpa Keterangan):** Hanya diisi untuk status Alpa/Mangkir (nilai pemotongan disiplin tertinggi).
*   **`DL` (Dinas Luar):** Diisi untuk penugasan resmi di luar kantor (tidak dipotong disiplin).
*   **`TB` (Tugas Belajar):** Diisi untuk pegawai yang sedang menempuh pendidikan resmi.

---

## 📈 Bagian III: Manfaat bagi BKPSDM & Pimpinan Daerah
1.  **Bupati & Sekda:** Cukup melihat Dashboard Kategori **"Dinas, Badan & Sekretariat"** (26 instansi utama) untuk rapat evaluasi strategis. Tampilan lebih rapi, fokus, dan tidak terganggu oleh ratusan UPT sekolah.
2.  **Kepala Dinas Pendidikan & Kesehatan:** Dapat memfilter kategori **"Sekolah"** atau **"Kesehatan"** secara mandiri untuk memonitor tingkat kepatuhan unit di bawah naungan dinas mereka.
3.  **Keadilan Sosial ASN:** Menghilangkan keluhan kecemburuan sosial antar-OPD karena indikator penilaian telah dikelompokkan sesuai karakteristik beban kerja masing-masing bidang.
