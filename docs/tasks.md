# Tasks — SENTER ASN

> **Tracker task proyek.** Diupdate setiap kali ada task baru/mulai/selesai.
> Untuk status real-time, lihat GitHub Issues / Project board.

---

## 🚧 Sedang Dikerjakan (In Progress)

> Status: Design & Documentation phase. Belum ada kode di-implement.

### Design Phase
- [ ] **TASK-001** Susun struktur dokumentasi proyek (CLAUDE.md, docs/)
  - Status: ✅ DONE (2026-07-13)
  - Owner: @user

- [ ] **TASK-002** Finalisasi rumus skor & kategori (25/20/15/40)
  - Status: ✅ DONE (confirmed via PDF sample)
  - ADR: [`decisions/ADR-002-scoring-formula.md`](decisions/ADR-002-scoring-formula.md)

- [ ] **TASK-003** Konfirmasi tech stack & deployment target
  - Status: 🟡 In discussion

---

## 📋 Backlog (Prioritas)

### Milestone 1: MVP (Target: Agustus 2026)

- [x] **TASK-101** Generate dummy data 1000+ baris
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `samples/dummy-presensi-1000rows.xlsx`
  - Verified: 1125 rows, 26 OPD, 80ms parse, 0 errors — 58% moderate violation, 16% TM2, 5% TM3, 15% DL, 34 honorer NIP None

- [x] **TASK-102** Backend: Excel parser module
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `backend/app/services/excel_parser.py`
  - Spec: [`modules/01-excel-parser.md`](modules/01-excel-parser.md)
  - Verified: 14 tests passing, file validation (ext/mime/size/zip), header validation, row parsing, NIP/null handling, counter defaults, warnings (OPD fuzzy, counter sum, rare cols)

- [x] **TASK-103** Backend: Database schema & migrations
  - Priority: P0
  - Output: `backend/alembic/versions/`
  - Spec: [`modules/02-database.md`](modules/02-database.md)
  - Acceptance: schema sesuai `data-model.md`, migration reversible
  - Status: ✅ DONE (2026-07-14)
  - Verified: 3 schema, 7 tabel, 22 indexes, 19 constraints — reversible di Supabase PostgreSQL 15

- [x] **TASK-104** Backend: Analytics engine (skor & kategori)
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `backend/app/services/analytics.py`
  - Spec: [`modules/03-analytics-engine.md`](modules/03-analytics-engine.md)
  - Verified: 22 tests passing — pure functions (hitung_counter, hitung_persentase, hitung_skor, tentukan_kategori), fixed `jumlah_hadir` to sum attendance days (HN+DL+TK+TB), bobot 25/20/15/40, 4 kategori thresholds, ranking via SQL window function

- [x] **TASK-105** Backend: PDF generator (5 halaman)
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `backend/app/services/pdf_generator.py`
  - Spec: [`modules/04-pdf-generator.md`](modules/04-pdf-generator.md)
  - Verified: 7 tests passing, 5 halaman A4 (Cover, Ketidakhadiran & Pelanggaran, Kehadiran & Efektif, Total Skor, Evaluasi), ranking tables, highlight boxes, pie chart + bar chart via matplotlib, color-coded kategori, 32.7 KB output

- [x] **TASK-106** Backend: API endpoints (CRUD presensi, generate PDF)
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `backend/app/api/`
  - Verified: 10 tests, 8 endpoints (auth/login, presensi/upload, presensi/periods, analytics/opd-ranking, analytics/opd/{id}, reports/pdf, users, health), OpenAPI auto-generated, CORS configured, all routers wired in main.py

- [x] **TASK-107** Frontend: Upload page
  - Status: ✅ DONE (2026-07-14)
  - Priority: P1
  - Output: `frontend/src/app/upload/page.tsx`
  - Verified: drag-drop Excel upload, progress bar, result summary

- [x] **TASK-108** Frontend: Dashboard page (charts & ranking)
  - Status: ✅ DONE (2026-07-14)
  - Priority: P1
  - Output: `frontend/src/app/dashboard/page.tsx`
  - Verified: ECharts (pie + bar), 4 stat cards, 26 OPD ranking table, color-coded, responsive

- [x] **TASK-109** Frontend: PDF preview & download
  - Status: ✅ DONE (2026-07-14)
  - Priority: P1
  - Output: `frontend/src/app/reports/page.tsx`
  - Verified: periode selector, download button, iframe preview

- [x] **TASK-110** Backend: Auth & RBAC (JWT, bcrypt, middleware)
  - Status: ✅ DONE (2026-07-14)
  - Priority: P0
  - Output: `backend/app/services/auth.py`, `backend/app/middleware/auth.py`, `backend/app/api/auth.py`
  - Verified: 19 tests passing, JWT access/refresh tokens, 5 roles (SUPER_ADMIN, HR_MANAGER, KEPALA_OPD, TIM_IT, PEGAWAI), bcrypt hashing, login/me/refresh/change-password endpoints, role-based guards on upload/analytics routes

- [x] **TASK-111** Next.js 16 + PWA scaffold
  - Status: ✅ DONE (2026-07-14)
  - Priority: P1
  - Output: `frontend/`
  - Verified: Next.js 16.2.10, TypeScript, Tailwind v4, JWT auth context, 5 pages, build passes

- [x] **TASK-112** Frontend: Metode Perhitungan page (algoritma + kalkulator)
  - Status: ✅ DONE (2026-07-15)
  - Priority: P1
  - Output: `frontend/src/app/perhitungan/page.tsx`
  - Verified: build passes, opd_id added to ranking API, 4-langkah algoritma documented, step-by-step live calculator, form koreksi admin, nav link added to all pages
  - Related: fixed bar chart color bug on dashboard (was coloring by rank position, now by kategori) + bar chart ordering (rank #1 at top)

- [x] **TASK-113** Backend: Fix periods endpoint (baca dari agregat, bukan upload_log)
  - Status: ✅ DONE (2026-07-15)
  - Priority: P1
  - Output: `backend/app/api/presensi.py` — list_periods
  - Verified: periods now returns actual data from `presensi_agregat_opd`, not empty `upload_log`

- [x] **TASK-114** Backend: Stabilize Supabase connection (pooler + pool config)
  - Status: ✅ DONE (2026-07-15)
  - Priority: P0
  - Output: `backend/app/db/session.py`, `backend/.env`, `.env`
  - Verified: `pool_pre_ping=True`, `pool_recycle=300`, `statement_cache_size=0`, pooler port 6543 via `aws-0-ap-southeast-1.pooler.supabase.com`

- [x] **TASK-115** Backend: Auto-import OPD & Pegawai dari Excel upload
  - Status: ✅ DONE (2026-07-15)
  - Priority: P0
  - Output: `backend/app/api/presensi.py` — upload_presensi (auto-OPD, auto-pegawai, NIP mapping)
  - Verified: 1 Excel file → auto-creates OPD, pegawai, presensi_raw, upload_log. `OPD_XXXX` unique kode. Bulk insert. `await db.flush()` for FK resolution.

- [x] **TASK-116** Backend: Flexible Excel parser (header aliases + NIP cleanup)
  - Status: ✅ DONE (2026-07-15)
  - Priority: P0
  - Output: `backend/app/services/excel_parser.py` — HEADER_ALIASES, `lstrip("'")`
  - Verified: Accepts "NO" as alias for "NO URUT", strips trailing spaces, strips `'` prefix from NIP

- [x] **TASK-117** Backend: Analytics trigger endpoint
  - Status: ✅ DONE (2026-07-15)
  - Priority: P1
  - Output: `backend/app/api/analytics.py` — `POST /analytics/run`
  - Verified: triggers `proses_agregat` + `update_rankings`, returns opd_count

- [x] **TASK-118** Frontend: Upload page UX improvements
  - Status: ✅ DONE (2026-07-15)
  - Priority: P1
  - Output: `frontend/src/app/upload/page.tsx`, `frontend/src/lib/api.ts`
  - Verified: loading spinner, error details expandable, "Jalankan Analytics" button after upload, link to /dashboard, error handling with 401 redirect

- [x] **TASK-119** Backend & Frontend: Dynamic work days per OPD inside `/perhitungan` page
  - Status: ✅ DONE (2026-07-22)
  - Priority: P1
  - Verified: API returns `hari_kerja` per OPD; simulator step 1 and theoretical text render dinamis (e.g. 16 days for Dinsos).

- [x] **TASK-120** Database & Repository: Restrict application scope to 26 Primary OPDs (Phase 1)
  - Status: ✅ DONE (2026-07-22)
  - Priority: P0
  - Verified: `is_active` set to True only for 26 main OPDs; queries join and filter by `OPD.is_active == True`; rankings calculation only ranks active OPDs; verified exact 26 rows output.

- [x] **TASK-121** Database & System: Direct database connection (port 5432) to resolve pooler connection timeouts
  - Status: ✅ DONE (2026-07-22)
  - Priority: P0
  - Verified: Switched `.env` configuration from pooler port 6543 to direct connection port 5432 with `postgres` username, eliminating connection timeouts entirely.

### Milestone 2: Beta (Target: September 2026)

- [ ] **TASK-201** Frontend: Detail OPD page
- [ ] **TASK-202** Frontend: User management page (admin)
- [ ] **TASK-203** Frontend: Profile page
- [ ] **TASK-204** Backend: Notification (email untuk Kepala OPD)
- [ ] **TASK-205** Backend: Early warning logic (auto alert)
- [ ] **TASK-206** Backend: Audit logging
- [ ] **TASK-207** CI/CD pipeline (GitHub Actions)
- [ ] **TASK-208** PWA manifest & service worker
- [ ] **TASK-209** Unit tests & integration tests (>80% coverage)

### Milestone 3: Production (Target: Oktober 2026)

- [ ] **TASK-301** Security hardening (WAF, encryption at rest, MFA)
- [ ] **TASK-302** Production deployment ke VPS Indonesia
- [ ] **TASK-303** Backup & disaster recovery
- [ ] **TASK-304** Monitoring & alerting (Prometheus + Grafana)
- [ ] **TASK-305** Load testing (target: 50 concurrent users)
- [ ] **TASK-306** UU PDP compliance audit
- [ ] **TASK-307** User training & documentation
- [ ] **TASK-308** Go-live support

### Backlog (Future Enhancements)

- [ ] **TASK-401** LLM-generated narrative insights (bahasa alami)
- [ ] **TASK-402** Perbandingan antar periode (trend analysis)
- [ ] **TASK-403** Forecasting (prediksi OPD perlu pembinaan bulan depan)
- [ ] **TASK-404** Mobile app native (jika PWA kurang)
- [ ] **TASK-405** Integrasi langsung dengan SIMPEGNAS API
- [ ] **TASK-406** Anomaly detection (ML) untuk deteksi fraud presensi
- [ ] **TASK-407** Multi-bahasa (Indonesia + Inggris untuk pelaporan)
- [ ] **TASK-408** White-label untuk kabupaten lain

---

## ✅ Selesai (Done)

### Discovery & Design (2026-07)
- [x] **TASK-001** Kumpulkan requirement & sample data
- [x] **TASK-002** Identifikasi stakeholder & success criteria
- [x] **TASK-003** Review sample Excel & PDF output
- [x] **TASK-004** Tentukan tech stack
- [x] **TASK-005** Tentukan scoring formula (25/20/15/40)
- [x] **TASK-006** Susun dokumentasi proyek (CLAUDE.md, docs/, modules/)
- [x] **TASK-007** Identifikasi security & compliance requirement (UU PDP)

### Build Phase (2026-07/08)
- [x] **TASK-103** Backend: Database schema & migrations
  - 3 schema (master, presensi, audit), 7 tabel, 22 indexes, 19 constraints
  - Migration reversible — tested on Supabase PostgreSQL 15
  - Files: `backend/alembic/versions/001_initial_schema.py`, `backend/app/models/`

- [x] **TASK-110** Backend: Auth & RBAC
  - Date: 2026-07-14
  - Files: `backend/app/services/auth.py`, `backend/app/middleware/auth.py`, `backend/app/api/auth.py`
  - JWT access/refresh tokens, bcrypt password hashing, 5 roles, role-based middleware guards

- [x] **TASK-112** Frontend: Metode Perhitungan page
  - Date: 2026-07-15
  - Files: `frontend/src/app/perhitungan/page.tsx`, `backend/app/api/analytics.py`
  - Live step-by-step OPD calculator, 4-langkah algoritma, form koreksi admin
  - Bar chart color fix: dashboard Top 10 OPD now colors by kategori, not rank position

### Stabilization & Real Data (2026-07-15)
- [x] **TASK-113** Fix `/api/presensi/periods` — ganti source dari `upload_log` ke `presensi_agregat_opd`
- [x] **TASK-114** Stabilkan Supabase connection — pooler port 6543, `pool_pre_ping`, `statement_cache_size=0`
- [x] **TASK-115** Auto-import OPD & Pegawai dari Excel upload (1 file → semua tabel terisi)
  - Bulk insert untuk 6555+ row, `OPD_XXXX` kode, NIP-to-pegawai resolution
- [x] **TASK-116** Parser: terima `"NO"` alias `"NO URUT"`, strip `'` dari NIP (format Excel BKPSDM)
- [x] **TASK-117** Endpoint `POST /api/analytics/run` — trigger agregasi + ranking manual
- [x] **TASK-118** Upload page UX: spinner, error detail, tombol "Jalankan Analytics" → link Dashboard
- [x] **TASK-119** Backend & Frontend: Dynamic work days per OPD inside `/perhitungan` page (2026-07-22)
- [x] **TASK-120** Database & Repository: Restrict application scope to 26 Primary OPDs (Phase 1) (2026-07-22)
- [x] **TASK-121** Database & System: Direct database connection (port 5432) to resolve pooler connection timeouts (2026-07-22)
- [x] **TASK-122** Backend Analytics: Full 22 Counter Field Selection & BKPSDM Formula Alignment (2026-07-22)
  - Updated `_fetch_presensi_rows` in `backend/app/services/analytics.py` to map all 22 counter fields.
  - Aligned counter aggregation formulas (`hitung_counter_agregat`):
    - `Terlambat`: TM1 + TM2 + TM3 + TMM + ITM (168x)
    - `Pulang Cepat`: PC1 + PCM + IPC (49x)
    - `Hadir Normal`: HN + DL + CT (452x)
    - `Tidak Hadir`: TK + ITMPC (61x)
    - `Hadir Fisik`: Total Kewajiban - Tidak Hadir (639x) -> Total Skor: 76.14 (Kategori: CUKUP).
  - 72 unit tests updated and passing 100%.
- [x] **TASK-123** Backend Import API: Fix `PresensiRaw` Counter Field Overwrite Bug (2026-07-22)
  - Fixed `upload_presensi` in `backend/app/api/presensi.py` to store parsed `tmm` and `pcm` raw values directly rather than overwriting with `tm1+tm2+tm3`.
- [x] **TASK-124** Backend Safeguard: Automated Presensi Raw Cleanup on Re-Upload (2026-07-22)
  - Added clean deletion query (`delete(PresensiRaw)`) for existing pegawai IDs in the same month & year before inserting new rows on upload.
  - Prevents row duplication and guarantees 100% data independence across OPD uploads.
- [x] **TASK-125** Fullstack Feature: OPD Upload Control Panel & Checklist API/UI (2026-07-22)
  - Added `GET /api/presensi/status-opd` endpoint in `backend/app/api/presensi.py`.
  - Built **Panel Kontrol Checklist Upload (26 OPD)** component in `frontend/src/app/(app)/upload/page.tsx` featuring 4 summary cards, completion progress bar, quick filter tabs, and real-time 26 OPD status checklist.
- [x] **TASK-126** Frontend Dashboard: Smart Period Detection & Government Enterprise Onboarding UI (2026-07-22)
  - Updated `frontend/src/app/(app)/dashboard/page.tsx` with `fetchPeriods()` integration to auto-detect and default to the latest uploaded period.
  - Replaced cyberpunk AI-slop gradient and sparkles icon with clean Government Enterprise UI (`bg-white` card, `Building2` icon, primary dark button).

---

## 🐛 Known Issues / Blockers

1. **Inconsistency di template asli:** Sheet "Petunjuk" tertulis bobot 60/20/20, tapi formula pakai 25/20/15/40. Sudah di-handle di ADR-002.
2. **Data DL (Dinas Luar):** Pegawai DL sering bikin data terlihat "jelek" padahal sedang tugas lapangan. Perlu handling khusus di PDF (tanda bintang + catatan).
3. **66 OPD sub-unit di data asli:** Kolom UNIT KERJA berisi UPT/alama/sub-unit, bukan 26 OPD induk. Perlu master OPD yang authoritative dari BKPSDM.
4. **Analytics belum auto-trigger:** Setelah upload via website, user harus klik "Jalankan Analytics" dulu. (TASK-117 solve partial, full auto-trigger di Milestone 2)
5. **Password & connection string ada di .env:** Untuk produksi, pindahkan ke environment variable / secrets manager.

---

## 📊 Sprint Board (Visual)

```
┌──────────────────┬──────────────────┬──────────────────┐
│   BACKLOG        │   IN PROGRESS    │      DONE        │
├──────────────────┼──────────────────┼──────────────────┤
│ TASK-201 ... 209 │ TASK-003         │ TASK-001 ... 007 │
│ TASK-301 ... 308 │                  │ TASK-101 ... 118 │
│ TASK-401 ... 408 │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## 📝 Update Format

Saat update file ini, gunakan format:

```markdown
- [x] **TASK-NNN** Judul task
  - Status: ✅ DONE / 🟡 IN PROGRESS / ⏳ PENDING
  - Date: YYYY-MM-DD
  - Owner: @username
  - Note: (optional) link PR, catatan, dll
```

---

> **Untuk detail per-task, lihat spec di [`docs/modules/`](modules/).**
> **Untuk update status, edit file ini langsung atau gunakan GitHub Issues.**
