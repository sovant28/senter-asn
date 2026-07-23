# CLAUDE.md — SENTER ASN Project

> **Master entry point untuk AI agent & tim developer.**
> Baca file ini dulu. Paham konteks, lalu buka dokumen yang relevan dengan task Anda.

---

## 🎯 Apa Proyek Ini?

**SENTER ASN** = **Sistem Early Warning Presensi** — Sistem Informasi monitoring disiplin ASN (Aparatur Sipil Negara) berbasis data presensi elektronik (SIMPEGNAS), untuk **instansi BKPSDM Kab. Tana Toraja**.

- **Input:** Excel presensi per pegawai (1000++ baris/bulan, 26 OPD)
- **Proses:** Parse → Database → Hitung skor disiplin (rule-based) → Generate laporan
- **Output:** (1) PDF laporan eksekutif 5 halaman, (2) Dashboard web interaktif (PWA)

> ⚠️ **Data presensi ASN = data pribadi sensitif** (UU PDP). Lihat `docs/security.md` sebelum handle data produksi.

---

## 📚 Peta Dokumentasi (Baca Sesuai Kebutuhan)

### Wajib dibaca semua kontributor
| File | Untuk apa |
|------|-----------|
| [`README.md`](README.md) | Overview proyek, quick start, demo link |
| [`docs/context.md`](docs/context.md) | **KENAPA** proyek ini ada — masalah bisnis, stakeholder, tujuan |
| [`docs/architecture.md`](docs/architecture.md) | **BAGAIMANA** sistem dirancang — tech stack, komponen, data flow |
| [`docs/data-model.md`](docs/data-model.md) | **APA** datanya — schema, template Excel, rumus perhitungan |
| [`docs/tasks.md`](docs/tasks.md) | **APA YANG SEDANG DIKERJAKAN** — sprint, backlog, done |
| [`docs/security.md`](docs/security.md) | Aturan keamanan & UU PDP — **wajib baca sebelum handle data** |

### Baca sesuai task yang sedang dikerjakan
| Task | Buka file |
|------|-----------|
| Bikin parser Excel | [`docs/modules/01-excel-parser.md`](docs/modules/01-excel-parser.md) |
| Mendesain database | [`docs/modules/02-database.md`](docs/modules/02-database.md) |
| Menulis rumus skor disiplin | [`docs/modules/03-analytics-engine.md`](docs/modules/03-analytics-engine.md) |
| Generate PDF SENTER ASN | [`docs/modules/04-pdf-generator.md`](docs/modules/04-pdf-generator.md) |
| Bikin dashboard PWA | [`docs/modules/05-dashboard.md`](docs/modules/05-dashboard.md) |
| Auth, role, permission | [`docs/modules/06-auth-rbac.md`](docs/modules/06-auth-rbac.md) |

### Referensi (buka saat butuh)
| File | Untuk apa |
|------|-----------|
| [`docs/standards/code-style.md`](docs/standards/code-style.md) | Konvensi coding (Python, TypeScript, SQL) |
| [`docs/standards/git-workflow.md`](docs/standards/git-workflow.md) | Branching, commit message, PR review |
| [`docs/deployment.md`](docs/deployment.md) | Cara deploy dev/staging/production |
| [`docs/glossary.md`](docs/glossary.md) | Istilah-istilah domain (ASN, OPD, TM1, dll) |
| [`docs/decisions/`](docs/decisions/) | Architecture Decision Records (ADR) — kenapa pilih tech X bukan Y |

---

## 🤖 Instruksi untuk AI Agent

Jika Anda adalah AI agent yang membantu proyek ini:

1. **Selalu mulai dengan baca `context.md` + `architecture.md` + `data-model.md`** untuk paham big picture.
2. **Untuk task spesifik, buka `docs/modules/<nomor>-<nama>.md`** yang relevan.
3. **Selalu update `docs/tasks.md`** saat mulai/selesai task — agar AI berikutnya tidak duplicate.
4. **Jangan pernah menulis data presensi ASN asli ke chat/konteks AI** — gunakan dummy data. Lihat [`docs/security.md`](docs/security.md) §"Data Handling".
5. **Jika menemukan keputusan arsitektur baru**, tulis ADR di [`docs/decisions/`](docs/decisions/) dengan format `ADR-NNN-judul.md`.
6. **Saat output kode**: ikuti [`docs/standards/code-style.md`](docs/standards/code-style.md).

### Format Update tasks.md
```markdown
## Sedang Dikerjakan (In Progress)
- [ ] [TASK-007] Bikin parser Excel — owner: @user — status: in_progress

## Backlog
- [ ] [TASK-008] Generate PDF cover page

## Selesai
- [x] [TASK-001] Setup dokumentasi
```

---

## 🏗️ Tech Stack Snapshot

| Layer | Technology | Alasan |
|-------|------------|--------|
| Backend | Python 3.11 + FastAPI | Async, native untuk AI/ML, rapid dev |
| Frontend | Next.js 14 + TypeScript | PWA-ready, ecosystem kuat |
| Database | PostgreSQL 15 | ACID, support analytics, mature |
| ORM | SQLAlchemy 2 + Alembic | Type-safe migration |
| Excel Parser | openpyxl + pandas | Standar industri |
| PDF Generator | ReportLab + Pillow | Full control atas layout |
| Charts | ECharts / Chart.js | Interactive, customizable |
| LLM (opsional) | Ollama (lokal) atau GPT-4o-mini | Untuk narasi insight bahasa alami |
| Auth | NextAuth + JWT | Multi-role RBAC |
| Deploy | Docker + Docker Compose | Portable, reproducible |
| CI/CD | GitHub Actions | Otomasi test & deploy |

Detail lengkap di [`docs/architecture.md`](docs/architecture.md).

---

## 📌 Status Proyek Saat Ini

> Update: 2026-07-14

- **Fase:** MVP Build — TASK-103 (Database Schema) ✅ SELESAI
- **Database:** Schema sudah terbuat di Supabase PostgreSQL 15
  - 3 schema: `master`, `presensi`, `audit`
  - 7 tabel: `opd`, `pegawai`, `users`, `presensi_raw`, `presensi_agregat_opd`, `upload_log`, `access_log`
  - 22 indexes, 19 constraints, migration reversible
- **Scope terkunci:** 26 OPD, scoring 25/20/15/40, 5 halaman PDF
- **Next milestone:** TASK-101 (dummy data) + TASK-102 (Excel parser)

Lihat [`docs/tasks.md`](docs/tasks.md) untuk task breakdown lengkap.

---

## 📞 Kontak & Kontribusi

- **Project Lead:** [Isi nama]
- **Stakeholder:** BKPSDM Kab. Tana Toraja
- **Repository:** [Isi URL]
- **Issue tracker:** [Isi URL]

---

> **Jangan tulis/commit data presensi ASN asli ke repo tanpa enkripsi.**
> Selalu anonymize untuk development. Lihat [`docs/security.md`](docs/security.md).
