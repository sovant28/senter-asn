# ADR-003: Arsitektur Dashboard Publik SENTER ASN

* **Status**: Proposed (Diusulkan)
* **Tanggal**: 27 Juli 2026
* **Penulis**: Tim Pengembang SENTER ASN

---

## 1. Konteks (Context)

Untuk meningkatkan transparansi kinerja birokrasi bagi masyarakat Kabupaten Tana Toraja, diperlukan sebuah **Dashboard Publik** yang dapat diakses secara bebas tanpa memerlukan otentikasi/login. Namun, penerapan akses publik ini memicu tiga tantangan teknis dan hukum:
1. **Keamanan & Privasi Data (Kepatuhan UU PDP):** Berkas presensi bulanan memuat data pribadi ASN (Nama, NIP, status medis/cuti sakit, riwayat keterlambatan harian). Data tingkat individu ini bersifat sensitif dan tidak boleh terekspos ke publik.
2. **Performa Server (Database Shielding):** Dashboard publik yang diakses oleh ribuan warga secara bersamaan berisiko membebani database PostgreSQL melalui kueri agregasi SQL yang berat, berpotensi memicu *downtime* sistem.
3. **Kemudahan Pemeliharaan (Maintenance):** Arsitektur baru harus mudah dirawat tanpa memisahkan repositori frontend/backend yang sudah ada.

## 2. Keputusan Arsitektur (Decision)

Kami mengusulkan penerapan solusi terintegrasi menggunakan Next.js App Router dan FastAPI dengan spesifikasi teknis berikut:

### A. Pembatasan Data & Public API (Backend FastAPI)
* **Tindakan**: Membuat rute API publik khusus di `backend/app/api/public.py` (misalnya `/api/v1/public/ranking`).
* **Kebijakan Keamanan**: Endpoint ini dikecualikan dari dependensi otentikasi JWT (`get_current_user`).
* **Payload Reduksi**: Respons API *hanya* mengembalikan data tingkat makro:
  * Nama OPD, Kode OPD, Skor Akhir Disiplin, dan Kategori.
  * Ringkasan statistik kabupaten (rata-rata kabupaten, jumlah instansi per kategori).
  * API **dilarang keras** mengembalikan daftar pegawai (`pegawai_id`), detail pelanggaran per orang, atau berkas unduhan PDF laporan detail.

### B. Routing Paralel Tanpa Login (Next.js Frontend)
* **Tindakan**: Mengelompokkan folder halaman Next.js menggunakan Route Groups untuk memisahkan kepemilikan sesi:
  * **`(app)/`**: Rute admin yang dilindungi (Dashboard Admin, Upload, Laporan PDF detail). Mewarisi pemeriksaan token otentikasi.
  * **`(public)/`**: Rute umum tanpa pemeriksaan sesi otentikasi. 
* **Rute `/` (Landing Page)**: Dijadikan halaman Dashboard Publik utama. Warga yang mengakses langsung disajikan rangkuman visual. Tombol *"Portal Admin (Login)"* diletakkan di pojok kanan atas untuk mengarahkan admin ke `/login`.

### C. Caching & Database Shielding (Next.js ISR)
* **Tindakan**: Menerapkan **Incremental Static Regeneration (ISR)** pada halaman dashboard publik di Next.js dengan siklus revalidasi data:
  ```typescript
  // Eksport opsi revalidasi di page.tsx publik
  export const revalidate = 3600; // Generate ulang halaman statis setiap 1 jam
  ```
* **Dampak**: Halaman dashboard publik akan disajikan sebagai berkas HTML statis dari cache server Next.js. Kueri database agregasi yang berat hanya akan dieksekusi maksimal satu kali per jam, melindungi database dari beban puncak (*load spike*).

---

## 3. Konsekuensi (Consequences)

### Dampak Positif:
1. **Kepatuhan Regulasi:** Menjamin kepatuhan penuh terhadap UU Perlindungan Data Pribadi (UU PDP) karena data pegawai tetap terkunci di balik otentikasi admin.
2. **Efisiensi Performa:** Beban database mendekati 0% saat lonjakan trafik publik terjadi berkat pemanfaatan cache ISR Next.js.
3. **Satu Repositori (Code Consolidation):** Seluruh kode frontend publik dan admin tetap berada di satu project Next.js yang memudahkan pemeliharaan kode jangka panjang.

### Dampak Negatif / Batasan:
* **Data Delay (Latensi):** Publik akan melihat data dengan delay maksimal 1 jam dari waktu pengunggahan data terbaru (dapat dioptimalkan di masa mendatang dengan memicu pembersihan cache via webhook *On-Demand Revalidation* setelah proses upload sukses).
