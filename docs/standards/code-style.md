# Code Style Guide

> Konvensi coding untuk Python (backend) dan TypeScript (frontend). Diikuti oleh semua kontributor.

---

## 🐍 Python (Backend)

### Style
- **Formatter:** `black` (line length 100)
- **Import sort:** `isort` (profile black)
- **Linter:** `ruff` (fast, all-in-one)
- **Type checker:** `mypy` (strict mode)
- **Docstring:** Google style

### Type Hints (WAJIB)

```python
# ✅ Good
def get_user_by_id(user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

# ❌ Bad
def get_user_by_id(user_id):
    return db.query(User).filter(User.id == user_id).first()
```

### Naming
```python
# Variable: snake_case
user_name = "John"
total_score = 95.5

# Constant: UPPER_SNAKE
MAX_RETRY = 3
DEFAULT_TIMEOUT = 30

# Class: PascalCase
class UserRepository:
    pass

# Function: snake_case
def calculate_score(attendance_data: dict) -> float:
    pass

# Private: prefix _
def _internal_helper():
    pass

# Boolean: is_/has_/can_
is_active = True
has_permission = False
can_edit = True
```

### Imports
```python
# Standard library
import os
from datetime import datetime

# Third party
from fastapi import FastAPI, Depends
from sqlalchemy import select

# Local
from app.models.user import User
from app.services.auth import verify_token
```

### Async vs Sync
- **Async** untuk I/O operations (DB, API calls, file)
- **Sync** untuk CPU-bound (calculation, parsing)

```python
# ✅ Good
async def get_user(user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

def calculate_score(attendance: list[dict]) -> float:
    return sum(a['value'] for a in attendance) / len(attendance)
```

### Error Handling
```python
# ✅ Good: specific exception
try:
    user = await get_user(user_id)
except UserNotFoundError:
    raise HTTPException(status_code=404, detail="User not found")

# ❌ Bad: bare except
try:
    user = await get_user(user_id)
except:
    pass

# ❌ Bad: too broad
try:
    user = await get_user(user_id)
except Exception:
    raise HTTPException(status_code=500)
```

### Logging
```python
import logging

logger = logging.getLogger(__name__)

# ✅ Good: structured, informative
logger.info("User logged in", extra={"user_id": user.id, "ip": ip})
logger.error("Failed to upload file", extra={"filename": file.name, "error": str(e)})

# ❌ Bad: print
print("User logged in")
print(f"Error: {e}")
```

> ⚠️ **JANGAN log data sensitif** (NIP, nama + presensi). Lihat [`docs/security.md`](../security.md).

### Pydantic Schema Pattern
```python
from pydantic import BaseModel, Field, EmailStr

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=12)
    nama_lengkap: str = Field(..., min_length=1, max_length=200)
    role: Literal["SUPER_ADMIN", "HR_MANAGER", "KEPALA_OPD", "EKSEKUTIF", "PEGAWAI"]
    opd_id: int | None = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    nama_lengkap: str
    role: str
    opd_id: int | None

    class Config:
        from_attributes = True
```

### Repository Pattern
```python
class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: int) -> User | None:
        ...

    async def list(self, skip: int = 0, limit: int = 100) -> list[User]:
        ...

    async def create(self, user: UserCreate) -> User:
        ...

    async def update(self, user_id: int, data: dict) -> User:
        ...
```

### Test Naming
```python
# test_<module>.py
# test_<function>_<scenario>_<expected_result>

def test_get_user_with_valid_id_returns_user(): ...
def test_get_user_with_invalid_id_raises_not_found(): ...
def test_create_user_with_weak_password_raises_validation_error(): ...
```

---

## ⚛️ TypeScript / React (Frontend)

### Style
- **Formatter:** `prettier` (default config)
- **Linter:** `eslint` (next/core-web-vitals + custom)
- **Type checker:** TypeScript strict mode

### Type Hints (WAJIB)
```typescript
// ✅ Good
interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  opdId: number | null;
}

function getUser(id: number): Promise<User | null> {
  return api.get(`/users/${id}`);
}

// ❌ Bad
function getUser(id) {
  return api.get(`/users/${id}`);
}
```

### Naming
```typescript
// Variable: camelCase
const userName = "John";
const totalScore = 95.5;

// Constant: UPPER_SNAKE
const MAX_RETRY = 3;
const API_BASE_URL = "https://api.example.com";

// Component: PascalCase
function DashboardPage() { ... }
function KpiCard() { ... }

// Type/Interface: PascalCase
type UserRole = "SUPER_ADMIN" | ...;
interface UserProps { ... }

// Hook: use prefix
function useAuth() { ... }
function useDashboardData() { ... }

// Boolean: is/has/can prefix
const isLoading = true;
const hasPermission = false;
const canEdit = true;
```

### Component Pattern
```typescript
// ✅ Good: explicit props type, named export
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: "users" | "trending" | "award" | "alert";
  color?: "primary" | "success" | "warning" | "danger";
}

export function KpiCard({ title, value, icon, color = "primary" }: KpiCardProps) {
  return (
    <Card>
      <CardContent>{title}: {value}</CardContent>
    </Card>
  );
}

// ❌ Bad
export default function({ title, value, icon, color = "primary" }) {
  return <Card><CardContent>{title}: {value}</CardContent></Card>;
}
```

### File Organization
```
frontend/
├── app/                      # App Router pages
│   ├── dashboard/
│   │   └── page.tsx
│   └── upload/
│       └── page.tsx
├── components/
│   ├── ui/                   # Reusable UI (ShadCN)
│   ├── dashboard/            # Dashboard-specific
│   └── forms/                # Form components
├── lib/
│   ├── api.ts                # API client
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Helpers
├── hooks/                    # Custom React hooks
├── types/                    # Shared TypeScript types
└── public/
```

### Import Order
```typescript
// 1. External libraries
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal modules
import { api } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import type { User } from "@/types/user";
```

### Error Handling
```typescript
// ✅ Good
try {
  const data = await api.post("/upload", formData);
  toast.success("Upload berhasil");
} catch (err) {
  if (err instanceof ApiError) {
    toast.error(err.message);
  } else {
    toast.error("Terjadi kesalahan tidak terduga");
    console.error(err);
  }
}

// ❌ Bad
try {
  const data = await api.post("/upload", formData);
} catch (e) {
  alert("Error");
}
```

### Async Components
```typescript
// ✅ Server Component (default di App Router)
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <Dashboard data={data} />;
}

// ✅ Client Component (perlu interaksi)
"use client";
export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  // ...
}
```

---

## 📊 SQL

### Naming
```sql
-- Tables: snake_case, plural
CREATE TABLE presensi.presensi_raw (...);
CREATE TABLE master.users (...);

-- Columns: snake_case
user_id, nama_lengkap, total_skor

-- Primary key: id
-- Foreign key: <table>_id (e.g., opd_id, user_id)
-- Timestamp: created_at, updated_at
```

### Style
```sql
-- Uppercase keywords
SELECT id, nama_lengkap, role
FROM master.users
WHERE is_active = TRUE
  AND role = 'HR_MANAGER'
ORDER BY nama_lengkap
LIMIT 100;
```

### Indexes
```sql
-- Index untuk kolom yang sering di-filter
CREATE INDEX idx_presensi_periode ON presensi.presensi_raw(tahun, bulan);
CREATE INDEX idx_presensi_opd ON presensi.presensi_raw(opd_id);

-- Partial index untuk common filter
CREATE INDEX idx_active_users ON master.users(nama_lengkap) WHERE is_active = TRUE;
```

---

## 📝 Comments & Documentation

### Backend (Python)
```python
def calculate_total_skor(attendance: list[Presensi]) -> float:
    """
    Hitung total skor disiplin untuk 1 OPD.

    Formula: 25% kehadiran + 20% kepatuhan jam kerja
             + 15% ketidakhadiran + 40% hadir efektif

    Args:
        attendance: List of presensi data per pegawai

    Returns:
        Total skor 0-100

    Raises:
        ValueError: Jika attendance kosong atau total_kewajiban = 0
    """
    if not attendance:
        raise ValueError("Attendance list cannot be empty")
    # ... implementation
```

### Frontend (TypeScript)
```typescript
/**
 * Hook untuk fetch dashboard data dengan auto-refresh
 * @param periode - Format "YYYY-MM"
 * @returns Query result dengan data dashboard
 */
export function useDashboardData(periode: string) {
  return useQuery({
    queryKey: ["dashboard", periode],
    queryFn: () => api.get(`/analytics/dashboard?periode=${periode}`),
    refetchInterval: 5 * 60 * 1000, // 5 menit
  });
}
```

### Inline Comments
```python
# ✅ Good: explains WHY
# Use window function instead of app-level ranking for better performance
# (1 query vs N queries)
ranking = await db.execute(text("""
    SELECT ..., RANK() OVER (...)
"""))

# ❌ Bad: explains WHAT (obvious from code)
# Loop through each row
for row in rows:
    process(row)
```

---

## 🔧 Pre-commit Hooks

Setup dengan `pre-commit`:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [ts, tsx, js, jsx, json, yaml]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.0
    hooks:
      - id: mypy
        files: ^backend/

  - repo: local
    hooks:
      - id: no-secrets
        name: Check for secrets
        entry: bash -c 'git diff --cached | grep -iE "(password|secret|api_key).*=.*[a-zA-Z0-9]{20,}" && exit 1 || exit 0'
        language: system
        stages: [pre-commit]
```

Install: `pre-commit install`

---

## 📊 Code Coverage Target

- **Backend:** > 80% line coverage
- **Frontend:** > 70% line coverage
- **Critical paths (auth, calculation):** 100% coverage

CI/CD akan fail jika coverage turun.

---

## 🎨 UI & Styling Standards (Frontend)

- **Casing Teks (Anti-UPPERCASE):** Dilarang keras menggunakan huruf kapital penuh (`uppercase` atau `text-transform: uppercase`) untuk semua teks antarmuka (UI) seperti judul menu, tombol, header tabel, label form, dan lencana (badges). Semua teks wajib diformat menggunakan *Title Case* atau *Sentence Case* agar terlihat lebih ramah dan profesional.
- **Flat Design (Anti-Drop Shadow):** Seluruh elemen antarmuka (seperti kartu KPI, grafik ECharts, sidebar, topbar, tabel, dan tombol) dilarang menggunakan efek bayangan (`shadow-*` / `box-shadow`) atau efek hover translasi vertikal (`hover:-translate-y-1`). Desain harus menggunakan border tipis abu-abu (`border-slate-200`) dengan warna latar belakang putih (`bg-white`) yang polos dan datar.
- **Tipografi:** Gunakan *Plus Jakarta Sans* untuk headings/angka statistik, dan *Inter* untuk tulisan konten biasa secara konsisten.

---

> **Untuk git workflow, lihat [`git-workflow.md`](git-workflow.md).**
