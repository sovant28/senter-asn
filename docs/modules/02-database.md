# Module 02 — Database

> Tanggung jawab: Schema PostgreSQL, migrations (Alembic), ORM models (SQLAlchemy 2), dan data access layer.

---

## 🎯 Tujuan

Menyediakan persistence layer untuk:
1. Master data (OPD, pegawai, users, roles)
2. Presensi raw (data per pegawai per bulan)
3. Presensi agregat (per OPD per bulan, sudah dihitung)
4. Audit log (compliance)
5. Upload metadata

---

## 🗄️ Schema Overview

3 schema PostgreSQL:
- `master` — data referensi (OPD, pegawai, users)
- `presensi` — data presensi (raw, agregat, upload log)
- `audit` — audit log (immutable)

Detail lengkap di [`docs/data-model.md`](../data-model.md) §"Database Schema".

---

## 🏗️ Implementasi

### Lokasi File
- `backend/alembic/` — migrations
- `backend/app/db/base.py` — Base SQLAlchemy
- `backend/app/db/session.py` — session factory
- `backend/app/models/master.py` — models schema master
- `backend/app/models/presensi.py` — models schema presensi
- `backend/app/models/audit.py` — models schema audit

### Library
- SQLAlchemy 2.0 (async support)
- Alembic (migrations)
- asyncpg (async driver)
- psycopg2-binary (untuk migration CLI)

### Configuration

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False  # set True untuk debug

    class Config:
        env_file = ".env"
```

```python
# backend/app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    echo=settings.DB_ECHO,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

---

## 📦 SQLAlchemy Models (Contoh)

```python
# backend/app/models/master.py
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime

class OPD(Base):
    __tablename__ = "opd"
    __table_args__ = {"schema": "master"}

    id: Mapped[int] = mapped_column(primary_key=True)
    kode_opd: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nama_opd: Mapped[str] = mapped_column(String(200), nullable=False)
    tipe_opd: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    catatan_khusus: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pegawais: Mapped[list["Pegawai"]] = relationship(back_populates="opd")
    users: Mapped[list["User"]] = relationship(back_populates="opd")
```

---

## 🔄 Migrations (Alembic)

### Setup
```bash
# Init alembic (sudah ada di repo)
cd backend
alembic init alembic

# Generate migration baru
alembic revision --autogenerate -m "add presensi_agregat_opd table"

# Apply migrations
alembic upgrade head

# Rollback 1 step
alembic downgrade -1

# Check status
alembic current
alembic history
```

### Migration Best Practices
- ✅ Selalu test migration di dev sebelum prod
- ✅ Backup database sebelum apply migration di prod
- ✅ Untuk perubahan破坏性, gunakan expand-migrate-contract pattern
- ❌ Jangan pernah edit migration yang sudah applied (buat migration baru)
- ❌ Jangan drop column tanpa backup

---

## 🔍 Data Access Pattern

### Repository Pattern

```python
# backend/app/repositories/presensi_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.presensi import PresensiRaw, PresensiAgregatOPD
from app.models.master import OPD
from datetime import date

class PresensiRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_agregat_by_periode(
        self, tahun: int, bulan: int
    ) -> list[PresensiAgregatOPD]:
        result = await self.session.execute(
            select(PresensiAgregatOPD)
            .where(
                PresensiAgregatOPD.tahun == tahun,
                PresensiAgregatOPD.bulan == bulan
            )
            .order_by(PresensiAgregatOPD.total_skor.desc())
        )
        return result.scalars().all()

    async def get_opd_ranking(
        self, tahun: int, bulan: int
    ) -> list[dict]:
        """Return ranking OPD by total skor"""
        result = await self.session.execute(
            select(
                OPD.nama_opd,
                PresensiAgregatOPD.total_skor,
                PresensiAgregatOPD.kategori,
                func.rank().over(
                    order_by=PresensiAgregatOPD.total_skor.desc()
                ).label("ranking")
            )
            .join(OPD, PresensiAgregatOPD.opd_id == OPD.id)
            .where(
                PresensiAgregatOPD.tahun == tahun,
                PresensiAgregatOPD.bulan == bulan
            )
        )
        return [dict(row._mapping) for row in result]

    async def bulk_insert_raw(self, rows: list[PresensiRaw]) -> None:
        """Bulk insert untuk performance"""
        self.session.add_all(rows)
        await self.session.commit()
```

---

## 🔐 Security Considerations

- ✅ **DB user non-superuser** — aplikasi pakai user dengan permission terbatas
- ✅ **Connection over TLS** — `?sslmode=require` di connection string
- ✅ **Password di env var** — tidak pernah di kode
- ✅ **Parameterized queries** — SQLAlchemy ORM sudah handle, tidak ada SQL injection
- ✅ **Encryption at rest** — aktifkan PostgreSQL TDE atau filesystem-level encryption
- ✅ **Audit log immutable** — no UPDATE/DELETE permission untuk role `audit_writer`
- ✅ **Backup ter-encrypt** — pg_dump + gpg sebelum disimpan

```sql
-- Buat user khusus untuk aplikasi (production)
CREATE USER senter_app WITH PASSWORD '<strong-password>';
GRANT CONNECT ON DATABASE senter_asn TO senter_app;
GRANT USAGE ON SCHEMA master, presensi, audit TO senter_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA master, presensi TO senter_app;
GRANT INSERT ONLY ON ALL TABLES IN SCHEMA audit TO senter_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA master, presensi TO senter_app;
```

---

## 📊 Indexes (Performance)

Indexes yang dibuat:
```sql
-- presensi.presensi_raw
CREATE INDEX idx_raw_pegawai ON presensi.presensi_raw(pegawai_id);
CREATE INDEX idx_raw_periode ON presensi.presensi_raw(tahun, bulan);
CREATE INDEX idx_raw_upload ON presensi.presensi_raw(upload_id);

-- presensi.presensi_agregat_opd
CREATE INDEX idx_agregat_periode ON presensi.presensi_agregat_opd(tahun, bulan);
CREATE INDEX idx_agregat_opd ON presensi.presensi_agregat_opd(opd_id);
CREATE INDEX idx_agregat_kategori ON presensi.presensi_agregat_opd(kategori);

-- master.pegawai
CREATE INDEX idx_pegawai_nip ON master.pegawai(nip);
CREATE INDEX idx_pegawai_opd ON master.pegawai(opd_id);

-- audit.access_log
CREATE INDEX idx_audit_user ON audit.access_log(user_id);
CREATE INDEX idx_audit_created ON audit.access_log(created_at);
```

Query optimization:
- Pakai **window function** untuk ranking (lebih cepat dari app-level)
- Pakai **partial index** untuk common filter (mis. `WHERE is_active = true`)
- Hindari `SELECT *` di production query

---

## 🧪 Testing

### Unit Tests
- [x] Model creation (insert, update, delete)
- [x] Relationship loading
- [x] Constraint validation

### Integration Tests
- [x] Migration up & down
- [x] Bulk insert 1000+ rows performance
- [x] Concurrent access (multi-user)
- [x] Connection pool exhaustion handling

### Test Database
- Pakai **test database terpisah** (bukan dev database)
- Pakai **transaction rollback** per test untuk isolation
- Contoh: `senter_asn_test` database

---

## 🔗 Integrasi dengan Modul Lain

- **Modul 01 (Excel Parser):** parsed rows → bulk insert ke `presensi_raw`
- **Modul 03 (Analytics):** read `presensi_raw` → compute → write ke `presensi_agregat_opd`
- **Modul 04 (PDF Generator):** read `presensi_agregat_opd` + master → render PDF
- **Modul 05 (Dashboard):** API query ke `presensi_agregat_opd` (cached di Redis)
- **Modul 06 (Auth):** read/write `master.users` + `audit.access_log`

---

## 📚 Referensi

- [`docs/data-model.md`](../data-model.md) §"Database Schema"
- [`docs/security.md`](../security.md) §"Data at Rest"
- [SQLAlchemy 2.0 docs](https://docs.sqlalchemy.org/en/20/)
- [Alembic docs](https://alembic.sqlalchemy.org/)
- [PostgreSQL 15 docs](https://www.postgresql.org/docs/15/)

---

> **Module selanjutnya: [`03-analytics-engine.md`](03-analytics-engine.md)** — business logic hitung skor.
