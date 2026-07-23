# Deployment — SENTER ASN

> **Panduan deploy SENTER ASN di environment development, staging, dan production.**

---

## 🌍 Environment Overview

| Environment | Tujuan | URL | Infrastructure |
|-------------|--------|-----|----------------|
| **Local** | Development per-developer | `localhost:3000` / `localhost:8000` | Docker Compose di laptop |
| **Staging** | Testing sebelum prod | `staging.senter-asn.bkpsdm.go.id` | VPS Indonesia |
| **Production** | Live untuk user | `senter-asn.bkpsdm.go.id` | VPS Indonesia / on-premise |

---

## 💻 Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git
- PostgreSQL client (opsional, untuk inspect DB)

### Setup Awal

```bash
# 1. Clone repository
git clone <repo-url> senter-asn
cd senter-asn

# 2. Setup environment variables
cp .env.example .env
# Edit .env, isi nilai untuk local dev (lihat referensi di bawah)

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d postgres redis minio

# 4. Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 5. Run database migrations
alembic upgrade head

# 6. Seed master data (OPD, users dummy)
python scripts/seed_db.py

# 7. Start backend
uvicorn app.main:app --reload --port 8000

# 8. Frontend setup (terminal baru)
cd frontend
npm install
npm run dev
```

Buka:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- MinIO console: http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`)

### Default Login (Local Dev)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | SUPER_ADMIN |
| `hr_staff` | `hr123` | HR_MANAGER |
| `kepala_dinkes` | `dinkes123` | KEPALA_OPD |
| `eksekutif` | `eksekutif123` | EKSEKUTIF |

> ⚠️ **Password default HANYA untuk local dev. Ganti sebelum deploy production.**

---

## 🔧 Environment Variables Reference

Lokasi: `.env` di root project, di-load ke backend & frontend.

```bash
# === Backend ===
DATABASE_URL=postgresql://senter:senter_pwd@localhost:5432/senter_asn
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<32+ char random string>
JWT_SECRET=<32+ char random string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=senter-uploads
MINIO_USE_SSL=false

# App
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# LLM (opsional, untuk narasi insight)
LLM_PROVIDER=none  # none | ollama | openai | anthropic
LLM_API_KEY=
LLM_MODEL=

# === Frontend ===
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="SENTER ASN"
```

**Generate secret key yang aman:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🏗️ Production Deployment (VPS Indonesia)

### Rekomendasi Provider
- **IDCloudHost** — DC Jakarta, support UU PDP
- **Biznet Gio** — DC Jakarta
- **Dewaweb** — DC Jakarta
- **Niagahoster** — DC Indonesia

**Spesifikasi minimum VPS:**
- 4 vCPU, 8 GB RAM, 100 GB SSD
- Ubuntu 22.04 LTS
- Docker & Docker Compose ter-install

### Deployment Steps

```bash
# 1. SSH ke server
ssh deployer@<vps-ip>

# 2. Setup directory
sudo mkdir -p /opt/senter-asn
sudo chown deployer:deployer /opt/senter-asn
cd /opt/senter-asn

# 3. Clone & setup
git clone <repo-url> .
cp .env.example .env.production
nano .env.production  # isi nilai production

# 4. Generate secrets
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
# Update ke .env.production

# 5. Build & start
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Run migrations
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_db.py

# 7. Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d senter-asn.bkpsdm.go.id

# 8. Setup backup cron
crontab -e
# Tambah: 0 2 * * * /opt/senter-asn/scripts/backup.sh
```

---

## 🐳 Docker Compose (Production)

File: `docker-compose.prod.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: senter_asn
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    networks:
      - internal

  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - miniodata:/data
    networks:
      - internal
      - external

  backend:
    build: ./backend
    restart: always
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      minio:
        condition: service_started
    networks:
      - internal
    deploy:
      replicas: 2
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    restart: always
    networks:
      - internal
      - external
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - ./nginx/acme-challenge:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - internal
      - external

volumes:
  pgdata:
  miniodata:

networks:
  internal:
    driver: bridge
  external:
    driver: bridge
```

---

## 🔄 CI/CD (GitHub Actions)

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app --cov-report=xml
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/senter-asn
            git pull
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose exec -T backend alembic upgrade head
```

---

## 💾 Backup & Recovery

### Backup Otomatis (cron harian)

```bash
# /opt/senter-asn/scripts/backup.sh
#!/bin/bash
set -e
BACKUP_DIR=/opt/senter-asn/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database (encrypted)
docker-compose exec -T postgres pg_dump -U $DB_USER senter_asn | \
  gpg --symmetric --cipher-algo AES256 --batch --passphrase-file /opt/senter-asn/.backup-key \
  > $BACKUP_DIR/db_$DATE.sql.gpg

# Backup MinIO data
docker-compose exec minio mc mirror /data $BACKUP_DIR/minio_$DATE/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "db_*.gpg" -mtime +30 -delete
find $BACKUP_DIR -name "minio_*" -mtime +30 -exec rm -rf {} +

echo "Backup completed: $DATE"
```

### Restore dari Backup

```bash
# Restore database
gpg --decrypt --passphrase-file /opt/senter-asn/.backup-key \
  /opt/senter-asn/backups/db_20260713_020000.sql.gpg | \
  docker-compose exec -T postgres psql -U $DB_USER senter_asn

# Restore MinIO
docker-compose exec minio mc mirror /opt/senter-asn/backups/minio_20260713_020000/ /data
```

---

## 📊 Monitoring

### Stack
- **Prometheus** — metrics collection
- **Grafana** — visualization
- **Loki** — log aggregation
- **Alertmanager** — alerting

### Key Metrics
- API response time (p50, p95, p99)
- Database connection pool usage
- Redis hit rate
- MinIO storage usage
- Active user count
- Error rate
- Failed login attempts

### Alert Rules (contoh)
- API down > 5 menit → critical alert
- Database disk > 80% → warning
- Failed login > 50/menit per IP → warning (possible brute force)
- Backup gagal → critical

---

## 🏥 On-premise (Alternatif Production)

Jika klien memilih on-premise (server di kantor BKPSDM):

**Spesifikasi minimum server:**
- CPU: 8 core
- RAM: 16 GB
- Storage: 500 GB SSD (untuk data + backup)
- Network: 100 Mbps
- UPS & backup power
- Cooling & AC dedicated

**Setup:**
- Sama dengan VPS production, tapi tanpa cloud backup
- Backup ke external HDD/NAS di lokasi terpisah
- Maintenance oleh IT internal BKPSDM

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Code review passed
- [ ] All tests passed (unit + integration)
- [ ] Security scan clean (Bandit, npm audit, Trivy)
- [ ] Database migration tested
- [ ] Backup procedure tested
- [ ] Environment variables configured
- [ ] SSL certificate ready
- [ ] DNS pointing to server
- [ ] Monitoring & alerting aktif
- [ ] Rollback plan documented

### Post-deployment
- [ ] Smoke test semua endpoint
- [ ] Generate sample PDF end-to-end
- [ ] Login sebagai setiap role
- [ ] Verify audit log working
- [ ] Check email notification
- [ ] Verify backup berjalan
- [ ] Update status page / changelog
- [ ] Notify stakeholder

---

## 🆘 Rollback Plan

Jika ada masalah setelah deploy:

```bash
# 1. Rollback ke image sebelumnya
cd /opt/senter-asn
docker-compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build

# 2. Rollback database migration
docker-compose exec backend alembic downgrade -1

# 3. Restore database dari backup (jika perlu)
./scripts/restore.sh backups/db_<sebelum-deploy>.sql.gpg
```

---

> **Untuk troubleshooting, lihat juga: [`docs/standards/code-style.md`](standards/code-style.md)**
