# ADR-001: Tech Stack Selection

> **Status:** Accepted
> **Date:** 2026-07-13
> **Deciders:** Project Lead, Tech Lead

---

## Context

Proyek SENTER ASN membutuhkan pilihan teknologi untuk:
1. Backend API (handle upload Excel, hitung agregat, generate PDF)
2. Frontend (dashboard interaktif untuk 5 role user)
3. Database (simpan data presensi 5+ tahun)
4. Deployment (sesuai UU PDP — data di Indonesia)

Kriteria:
- Cocok untuk data processing (Excel 1000+ baris)
- Tim Indonesia familiar
- Community support & dokumentasi bagus
- PWA support
- Production-ready, bukan eksperimen

## Decision

**Stack yang dipilih:**

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11 + FastAPI |
| Frontend | Next.js 14 + TypeScript |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy 2 + Alembic |
| Excel Parser | openpyxl + pandas |
| PDF Generator | ReportLab + Pillow + Matplotlib |
| Charts | ECharts (via echarts-for-react) |
| Auth | NextAuth.js (frontend) + python-jose (backend) |
| Deployment | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud/Hosting | VPS Indonesia (IDCloudHost / Biznet Gio) |

## Alternatives Considered

### Backend: Node.js (Express/Nest.js)
**Pros:** Same language dengan frontend, async native
**Cons:** Library untuk data analysis & Excel processing lebih lemah di Node
**Verdict:** Ditolak — Python lebih superior untuk data processing

### Backend: Django
**Pros:** Batteries included (admin, ORM, auth built-in)
**Cons:** Monolithic, ORM kurang cocok untuk analytics, lebih berat
**Verdict:** Ditolak — FastAPI lebih ringan & fleksibel untuk kasus ini

### Frontend: Vue.js
**Pros:** Familiar untuk developer Indonesia, dokumentasi bagus
**Cons:** PWA tooling lebih lemah, ekosistem lebih kecil
**Verdict:** Ditolak — Next.js lebih mature untuk PWA

### Frontend: SvelteKit
**Pros:** Performance lebih baik, less boilerplate
**Cons:** Ekosistem lebih kecil, hiring lebih susah
**Verdict:** Ditolak — TypeScript + React lebih mainstream

### Database: MySQL
**Pros:** Familiar, banyak hosting support
**Cons:** Window functions & analytics lebih lemah dari PostgreSQL
**Verdict:** Ditolak — PostgreSQL lebih cocok untuk ranking/analytics

### PDF: WeasyPrint (HTML to PDF)
**Pros:** Pakai HTML/CSS, lebih mudah design
**Cons:** Layout kurang konsisten, susah embed chart native
**Verdict:** Ditolak — ReportLab lebih reliable untuk layout pixel-perfect

### Deployment: Kubernetes
**Pros:** Scalable, industry standard
**Cons:** Overkill untuk skala 1000-10000 user, complexity tinggi
**Verdict:** Ditolak untuk fase awal — pakai Docker Compose, migrate ke K8s kalau sudah 10k+ user

## Consequences

### Positive
- ✅ Python + pandas = standar industri untuk data analysis
- ✅ TypeScript end-to-end = fewer bugs, better DX
- ✅ PostgreSQL mature & feature-rich
- ✅ Next.js PWA support built-in
- ✅ Hosting di Indonesia = UU PDP compliance lebih mudah
- ✅ Library lengkap untuk Excel (openpyxl) & PDF (ReportLab)

### Negative
- ❌ Dua bahasa (Python + TypeScript) — perlu polyglot team
- ❌ FastAPI async bisa tricky untuk yang familiar dengan Flask sync
- ❌ Docker Compose single-host — perlu refactor kalau scale ke multi-server
- ❌ ReportLab learning curve — perlu waktu untuk chart layout

### Neutral
- Team perlu belajar Next.js App Router kalau sebelumnya pakai Pages Router
- Perlu setup CI/CD dengan GitHub Actions

## Notes

- **Future migration path:** kalau user > 10k, pertimbangkan migrasi ke Kubernetes + managed PostgreSQL
- **Cost estimation:** VPS 4 vCPU 8GB ≈ $30-50/bulan, cukup untuk development & staging
- **Team skill requirement:** Python (intermediate), TypeScript (intermediate), SQL (intermediate), Linux (basic)
