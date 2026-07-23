# Security — SENTER ASN

> **WAJIB BACA sebelum handle data presensi ASN.**
> Dokumen ini menjelaskan lapisan keamanan, kepatuhan UU PDP, dan prosedur data handling.

---

## 🚨 PERINGATAN KRITIS

> **Data presensi ASN = DATA PRIBADI SENSITIF**
>
> Berisi: nama, NIP, pola kehadiran, cuti sakit (data kesehatan), absensi.
> Dilindungi oleh **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**.
> Sanksi pelanggaran: denda administratif + pidana (sampai 4 tahun penjara untuk kebocoran data).

**Larangan mutlak:**
- ❌ **JANGAN** upload/commit data presensi ASN asli ke repository
- ❌ **JANGAN** kirim data asli ke AI chat / LLM pihak ketiga
- ❌ **JANGAN** simpan data di cloud luar negeri tanpa anonymisasi
- ❌ **JANGAN** log data sensitif (NIP + nama + presensi) ke file log biasa
- ❌ **JANGAN** share screenshot database yang berisi NIP asli

---

## 🛡️ Lapisan Keamanan (Defense in Depth)

### 1. Network & Transport

| Kontrol | Implementasi |
|---------|--------------|
| HTTPS only | TLS 1.3, redirect HTTP → HTTPS |
| HSTS | Strict-Transport-Security header |
| WAF | Cloudflare / ModSecurity (production) |
| Rate limiting | 100 req/menit per IP |
| CORS | Whitelist domain trusted only |

### 2. Authentication

| Kontrol | Implementasi |
|---------|--------------|
| Password | bcrypt cost ≥ 12, min 12 char, complexity |
| JWT | Access token 15 menit, refresh token 7 hari |
| Refresh token rotation | Setiap refresh → token baru, token lama invalid |
| MFA | Wajib untuk SUPER_ADMIN (TOTP via Google Authenticator) |
| Session management | Server-side session list, bisa revoke |
| Login attempt limit | 5x salah → lock 15 menit |
| Password reset | Via email, token sekali pakai, expire 1 jam |

### 3. Authorization (RBAC)

5 role dengan permission matrix (detail di [`modules/06-auth-rbac.md`](modules/06-auth-rbac.md)):

| Role | Akses Data | Akses Fitur |
|------|------------|-------------|
| **SUPER_ADMIN** | Semua | Manage user, config, monitoring |
| **HR_MANAGER** | Semua OPD | Upload, validasi, edit data, generate laporan |
| **KEPALA_OPD** | OPD sendiri + agregat | View dashboard, download PDF |
| **EKSEKUTIF** | Semua (read-only) | View dashboard, download PDF |
| **PEGAWAI** | Data sendiri | View presensi pribadi |

### 4. Data in Transit

| Kontrol | Implementasi |
|---------|--------------|
| TLS version | Minimal 1.2, prefer 1.3 |
| Cipher suite | Hanya yang strong (no RC4, no MD5) |
| Certificate | Let's Encrypt (dev) / CA resmi (prod) |
| Certificate rotation | Otomatis setiap 60-90 hari |

### 5. Data at Rest

| Kontrol | Implementasi |
|---------|--------------|
| Database encryption | PostgreSQL TDE (transparent data encryption) |
| Field-level encryption | NIP di-encrypt dengan pgcrypto untuk backup |
| File storage | Excel upload di-encrypt di object storage |
| Key management | Env var (dev) / Vault (prod), rotation berkala |
| Backup encryption | pg_dump + gpg encrypt sebelum disimpan |

### 6. File Upload Security

Wajib untuk endpoint `/api/presensi/upload`:

| Kontrol | Implementasi |
|---------|--------------|
| Format whitelist | Hanya `.xlsx` |
| MIME type check | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Size limit | Max 10 MB |
| Magic byte check | Validasi header file (anti rename `.exe` jadi `.xlsx`) |
| Antivirus scan | ClamAV via sidecar container |
| Sandbox parsing | Parse di worker process terpisah, tidak di main API |
| Template validation | Validasi header & kolom sebelum parse rows |
| Hash logging | SHA-256 file → simpan di audit log |
| Auto-delete | File asli di-delete setelah 30 hari (opsional: 7 hari) |

### 7. Input Validation

```python
# Setiap input divalidasi sebelum masuk logic
NIP: 18 digit angka, atau None (untuk honorer)
TAHUN: 2020-2030
BULAN: 1-12
UNIT KERJA: harus ada di master.opd
Semua numerik: positive integer, < 1000
String: max length 200, anti XSS, anti SQL injection
```

### 8. Audit Logging

**WAJIB log:**
- Login (success & fail)
- Upload file (siapa, kapan, hash, row count)
- Akses data pegawai tertentu (siapa, pegawai mana)
- Generate/download PDF
- Perubahan master data (user, OPD, pegawai)
- Perubahan data presensi

**Format log entry:**
```json
{
  "timestamp": "2026-07-13T12:30:00+08:00",
  "user_id": 123,
  "username": "hr_staff_01",
  "role": "HR_MANAGER",
  "action": "UPLOAD_PRESENSI",
  "resource": {"type": "upload", "id": "uuid-here"},
  "ip": "10.0.1.50",
  "user_agent": "Mozilla/5.0...",
  "result": "success",
  "rows_imported": 1042
}
```

**Properti audit log:**
- IMMUTABLE (no UPDATE/DELETE permission)
- Retention: minimum 5 tahun (compliance)
- Backup ke storage terpisah

### 9. Session & Cookie

| Kontrol | Implementasi |
|---------|--------------|
| Cookie flag | HttpOnly, Secure, SameSite=Strict |
| JWT storage | Memory (tidak di localStorage) |
| Session timeout | 30 menit idle, 8 jam max |
| Concurrent session | Max 2 per user |
| Logout | Clear semua token, invalidate refresh |

### 10. Error Handling

- ❌ JANGAN return stack trace ke user
- ❌ JANGAN log data sensitif (NIP + presensi) ke file log
- ✅ Return generic error message
- ✅ Log error detail ke secure log (dengan sanitized data)
- ✅ Alert admin untuk error critical

---

## 📜 UU PDP Compliance

### Pemetaan UU PDP ke Kontrol Teknis

| Pasal UU PDP | Isi | Kontrol SENTER ASN |
|--------------|-----|---------------------|
| Pasal 1-4 | Definisi & prinsip | Dokumen ini + privacy policy |
| Pasal 5-7 | Hak subjek data | Endpoint API untuk akses, koreksi, hapus data pribadi |
| Pasal 8-10 | Pemrosesan data | Consent + tujuan jelas (monitoring disiplin) |
| Pasal 11-14 | Persetujuan | Consent banner untuk fitur opsional (self-service) |
| Pasal 15-18 | Pengolahan data | Data minimization (simpan yang perlu saja) |
| Pasal 19-23 | Transfer data | Hosting di Indonesia, no cross-border tanpa anonymisasi |
| Pasal 24-28 | Keamanan data | Encryption, RBAC, audit (semua kontrol di atas) |
| Pasal 29-32 | Pelaporan insiden | Incident response plan, notifikasi 3x24 jam |
| Pasal 33-36 | Sanksi | Compliance audit berkala |

### Consent & Tujuan

**Tujuan pengolahan data:** Monitoring & evaluasi disiplin ASN untuk peningkatan kualitas pelayanan publik (dasar hukum: UU ASN No. 5/2014).

**Data yang dikumpulkan:**
- NIP, nama, OPD, jenis ASN (master)
- Counter presensi bulanan (operasional)
- Login & aktivitas (keamanan)

**Data yang TIDAK dikumpulkan:**
- ❌ Alamat rumah
- ❌ Nomor telepon pribadi
- ❌ Agama, suku, status pernikahan
- ❌ Riwayat kesehatan detail
- ❌ Data keluarga

**Hak subjek data (ASN):**
- Akses: bisa lihat data sendiri via endpoint `/api/pegawai/me`
- Koreksi: request via HR untuk koreksi data master
- Hapus: hanya untuk data opsional (foto profil, preferensi notifikasi)

### Retention Policy

| Tipe Data | Retention | Alasan |
|-----------|-----------|--------|
| Presensi raw | 5 tahun | Compliance audit BKN |
| Presensi agregat | Permanen | Historical analysis |
| Audit log | 5 tahun | Investigasi insiden |
| User account | Aktif + 1 tahun setelah non-aktif | Operasional |
| Upload file (Excel) | 30 hari, lalu auto-delete encrypted | Referensi jika ada dispute |
| Session token | Sampai logout / expire | Standar |

### Data Breach Response Plan

1. **Deteksi:** Alert otomatis untuk anomali (login gagal massal, upload file > 100x normal, dsb)
2. **Kontain:** Isolate affected system, rotate credentials
3. **Investigasi:** Tentukan scope & data yang terdampak
4. **Notifikasi:** ≤ 3x24 jam ke subjek data + regulator (Kominfo) jika kategori "signifikan"
5. **Remediasi:** Patch, update kontrol, post-mortem
6. **Dokumentasi:** Incident report untuk audit

---

## 🔐 Data Handling Procedures

### Untuk Developer

**Saat development / testing:**
1. **WAJIB pakai dummy data.** Lihat `scripts/generate-dummy.py` (akan dibuat).
2. **JANGAN** download data produksi ke laptop dev.
3. **JIKA** harus pakai data produksi (untuk debug production issue):
   - Minta approval dari HR Manager
   - Anonymize NIP → ganti dengan hash (e.g., `NIP_a3f5b9c...`)
   - Anonymize nama → ganti dengan `NAMA_001`, `NAMA_002`
   - Hapus file dari lokal setelah selesai
   - Log akses di `audit.access_log`

**Saat commit ke repository:**
- ✅ Aman: kode, konfigurasi (tanpa secret), template, dummy data
- ⚠️ Hati-hati: `.env.example` (BUKAN `.env`), dokumentasi dengan screenshot yang sudah di-redact
- ❌ Dilarang: data produksi, file `.env`, API key, kredensial

**Saat pakai AI assistant (ChatGPT, Claude, Copilot, dsb):**
- ✅ Aman: minta review kode, desain arsitektur, debugging
- ⚠️ Hati-hati: paste log yang sudah di-redact, error message tanpa NIP/nama
- ❌ Dilarang: paste data presensi, NIP, nama asli

### Untuk HR Staff (Operator)

1. **Upload presensi:** hanya via halaman `/upload` di aplikasi
2. **JANGAN** kirim file Excel presensi via email/chat
3. **Password:** ganti setiap 90 hari, jangan share
4. **Logout** setelah selesai, terutama di komputer bersama
5. **Lapor** ke IT jika ada aktivitas mencurigakan

### Untuk Admin Server

1. **Akses server** hanya via SSH key (no password)
2. **Firewall:** hanya buka port 80, 443, 22 (restricted IP)
3. **Database:** tidak exposed ke publik
4. **Backup:** harian, ter-encrypt, simpan di lokasi terpisah
5. **Update** security patch tepat waktu
6. **Monitoring:** aktif untuk failed login, anomali traffic

---

## ✅ Security Checklist (untuk Production)

### Pre-launch
- [ ] HTTPS aktif & valid certificate
- [ ] WAF aktif
- [ ] Database encryption at rest
- [ ] File upload validation lengkap
- [ ] RBAC tested untuk semua role
- [ ] Audit log immutability verified
- [ ] Backup & restore tested
- [ ] Incident response plan documented
- [ ] Privacy policy published
- [ ] DPA (Data Processing Agreement) dengan vendor (jika ada)
- [ ] Penetration testing selesai

### Post-launch (ongoing)
- [ ] Security patch update mingguan
- [ ] Audit log review bulanan
- [ ] Backup verification mingguan
- [ ] Access review triwulan
- [ ] Penetration testing tahunan
- [ ] UU PDP compliance audit tahunan

---

## 📚 Referensi

- **UU No. 27 Tahun 2022** tentang Pelindungan Data Pribadi
- **UU No. 5 Tahun 2014** tentang Aparatur Sipil Negara (ASN)
- **Peraturan BKN** tentang disiplin PNS
- **OWASP Top 10** untuk web application security
- **NIST Cybersecurity Framework** untuk security controls

---

> **Pertanyaan keamanan?** Kontak: [security@bkpsdm-tanatoraja.go.id]
> **Insiden?** Hubungi IT lead + lapor ke Kominfo sesuai UU PDP.
