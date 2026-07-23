# Git Workflow

> Konvensi branching, commit message, dan code review untuk proyek SENTER ASN.

---

## 🌿 Branching Strategy

### Trunk-based dengan feature branches

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feat/parser-excel
  │     ├── feat/dashboard
  │     ├── fix/calculasi-bug
  │     └── refactor/auth-service
  │
  └── hotfix/critical-bug
```

### Branch Naming

```
<type>/<ticket-id>-<short-description>

# Examples:
feat/TASK-102-excel-parser
fix/TASK-303-ranking-bug
docs/TASK-401-update-readme
refactor/TASK-501-auth-service
chore/TASK-601-update-deps
hotfix/TASK-999-critical-vuln
```

### Types
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `refactor` — code change yang tidak add/fix
- `test` — adding tests
- `chore` — maintenance (deps, config)
- `hotfix` — critical fix ke production

### Branch Lifetime
- **Feature branch:** max 2 minggu. Kalau lebih, pecah jadi task lebih kecil.
- **Hotfix:** max 1 hari. Setelah merge ke main, cherry-pick ke develop.

---

## 💬 Commit Message Convention

### Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
# Simple
git commit -m "feat(parser): add Excel validation for NIP format"

# With body
git commit -m "feat(parser): add Excel validation for NIP format

- Validate NIP is 18 digits
- Allow None for honorer
- Add error message per row
- Add unit tests for edge cases

Closes TASK-102"

# Breaking change
git commit -m "feat(api)!: change auth endpoint from /login to /auth/login

BREAKING CHANGE: Frontend must update auth calls to /auth/login.
Migration: update all API client calls in frontend/lib/api.ts"
```

### Subject Rules
- **Max 72 karakter**
- **Imperative mood:** "add" bukan "added" atau "adds"
- **No period at end**
- **Lowercase** setelah type

### Body Rules
- Wrap di 100 karakter
- Jelaskan **what** dan **why**, bukan how
- Reference task ID: `TASK-XXX`

### Footer
- `Closes TASK-XXX` — close issue/task
- `BREAKING CHANGE: ...` — breaking change
- `Co-authored-by: Name <email>` — co-author

---

## 🔄 Pull Request Workflow

### 1. Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feat/TASK-102-excel-parser
```

### 2. Develop & Commit
```bash
# ... make changes ...

git add .
git commit -m "feat(parser): add NIP validation"
```

### 3. Push & Create PR
```bash
git push -u origin feat/TASK-102-excel-parser
# Buka GitHub, create PR ke `develop` branch
```

### 4. PR Title Format
Sama dengan commit message subject, contoh:
```
[FEAT] Add Excel parser with validation (TASK-102)
[FIX] Fix ranking calculation edge case (TASK-303)
[DOCS] Update architecture documentation (TASK-401)
```

### 5. PR Description Template

```markdown
## 📋 Deskripsi
Jelaskan apa yang diubah dan kenapa.

## 🎯 Task
- [TASK-XXX](link-to-task)

## 🔧 Perubahan
- Item 1
- Item 2
- Item 3

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing done

## 📸 Screenshots (jika UI)

## ⚠️ Breaking Changes
- (jika ada)

## 📝 Notes untuk Reviewer
- Hal khusus yang perlu diperhatikan
```

### 6. Review Process

**Reviewer responsibilities:**
- ✅ Code quality & style
- ✅ Logic correctness
- ✅ Security implications
- ✅ Performance impact
- ✅ Test coverage
- ✅ Documentation updated

**Approval:**
- Min 1 approval dari maintainer
- 2 approvals untuk perubahan besar (auth, schema, security)
- Semua komentar harus di-resolve sebelum merge

### 7. Merge

```bash
# Squash merge untuk feature branch (recommended)
# Merge commit untuk hotfix
# Rebase untuk clean history (optional)
```

---

## 🚀 Release Process

### Version Tagging (Semantic Versioning)

```
v<MAJOR>.<MINOR>.<PATCH>

# Examples:
v1.0.0    # Initial production release
v1.1.0    # New feature, backward compatible
v1.1.1    # Bug fix
v2.0.0    # Breaking change
```

### Release Steps

1. **Create release branch** dari develop
   ```bash
   git checkout develop
   git pull
   git checkout -b release/v1.1.0
   ```

2. **Update version** di config files
   - `backend/app/core/config.py` → `APP_VERSION`
   - `frontend/package.json` → `version`
   - `docker-compose.prod.yml` → image tags

3. **Update CHANGELOG.md**

4. **Final testing** di staging

5. **Merge ke main**
   ```bash
   git checkout main
   git merge --no-ff release/v1.1.0
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin main --tags
   ```

6. **Merge balik ke develop**
   ```bash
   git checkout develop
   git merge --no-ff release/v1.1.0
   git push origin develop
   ```

7. **Deploy ke production** (CI/CD otomatis via tag)

---

## 📜 CHANGELOG.md

```markdown
# Changelog

## [1.1.0] - 2026-08-15

### Added
- Excel parser dengan validasi lengkap
- Dashboard PWA dengan 5 role
- PDF generator 5 halaman SENTER ASN

### Changed
- Update scoring formula ke 25/20/15/40 (dari 60/20/20)

### Fixed
- Ranking bug untuk OPD dengan skor sama
- Timezone handling di presensi raw

### Security
- Tambah MFA untuk SUPER_ADMIN
- Encrypt file upload di MinIO

## [1.0.0] - 2026-07-13

### Added
- Initial release
- Basic Excel upload & PDF generation
```

---

## 🚫 Yang TIDAK Boleh di-Commit

**Hard rules (akan di-block oleh pre-commit):**
- ❌ `.env` (API keys, secrets)
- ❌ Data presensi ASN asli (NIP, nama, presensi)
- ❌ File credential (private keys, certificates)
- ❌ Large binary files (use Git LFS)

**Soft rules (akan di-flag di review):**
- ⚠️ `console.log` / `print` debugging
- ⚠️ Commented-out code
- ⚠️ TODO tanpa ticket
- ⚠️ Mixing multiple unrelated changes dalam 1 commit

```bash
# Add to .gitignore (root)
.env
.env.local
*.log
__pycache__/
.venv/
node_modules/
dist/
build/
.DS_Store
.idea/
.vscode/
*.xlsx  # Excel files (kecuali di samples/)
*.pdf   # Generated PDFs
samples/data-real/  # Folder untuk data produksi
```

---

## 📊 Git History Best Practices

```bash
# Good history (atomic commits)
feat(parser): add file size validation
feat(parser): add header column validation
feat(parser): add NIP format validation
feat(parser): add UNIT KERJA master validation
test(parser): add unit tests for all validations

# Bad history (mega commit)
feat(parser): implement everything

# Bad history (debug commits)
WIP
fix typo
more fixes
WIP again
```

---

## 🔍 Useful Git Aliases

```bash
# ~/.gitconfig
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    lg = log --oneline --graph --decorate -20
    amends = commit --amend --no-edit
    contributors = shortlog -s -n
```

---

## 📞 Code of Conduct

- Be respectful & constructive dalam review
- Assume good intent
- Focus on code, not person
- Terima feedback dengan terbuka
- Bantu junior developer belajar

---

> **Untuk code style detail, lihat [`code-style.md`](code-style.md).**
> **Untuk task tracking, lihat [`../tasks.md`](../tasks.md).**
