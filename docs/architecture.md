# Architecture — SENTER ASN

> **Dokumen ini menjelaskan BAGAIMANA sistem dirancang.**
> Untuk konteks bisnis, lihat [`context.md`](context.md). Untuk data schema, lihat [`data-model.md`](data-model.md).

---

## 🏛️ Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LAYER (5 Roles)                      │
│  Super Admin │ HR Manager │ Kepala OPD │ Eksekutif │ ASN    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (PWA, Web)
┌────────────────────────┴────────────────────────────────────┐
│                  PRESENTATION LAYER                          │
│              Next.js 14 + TypeScript + PWA                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Upload  │Dashboard │   PDF    │  User    │  Report  │  │
│  │ Page    │ (Charts) │ Preview  │  Mgmt    │  Export  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + JWT
┌────────────────────────┴────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│              FastAPI (Python 3.11) + Async                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │  Excel       │  Analytics   │  PDF         │  Auth    │ │
│  │  Parser      │  Engine      │  Generator   │  Service │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│           │              │              │                   │
│           │         ┌────┴────┐         │                   │
│           │         │ LLM     │ (opsional,                │
│           │         │ Insight │  anonymized)              │
│           │         └─────────┘                            │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy ORM
┌────────────────────────┴────────────────────────────────────┐
│                     DATA LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │  PostgreSQL 15   │  │  Object Storage  │  │  Redis   │ │
│  │  (primary data)  │  │  (encrypted      │  │  (cache  │ │
│  │  presensi_raw,   │  │   Excel upload)  │  │  session)│ │
│  │  presensi_aggr,  │  │                  │  │          │ │
│  │  users, audit)   │  │                  │  │          │ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow End-to-End

```
┌─────────────────┐
│ HR Upload Excel │ (Step 1)
└────────┬────────┘
         ▼
┌─────────────────────────────────────────┐
│ 1. FILE VALIDATION                      │
│    - Cek format .xlsx                   │
│    - Cek ukuran max (mis. 10MB)         │
│    - Validasi header sesuai template    │
│    - Antivirus scan                     │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 2. PARSE & EXTRACT                      │
│    - Pandas baca sheet                  │
│    - Validasi kolom wajib               │
│    - Sanitasi data (anti injection)     │
│    - Hash file (SHA-256) untuk audit   │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 3. SIMPAN KE DATABASE                   │
│    - Bulk insert ke presensi_raw        │
│    - Simpan metadata upload di audit    │
│    - Trigger hitung agregat             │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 4. AGGREGATE PER OPD                    │
│    - Group by UNIT KERJA                │
│    - Hitung: hadir, telat, cepat, dll  │
│    - Simpan ke presensi_agregat_opd     │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 5. HITUNG SKOR & KATEGORI               │
│    - Apply rumus 25/20/15/40            │
│    - Tentukan kategori (4 warna)        │
│    - Ranking antar OPD                  │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 6. GENERATE OUTPUT                      │
│    ├─ PDF 5 halaman (ReportLab)         │
│    └─ JSON untuk dashboard              │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────────────────────┐
│ 7. TAMPILKAN                            │
│    - Dashboard interaktif (ECharts)     │
│    - PDF download button                │
│    - Notifikasi ke Kepala OPD           │
└─────────────────────────────────────────┘
```

---

## 🧩 Komponen Sistem

### Backend (Python 3.11 + FastAPI)

| Modul | Tanggung Jawab | File |
|-------|----------------|------|
| **Excel Parser** | Baca & validasi Excel presensi | `backend/app/services/excel_parser.py` |
| **Analytics Engine** | Hitung agregat, skor, ranking | `backend/app/services/analytics.py` |
| **PDF Generator** | Render 5 halaman PDF SENTER ASN | `backend/app/services/pdf_generator.py` |
| **Auth Service** | Login, JWT, RBAC | `backend/app/services/auth.py` |
| **User Service** | CRUD user, role, OPD assignment | `backend/app/services/users.py` |
| **Audit Service** | Log semua aksi | `backend/app/services/audit.py` |
| **Notification** | Email/in-app notification | `backend/app/services/notify.py` |

### Frontend (Next.js 14 + TypeScript)

| Halaman | Fungsi | Role |
|---------|--------|------|
| `/login` | Login multi-role | All |
| `/upload` | Upload Excel presensi | HR |
| `/dashboard` | Dashboard utama eksekutif | All |
| `/opd/[id]` | Detail per OPD | Kepala OPD, HR, Eksekutif |
| `/employees` | Daftar pegawai | HR |
| `/reports` | Generate & download PDF | HR, Eksekutif |
| `/admin/users` | Manage user & role | Super Admin |
| `/profile` | Edit profil sendiri | All |

### Database (PostgreSQL 15)

| Schema | Tabel Utama | Tujuan |
|--------|-------------|--------|
| `presensi` | `presensi_raw`, `presensi_agregat_opd` | Data presensi |
| `master` | `opd`, `pegawai`, `users` | Master data |
| `audit` | `upload_log`, `access_log`, `action_log` | Compliance |
| `auth` | `sessions`, `roles`, `permissions` | RBAC |

Schema lengkap di [`data-model.md`](data-model.md).

---

## 🛠️ Tech Stack — Rationale

### Backend: Python 3.11 + FastAPI
**Kenapa Python:**
- Ecosystem untuk data analysis (pandas) paling matang
- Library Excel/pandas/openpyxl native Python
- Library PDF generation lengkap (ReportLab)
- AI/ML library paling kaya (sklearn, torch, dll) — kalau nanti perlu

**Kenapa FastAPI (bukan Flask/Django):**
- Async native → handle multiple upload simultan
- Type hints → safer code, auto-generate OpenAPI docs
- Pydantic validation → input validation otomatis
- Performance tinggi (媲美 Node.js)

**Alternatif yang dipertimbangkan:**
- Node.js (Express) — kalah di data processing
- Django — overkill untuk scope ini, ORM-nya kurang cocok untuk analytics
- Go — bagus untuk performance, tapi ecosystem data analysis masih lemah

### Frontend: Next.js 14 + TypeScript
**Kenapa Next.js:**
- PWA support built-in (next-pwa plugin)
- SSR + ISR → SEO + fast first load
- API routes → bisa fullstack tanpa backend terpisah (kecil)
- TypeScript → type safety end-to-end

**Kenapa TypeScript:**
- Cegah bug di runtime
- Auto-complete & refactor lebih baik
- Standar industri

**Alternatif:**
- Vue.js — ekosistem Indonesia lebih熟悉, tapi PWA tooling lebih lemah
- SvelteKit — menarik tapi ekosistem lebih kecil
- Plain React — harus setup banyak sendiri (router, SSR, PWA)

### Database: PostgreSQL 15
**Kenapa PostgreSQL:**
- ACID compliance → data integrity
- JSON support → flexible untuk audit log
- Window functions → ranking & analytics SQL langsung
- Mature, banyak hosting provider di Indonesia
- Pgcrypto extension → encryption at rest

**Alternatif:**
- MySQL — OK tapi analytics functions lebih lemah
- MongoDB — noSQL, kurang cocok untuk relational data
- SQLite — untuk dev only

### PDF Generator: ReportLab + Pillow
**Kenapa ReportLab:**
- Full control atas layout (pixel-perfect)
- Bisa embed chart dari matplotlib
- Mendukung font kustom untuk karakter Indonesia
- Output deterministic → bisa di-test

**Kenapa bukan library lain:**
- WeasyPrint (HTML→PDF) — layout kurang konsisten
- jsPDF (JS) — fitur lebih terbatas
- Puppeteer — berat, susah embed chart native

### Charts: ECharts
- Sangat customizable, cocok untuk dashboard eksekutif
- Support animation, drill-down, interactive
- Dokumentasi Bahasa Mandarin/Inggris lengkap
- Ringan (~400KB gzip)

**Alternatif:** Chart.js (lebih simpel), Highcharts (komersial)

---

## 🔐 Security Architecture

Lihat [`security.md`](security.md) untuk detail lengkap. Ringkasan:

| Layer | Proteksi |
|-------|----------|
| Network | HTTPS, HSTS, WAF |
| Auth | JWT + Refresh Token, MFA (opsional admin) |
| Authz | RBAC 5 roles, permission per endpoint |
| Data in Transit | TLS 1.3 |
| Data at Rest | PostgreSQL TDE + pgcrypto |
| File Upload | Whitelist format, size limit, AV scan, sandbox parse |
| Audit | Immutable log semua aksi |
| Compliance | UU PDP, retention policy, consent |

---

## 🚀 Deployment Topology

### Development (Lokal)
```
Laptop Developer
├── PostgreSQL (Docker)
├── FastAPI (localhost:8000)
├── Next.js (localhost:3000)
└── Redis (Docker, opsional)
```

### Staging
```
VPS Indonesia
├── Docker Compose
├── PostgreSQL
├── FastAPI (gunicorn + nginx reverse proxy)
├── Next.js (standalone build)
├── Redis
└── Let's Encrypt SSL
```

### Production (Target)
```
VPS Indonesia (atau on-premise BKPSDM)
├── Docker Compose / Kubernetes (skala besar nanti)
├── PostgreSQL dengan backup harian ter-encrypt
├── Object storage (MinIO) untuk file Excel ter-encrypt
├── FastAPI (multiple workers)
├── Next.js (standalone)
├── Nginx reverse proxy
├── WAF (Cloudflare atau ModSecurity)
├── Monitoring (Prometheus + Grafana)
└── Backup ke cloud ID-compliant
```

Detail di [`deployment.md`](deployment.md).

---

## 📦 Struktur Repository

```
senter-asn/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py
│   │   ├── api/                # Route handlers
│   │   ├── core/               # Config, security
│   │   ├── db/                 # Database, models
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   ├── alembic/                # Database migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # Next.js application
│   ├── app/                    # App router (Next 14)
│   ├── components/             # Reusable UI
│   ├── lib/                    # Utilities, API client
│   ├── public/                 # Static assets, PWA manifest
│   ├── package.json
│   └── Dockerfile
│
├── docs/                       # Dokumentasi (lihat CLAUDE.md)
│
├── samples/                    # Sample data & output
│   ├── template-presensi.xlsx
│   ├── template-perhitungan.xlsx
│   ├── output-sample.pdf
│   └── dummy-presensi-1000rows.xlsx
│
├── scripts/                    # Utility scripts
│   ├── generate-dummy.py       # Generate dummy 1000+ rows
│   ├── seed-db.py              # Seed database untuk dev
│   └── verify-output.py        # Bandingkan output dgn reference
│
├── docker-compose.yml          # Local dev stack
├── .github/workflows/          # CI/CD
├── CLAUDE.md                   # Master entry point
├── README.md
└── LICENSE
```

---

## 🔌 API Contract (Ringkas)

Lihat detail di [`docs/modules/`]. Endpoint utama:

| Method | Endpoint | Fungsi | Role |
|--------|----------|--------|------|
| POST | `/api/auth/login` | Login | All |
| POST | `/api/presensi/upload` | Upload Excel presensi | HR |
| GET | `/api/presensi/periods` | List periode upload | All |
| GET | `/api/analytics/opd-ranking?period=2026-05` | Ranking OPD | All |
| GET | `/api/analytics/opd/{id}?period=2026-05` | Detail OPD | All |
| GET | `/api/reports/pdf?period=2026-05` | Generate PDF | HR, Eksekutif |
| GET | `/api/users` | List user | Admin |
| POST | `/api/users` | Create user | Admin |

---

## 📈 Performance Considerations

- **Excel parsing:** 1000+ baris harus selesai < 5 detik → pakai bulk insert SQLAlchemy
- **Aggregation:** Window function di PostgreSQL lebih cepat dari Python
- **PDF generation:** 5 halaman < 10 detik → render paralel per halaman
- **Dashboard load:** initial < 3 detik → cache aggregat di Redis
- **Concurrent users:** target 50 concurrent, FastAPI handle async

---

## 🔄 Scaling Path (Future)

Tahapan scaling kalau user bertambah:

1. **Fase 1 (0-1000 user):** Single VPS, Docker Compose
2. **Fase 2 (1000-10000 user):** Separate DB server, add read replica
3. **Fase 3 (10000+ user):** Kubernetes, multi-region, CDN untuk static assets

---

> **Untuk detail implementasi per modul, buka [`docs/modules/`](modules/).**
> **Untuk data schema & rumus, buka [`data-model.md`](data-model.md).**
