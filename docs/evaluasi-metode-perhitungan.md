# Evaluasi & Rekomendasi Metode Perhitungan Skor Disiplin ASN

Dokumen ini menyajikan analisis kritis mengenai metode perhitungan skor disiplin Organisasi Perangkat Daerah (OPD) yang diterapkan pada sistem **Senter ASN**, kesesuaiannya dengan regulasi nasional, serta rekomendasi penyempurnaan formulasi matematis untuk meminimalkan bias penilaian.

---

## 🎯 1. Kerangka Dasar & Kesesuaian Regulasi

Metode perhitungan Senter ASN dirancang untuk mengukur kedisiplinan kerja pegawai secara kuantitatif berdasarkan **Peraturan Pemerintah Nomor 94 Tahun 2021 tentang Disiplin Pegawai Negeri Sipil**.

### Analisis Kepatuhan Regulasi:
1. **Kewajiban Jam Kerja:** PP 94/2021 Pasal 3 huruf f secara eksplisit mewajibkan PNS untuk masuk kerja dan menaati ketentuan jam kerja. Operasionalisasi keterlambatan (TM) dan pulang cepat (PC) dalam sistem ini selaras dengan amanat tersebut.
2. **Kewenangan Daerah:** PP 94/2021 tidak mengatur formula numerik pembobotan indeks disiplin organisasi. Oleh karena itu, formulasi pembobotan indikator (25% Kehadiran, 20% Kepatuhan Jam, 15% Absensi, dan 40% Hadir Efektif) merupakan bentuk diskresi kebijakan Pemerintah Kabupaten (melalui Perbup TPP) yang sah secara hukum sebagai instrumen insentif dan disinsentif kinerja.

---

## ⚠️ 2. Analisis Kelemahan Formulasi Saat Ini

Meskipun formulasinya logis secara administratif, terdapat beberapa kelemahan matematis dan operasional yang berpotensi memicu rasa ketidakadilan atau bias statistik:

### A. Redundansi Hukuman Berlapis (Triple-Counting Punishment)
Satu pelanggaran ketidakhadiran tanpa keterangan (alpa/mangkir) pegawai dikenakan pemotongan skor secara simultan pada tiga indikator sekaligus:
1. **Indikator Kehadiran Fisik (Bobot 25%):** Hari hadir riil berkurang, menurunkan persentase kehadiran.
2. **Indikator Absensi/Ketidakhadiran (Bobot 15%):** Hari alpa bertambah, menurunkan nilai kepatuhan absensi.
3. **Indikator Hadir Efektif (Bobot 40%):** Hari alpa otomatis menggugurkan status Hadir Normal (HN).
* **Dampak:** Pegawai yang alpa dihukum dengan bobot kumulatif sebesar **80%** dari total nilai organisasi. Secara matematis, alpa tunggal mendistorsi nilai kolektif OPD secara tidak proporsional dibanding bobot pelanggaran waktu lainnya.

### B. Bias Karakteristik Pelayanan OPD (Homogenitas Jam Kerja)
Sistem saat ini menyamakan jam kerja seluruh OPD secara homogen (Senin–Jumat, 07:30–16:00). Hal ini menciptakan ketidakadilan bagi instansi yang memiliki karakteristik operasional khusus:
* **OPD Pelayanan Lapangan/Shift 24 Jam (RSUD, Satpol PP, Dishub, BPBD):** Pegawai bekerja dengan jadwal shift dinamis, piket malam, atau siaga akhir pekan. Akibat ketiadaan kalender jam kerja khusus di database, kehadiran shift mereka sering terdeteksi sebagai "tidak hadir" atau "terlambat" pada sistem standar.
* **OPD Administratif (Bappeda, BKPSDM, Setda):** Memiliki jam kerja teratur sehingga secara alami selalu mendapatkan skor tinggi.

### C. Efek Skala Ukuran Instansi (OPD Size Sensitivity)
Formula saat ini sangat sensitif terhadap ukuran jumlah pegawai di suatu instansi, menguntungkan instansi besar dan merugikan instansi kecil:
* **OPD Kecil (Contoh: Kantor Kecamatan dengan 10 ASN):** Jika **1 pegawai** alpa selama 5 hari, persentase disiplin OPD akan anjlok sebesar **2.27%**.
* **OPD Besar (Contoh: Dinas Pendidikan dengan 500 ASN):** Jika **10 pegawai** alpa selama 5 hari, skor OPD hanya akan terpotong sebesar **0.45%**.
* **Dampak:** Kepala OPD kecil memikul risiko hukuman pembinaan (peringatan Sekda) yang jauh lebih tinggi secara statistik daripada Kepala OPD besar, meskipun kinerja pengawasan internal mereka setara.

### D. Kekakuan Akumulasi Hari (Menit vs Hari)
Sistem saat ini mencatat keterlambatan (TM) secara biner per hari kejadian, tanpa menoleransi akumulasi menit:
* Pegawai yang terlambat 5 menit dihitung melakukan 1 kali pelanggaran TM (mengurangi Hadir Normal hari tersebut).
* Sistem belum mengakomodasi kompensasi menit keterlambatan (misalnya, menutupi keterlambatan masuk dengan menambah jam kerja saat pulang).

---

## 💡 3. Rekomendasi Penyempurnaan Sistem

Untuk mengatasi kelemahan di atas dan memberikan hasil evaluasi yang adil, berikut adalah rekomendasi teknis yang disarankan untuk diimplementasikan pada fase pengembangan berikutnya:

### 1. Rekalibrasi Bobot & Eliminasi Redundansi
Menghapus indikator **Kehadiran Fisik (25%)** karena substansinya sudah terwakili secara lebih ketat oleh **Hadir Efektif (40%)**. Alokasi bobot dapat dirumuskan ulang sebagai berikut:
* **Hadir Efektif / Bersih:** **50%** (Mengukur kepatuhan murni tanpa cacat).
* **Kepatuhan Jam Kerja (TM & PC):** **30%** (Mengukur disiplin kedatangan/kepulangan).
* **Kepatuhan Absensi (Mangkir/Alpa):** **20%** (Mengukur komitmen kehadiran dasar).
* *Dengan formulasi ini, hukuman berlapis alpa dapat dihindari.*

### 2. Implementasi Multi-Kalender Kerja (Shift-based Calendars)
Mengembangkan fitur manajemen kalender kerja di backend agar administrator dapat menetapkan pola jam kerja spesifik per OPD:
* **Tipe A (Administratif):** Senin–Jumat (07:30–16:00).
* **Tipe B (Layanan Shift):** Mengikuti jadwal dinamis (Shift Pagi/Siang/Malam) untuk tenaga medis RSUD dan petugas lapangan Dishub/Satpol PP.

### 3. Normalisasi Skor Berdasarkan Rasio Ukuran OPD
Menambahkan faktor bobot ukuran OPD ($F_s$) dalam kalkulasi peringkat akhir untuk menyeimbangkan sensitivitas OPD kecil:
$$Skor_{Adjusted} = Skor_{Awal} \times F_s$$
Di mana $F_s$ dirancang untuk melunakkan deviasi statistik pada OPD dengan jumlah pegawai di bawah 15 orang.

### 4. Perhitungan Akumulasi Menit Keterlambatan
Mengubah basis pemotongan skor dari biner (hari kejadian) menjadi akumulasi menit dalam sebulan:
* Terlambat di bawah 150 menit per bulan: Bebas potongan.
* Terlambat 150 - 300 menit per bulan: Potongan ringan.
* Terlambat > 300 menit per bulan: Potongan penuh.
* Hal ini memberikan toleransi yang manusiawi bagi kendala lalu lintas atau kebutuhan darurat di pagi hari.

---

## 🐛 4. Perbaikan Bug Kuantitatif (Jumlah Hadir Fisik vs Hadir Normal)

Telah diidentifikasi dan diperbaiki sebuah bug perhitungan krusial di backend yang sebelumnya menyebabkan hasil skor di sistem lebih rendah daripada PDF laporan SIMPEGNAS manual:
- **Penyebab Bug:** Di dalam kode backend awal (`app/services/analytics.py`), variabel `jumlah_hadir` dihitung hanya sebagai jumlahan `hn + dl + tk + tb` (yang secara keliru mengecualikan hari-hari ketika pegawai datang terlambat (TM) atau pulang cepat (PC)). Hal ini menyebabkan `Persentase Kehadiran` (bobot 25%) merosot tajam seolah-olah pegawai tersebut absen pada hari pelanggaran waktu tersebut (hukuman ganda/double penalty).
- **Hasil Perbaikan:** 
  1. `jumlah_tidak_hadir` (absensi mangkir) dihitung sebagai residual murni: `Total Kewajiban - HN - DL - TK - TB - TM - PC` (dibatasi minimal 0).
  2. `jumlah_hadir` (Fisik) dihitung ulang sebagai: `Total Kewajiban - Jumlah Tidak Hadir`.
  Hal ini mengembalikan logika dasar bahwa pegawai yang terlambat atau pulang cepat tetap terhitung **hadir fisik** di kantor, sehingga formula `Persentase Kehadiran = 100% - Persentase Ketidakhadiran` kini bernilai 100% konsisten dengan PDF laporan resmi.
- **Dampak Perbaikan:** Skor total agregat OPD di Dashboard kini naik dan sinkron sepenuhnya dengan output lembar perhitungan Excel manual.

---

## ⚡ 5. Pendeteksian Hari Kerja Dinamis per OPD & Clamping Persentase (Mengatasi Skor > 100)

Telah diidentifikasi dan diperbaiki anomali di mana beberapa instansi pelayanan kesehatan (Puskesmas) memiliki nilai skor akhir melebihi batas kewajaran ($>100$, mencapai 112.50):
- **Penyebab Anomali:** Sebelumnya, `hari_kerja` dihitung global se-Kabupaten (16 hari untuk periode Mei 2026). UPT Puskesmas beroperasi dengan pola **6 hari kerja seminggu** (atau shift), sehingga kehadiran riil pegawainya mencapai **21 hari**. Pembagian `Hadir Normal (21 hari) / Kewajiban Hadir (16 hari)` menghasilkan persentase kehadiran efektif **131.25%**, yang mendongkrak total skor melampaui 100.
- **Hasil Perbaikan:**
  1. **Hari Kerja per OPD:** Proses kalkulasi `hari_kerja` diubah menjadi berkelompok per instansi (`GROUP BY p.opd_id`) menggunakan nilai *mode* statistik dari data mentah pegawai OPD tersebut. Puskesmas kini dinilai berdasarkan 21 hari kerja, sedangkan Dinas biasa 16 hari kerja.
  2. **Clamping 100.0%:** Menambahkan batasan atas mutlak `min(..., 100.0)` pada fungsi `hitung_persentase` sebagai sistem pengaman berlapis (*fail-safe*).
- **Dampak Perbaikan:** Seluruh skor di database bersih dan dinilai secara adil sesuai hari kerja riil masing-masing instansi tanpa ada skor melebihi 100.

---

## 🔄 6. Sinkronisasi Otomatis Pegawai Mutasi saat Impor Excel

Telah ditambahkan fitur penanganan otomatis untuk pegawai yang mengalami mutasi instansi:
- **Masalah Sebelum Perbaikan:** Jika pegawai dipindahtugaskan ke instansi baru, unggahan Excel SIMPEGNAS akan mencatat dinas barunya. Namun, di database master Senter ASN, NIP pegawai tersebut masih terikat pada dinas lama. Hal ini membuat presensi pegawai mutasi salah dihitung di instansi lamanya.
- **Hasil Perbaikan:** Modul impor Excel kini secara dinamis memeriksa NIP yang sudah terdaftar. Jika terdeteksi perubahan nama instansi (`UNIT KERJA`) pada berkas Excel baru, sistem otomatis memperbarui kolom `opd_id` pegawai tersebut di tabel master `master.pegawai`.
- **Dampak Perbaikan:** Pelacakan data presensi mutasi pegawai langsung sinkron ke instansi baru secara *real-time* saat proses unggah selesai.

---
