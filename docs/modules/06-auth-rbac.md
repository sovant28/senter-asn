# Module 06 — Auth & RBAC

> Tanggung jawab: Authentication (login), authorization (role-based access control), session management, dan audit.

---

## 🎯 Tujuan

Mengamankan akses ke sistem dengan:
1. **5 role** dengan permission berbeda
2. **JWT-based** stateless auth
3. **Session tracking** untuk audit
4. **MFA** untuk admin
5. **Compliance** dengan UU PDP & best practice

---

## 👥 Role & Permission Matrix

### Definisi Role

| Role | Kode | Deskripsi |
|------|------|-----------|
| **Super Admin** | `SUPER_ADMIN` | IT/admin sistem, full access |
| **HR Manager** | `HR_MANAGER` | Staff BKPSDM yang handle presensi |
| **Kepala OPD** | `KEPALA_OPD` | Kepala Dinas/Badan/Sekretariat |
| **Eksekutif** | `EKSEKUTIF` | Sekda, Bupati, Wakil Bupati |
| **Pegawai** | `PEGAWAI` | ASN biasa (self-service) |

### Permission Matrix

| Resource | Action | SUPER_ADMIN | HR_MANAGER | KEPALA_OPD | EKSEKUTIF | PEGAWAI |
|----------|--------|:-----------:|:----------:|:----------:|:---------:|:-------:|
| **Presensi** | Upload | ✅ | ✅ | ❌ | ❌ | ❌ |
| | View all | ✅ | ✅ | ❌ | ✅ | ❌ |
| | View own OPD | ✅ | ✅ | ✅ | ✅ | ❌ |
| | View own | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Edit/Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **OPD** | View | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create/Edit | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Pegawai** | View all | ✅ | ✅ | ❌ | ✅ | ❌ |
| | View own OPD | ✅ | ✅ | ✅ | ✅ | ❌ |
| | View own | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create/Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Users** | View | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Create/Edit | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | Generate PDF | ✅ | ✅ | ✅ | ✅ | ❌ |
| | Download | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Audit Log** | View | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🏗️ Implementasi

### Lokasi File

**Backend:**
- `backend/app/services/auth.py` — login, token, password
- `backend/app/services/rbac.py` — permission check
- `backend/app/api/auth.py` — auth endpoints
- `backend/app/middleware/auth.py` — FastAPI dependency

**Frontend:**
- `frontend/lib/auth.ts` — NextAuth config
- `frontend/middleware.ts` — route protection
- `frontend/hooks/useAuth.ts` — auth hook
- `frontend/components/auth/RoleGuard.tsx` — component-level guard

### Library
- **Backend:** `python-jose` (JWT), `passlib[bcrypt]` (password), `pyotp` (MFA)
- **Frontend:** `next-auth` v5, `@auth/core`

---

## 🔐 Authentication Flow

### Login

```
┌────────┐                 ┌────────┐                 ┌────────┐
│ Client │                 │Backend │                 │   DB   │
└───┬────┘                 └───┬────┘                 └───┬────┘
    │ 1. POST /auth/login      │                          │
    │ {username, password}     │                          │
    │─────────────────────────>│                          │
    │                          │ 2. Get user by username  │
    │                          │─────────────────────────>│
    │                          │<─────────────────────────│
    │                          │ 3. Verify password       │
    │                          │    (bcrypt)              │
    │                          │ 4. Check MFA (if admin)  │
    │                          │ 5. Generate JWT pair     │
    │                          │    - access (15m)        │
    │                          │    - refresh (7d)        │
    │                          │ 6. Store refresh hash    │
    │                          │─────────────────────────>│
    │<─────────────────────────│                          │
    │ 7. {access, refresh}     │                          │
    │ 8. Set httpOnly cookie   │                          │
    │    (refresh token)       │                          │
    │ 9. Store access in       │                          │
    │    memory (not localS)   │                          │
```

### Token Refresh

```
Client                          Backend
  │                                │
  │ POST /auth/refresh             │
  │ {refresh_token}                │
  │───────────────────────────────>│
  │                                │ - Verify refresh token
  │                                │ - Check not revoked
  │                                │ - Generate new pair
  │                                │ - Rotate (old refresh invalid)
  │<───────────────────────────────│
  │ {new_access, new_refresh}      │
```

### Logout

```
Client                          Backend
  │                                │
  │ POST /auth/logout              │
  │ {refresh_token}                │
  │───────────────────────────────>│
  │                                │ - Revoke refresh token
  │<───────────────────────────────│
  │ 200 OK                         │
  │                                │
  │ Client: clear access token     │
  │         from memory            │
  │         + cookie clear         │
```

---

## 🔑 Password Handling

```python
# backend/app/services/auth.py
from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets policy"""
    if len(password) < 12:
        return False, "Password minimal 12 karakter"
    if not re.search(r"[A-Z]", password):
        return False, "Password harus ada huruf besar"
    if not re.search(r"[a-z]", password):
        return False, "Password harus ada huruf kecil"
    if not re.search(r"[0-9]", password):
        return False, "Password harus ada angka"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password harus ada karakter khusus"
    return True, "OK"
```

---

## 🎫 JWT Token

```python
# backend/app/services/auth.py
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from app.core.config import settings

def create_access_token(user_id: int, role: str, opd_id: int | None) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "opd_id": opd_id,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        return payload
    except JWTError:
        raise ValueError("Invalid or expired token")
```

JWT Claims:
- `sub` — user ID
- `role` — untuk quick role check
- `opd_id` — untuk filter data OPD (nullable)
- `type` — `access` atau `refresh`
- `iat` — issued at
- `exp` — expiry

---

## 🛡️ RBAC — Permission Check

### Backend: FastAPI Dependency

```python
# backend/app/middleware/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth import verify_access_token
from app.models.master import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    payload = verify_access_token(token)
    user = await get_user_by_id(int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user

def require_role(*allowed_roles: str):
    """Decorator untuk endpoint yang butuh role tertentu"""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role {user.role} not allowed. Required: {allowed_roles}"
            )
        return user
    return role_checker

# Usage:
@router.post("/presensi/upload")
async def upload(
    user: User = Depends(require_role("SUPER_ADMIN", "HR_MANAGER"))
):
    # ... upload logic
```

### OPD-scoped Filter

```python
def filter_by_opd_scope(query, user: User):
    """Apply OPD filter berdasarkan role user"""
    if user.role in ("SUPER_ADMIN", "HR_MANAGER", "EKSEKUTIF"):
        return query  # all OPD
    elif user.role == "KEPALA_OPD":
        return query.filter(PresensiAgregatOPD.opd_id == user.opd_id)
    elif user.role == "PEGAWAI":
        # Pegawai hanya bisa lihat presensi sendiri
        return query.filter(PresensiRaw.pegawai_id == user.pegawai_id)
    else:
        raise HTTPException(403, "Role tidak dikenal")
```

### Frontend: NextAuth + Middleware

```typescript
// frontend/lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok && data) {
          return {
            id: data.user.id,
            name: data.user.nama_lengkap,
            email: data.user.email,
            role: data.user.role,
            opdId: data.user.opd_id,
            accessToken: data.access_token,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.opdId = user.opdId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.opdId = token.opdId;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
```

```typescript
// frontend/middleware.ts
import { auth } from "@/lib/auth";

const ROLE_ROUTES = {
  SUPER_ADMIN: ["/admin", "/upload", "/dashboard", "/reports"],
  HR_MANAGER: ["/upload", "/dashboard", "/reports", "/employees"],
  KEPALA_OPD: ["/dashboard", "/opd", "/reports"],
  EKSEKUTIF: ["/dashboard", "/reports"],
  PEGAWAI: ["/profile", "/presensi-saya"],
};

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // Belum login → redirect ke /login
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Cek role punya akses ke route ini
  const allowedRoutes = ROLE_ROUTES[role] || [];
  const isAllowed = allowedRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (!isAllowed) {
    return Response.redirect(new URL("/403", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
```

### Component-level Guard

```typescript
// frontend/components/auth/RoleGuard.tsx
"use client";
import { useSession } from "next-auth/react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();
  if (!session || !allowedRoles.includes(session.user.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

// Usage:
// <RoleGuard allowedRoles={["HR_MANAGER", "SUPER_ADMIN"]}>
//   <UploadButton />
// </RoleGuard>
```

---

## 🔐 MFA (Multi-Factor Authentication)

### Untuk SUPER_ADMIN (wajib)

```python
# backend/app/services/auth.py
import pyotp
import qrcode
from io import BytesIO

def generate_mfa_secret(user: User) -> str:
    """Generate TOTP secret, simpan ke user.mfa_secret"""
    secret = pyotp.random_base32()
    user.mfa_secret = secret  # encrypted at rest
    return secret

def get_mfa_qr_code(user: User) -> bytes:
    """Generate QR code untuk enroll di Google Authenticator"""
    totp = pyotp.TOTP(user.mfa_secret)
    uri = totp.provisioning_uri(
        name=user.email,
        issuer_name="SENTER ASN"
    )
    img = qrcode.make(uri)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def verify_mfa_code(user: User, code: str) -> bool:
    """Verify 6-digit code dari authenticator app"""
    totp = pyotp.TOTP(user.mfa_secret)
    return totp.verify(code, valid_window=1)  # tolerate 30s drift
```

Login flow dengan MFA:
```
1. User input username + password
2. Backend verify password → return "mfa_required: true"
3. User input 6-digit code dari authenticator
4. Backend verify MFA → return access + refresh token
```

---

## 🛡️ Security Best Practices

### ✅ Implemented
- [x] Bcrypt untuk password (cost 12)
- [x] JWT dengan short expiry (15 menit)
- [x] Refresh token rotation
- [x] HttpOnly + Secure + SameSite cookie untuk refresh
- [x] Access token di memory (tidak di localStorage)
- [x] MFA untuk admin
- [x] Login attempt rate limiting (5x → lock 15 menit)
- [x] Account lock setelah 10 failed login (24 jam)
- [x] Password policy: min 12 char, complexity
- [x] Audit log untuk semua auth event
- [x] HTTPS only di production
- [x] CORS whitelist

### ⚠️ Penting
- Refresh token di-revoke saat:
  - User logout
  - User ganti password
  - Admin reset user
  - Terdeteksi anomali
- Session invalidation:
  - Idle 30 menit → token expired
  - Max session 8 jam → force re-login
  - Concurrent session max 2 per user

---

## 📊 Audit Log

```python
# backend/app/services/audit.py
async def log_auth_event(
    db: AsyncSession,
    user_id: int | None,
    event: str,  # LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, MFA_FAIL, dll
    ip: str,
    user_agent: str,
    details: dict = None,
):
    await db.execute(
        text("""
            INSERT INTO audit.access_log
            (user_id, action, ip_address, user_agent, request_payload, created_at)
            VALUES (:user_id, :action, :ip, :ua, CAST(:details AS JSONB), NOW())
        """),
        {
            "user_id": user_id,
            "action": event,
            "ip": ip,
            "ua": user_agent,
            "details": json.dumps(details or {}),
        }
    )
    await db.commit()
```

Events yang di-log:
- `LOGIN_SUCCESS`, `LOGIN_FAIL`, `LOGOUT`
- `MFA_ENROLL`, `MFA_SUCCESS`, `MFA_FAIL`
- `PASSWORD_CHANGE`, `PASSWORD_RESET`
- `TOKEN_REFRESH`, `TOKEN_REVOKE`
- `ACCESS_DENIED` (403)

---

## 🧪 Testing

### Unit Tests
- [x] Password hashing & verification
- [x] JWT generation & verification
- [x] Token expiry
- [x] Password policy validation
- [x] MFA secret generation
- [x] MFA code verification

### Integration Tests
- [x] Login flow end-to-end
- [x] Refresh token rotation
- [x] Logout invalidates refresh
- [x] Role enforcement
- [x] OPD-scoped data filter
- [x] Failed login lockout
- [x] MFA enrollment & verification

### Security Tests
- [x] SQL injection di login (parameterized queries)
- [x] XSS prevention
- [x] CSRF (SameSite cookie)
- [x] Brute force (rate limit)
- [x] Token theft (rotation detect)
- [x] Privilege escalation attempt

---

## 🔗 Integrasi dengan Modul Lain

Semua endpoint API di Module 01-05 WAJIB pakai `Depends(get_current_user)` atau `Depends(require_role(...))`.

---

## 📚 Referensi

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)
- [NextAuth.js docs](https://next-auth.js.org/)
- [`docs/security.md`](../security.md)

---

> **Lihat juga: [`docs/standards/`](standards/)** untuk coding conventions.
