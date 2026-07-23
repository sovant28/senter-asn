# SENTER ASN — Sistem Early Warning Presensi

> Sistem informasi monitoring & early warning disiplin ASN berbasis data presensi elektronik.
> Dibuat untuk **BKPSDM Kab. Tana Toraja**.

[![Status](https://img.shields.io/badge/status-discovery-yellow)]()
[![License](https://img.shields.io/badge/license-internal-red)]()

---

## 🎯 Apa Ini?

**SENTER ASN** membantu manajemen BKPSDM dan kepala OPD melihat:
- 📊 **Tingkat kehadiran & pelanggaran jam kerja** per OPD
- 🏆 **Ranking disiplin** antar 26 OPD
- 🚨 **Early warning** untuk OPD yang perlu pembinaan
- 📄 **Laporan PDF eksekutif** siap saji untuk pimpinan
- 📱 **Dashboard interaktif** yang bisa diakses dari mana saja (PWA)

**Input:** Excel presensi bulanan (dari SIMPEGNAS, ~1000++ baris)
**Output:** PDF 5 halaman + Dashboard web real-time

---

## 🖼️ Preview Laporan PDF

Halaman 1 — Cover  
Halaman 2 — Ketidakhadiran & Pelanggaran Jam Kerja  
Halaman 3 — Kehadiran & Kehadiran Efektif  
Halaman 4 — Total Skor Kedisiplinan (4 sub-skor + kategori warna)  
Halaman 5 — Executive Summary (pie chart, top 5, OPD perlu pembinaan)

Lihat contoh lengkap di folder `samples/output-sample.pdf`.

---

## 🚀 Quick Start (untuk developer)

```bash
# Clone & setup
git clone <repo-url> senter-asn
cd senter-asn

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (terminal lain)
cd frontend
npm install
npm run dev

# Buka
open http://localhost:3000
```

Detail lengkap: [`docs/deployment.md`](docs/deployment.md)

---

## 📚 Dokumentasi

**Mulai dari sini:** [`CLAUDE.md`](CLAUDE.md) — master entry point dengan peta semua dokumen.

Dokumen utama:
- 📋 [`docs/context.md`](docs/context.md) — Konteks bisnis, stakeholder, tujuan
- 🏗️ [`docs/architecture.md`](docs/architecture.md) — Arsitektur sistem & tech stack
- 💾 [`docs/data-model.md`](docs/data-model.md) — Schema DB, template Excel, rumus
- ✅ [`docs/tasks.md`](docs/tasks.md) — Task tracking & sprint
- 🔒 [`docs/security.md`](docs/security.md) — Keamanan & UU PDP
- 📦 [`docs/modules/`](docs/modules/) — Per-modul deep dive (6 modul)

---

## 🏗️ Tech Stack

**Backend:** Python 3.11, FastAPI, PostgreSQL 15, SQLAlchemy 2, Pandas, ReportLab
**Frontend:** Next.js 14, TypeScript, ECharts, Tailwind CSS, PWA
**Infra:** Docker, Docker Compose, Nginx, GitHub Actions

Detail di [`docs/architecture.md`](docs/architecture.md).

---

## 🧪 Development dengan Dummy Data

Sistem ini **TIDAK BOLEH** diuji dengan data presensi ASN asli di environment development. Gunakan:
- `samples/dummy-presensi-100rows.xlsx` (sample kecil untuk test parser)
- `scripts/generate-dummy.py` (generate 1000++ baris dummy)

Lihat [`docs/security.md`](docs/security.md) §"Data Handling".

---

## 📜 Lisensi

**Proprietary / Internal use only.** © BKPSDM Kab. Tana Toraja.

---

## 🤝 Kontribusi

Lihat [`docs/standards/git-workflow.md`](docs/standards/git-workflow.md) untuk kontribusi.
