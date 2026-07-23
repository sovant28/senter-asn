import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    hash_password,
    validate_password_strength,
    verify_access_token,
    verify_password,
    verify_refresh_token,
)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def access_token():
    return create_access_token(1, "SUPER_ADMIN", None)


@pytest.fixture
def hr_token():
    return create_access_token(2, "HR_MANAGER", 5)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        plain = "SecureP@ss123"
        hashed = hash_password(plain)
        assert hashed != plain
        assert verify_password(plain, hashed)
        assert not verify_password("WrongPassword", hashed)


class TestPasswordStrength:
    def test_valid_password(self):
        ok, msg = validate_password_strength("SecureP@ss123")
        assert ok

    def test_too_short(self):
        ok, msg = validate_password_strength("Ab1")
        assert not ok
        assert "minimal" in msg.lower()

    def test_no_uppercase(self):
        ok, msg = validate_password_strength("securepass123")
        assert not ok
        assert "besar" in msg.lower()

    def test_no_lowercase(self):
        ok, msg = validate_password_strength("SECUREPASS123")
        assert not ok
        assert "kecil" in msg.lower()

    def test_no_digit(self):
        ok, msg = validate_password_strength("SecurePassWord")
        assert not ok
        assert "angka" in msg.lower()


class TestJWT:
    def test_create_and_verify_access(self):
        token = create_access_token(42, "KEPALA_OPD", 7)
        payload = verify_access_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "KEPALA_OPD"
        assert payload["opd_id"] == 7
        assert payload["type"] == "access"

    def test_create_and_verify_refresh(self):
        token = create_refresh_token(10)
        payload = verify_refresh_token(token)
        assert payload["sub"] == "10"
        assert payload["type"] == "refresh"

    def test_access_rejected_as_refresh(self):
        token = create_access_token(1, "PEGAWAI")
        with pytest.raises(ValueError):
            verify_refresh_token(token)

    def test_refresh_rejected_as_access(self):
        token = create_refresh_token(1)
        with pytest.raises(ValueError):
            verify_access_token(token)

    def test_invalid_token(self):
        with pytest.raises(ValueError):
            verify_access_token("not.a.valid.token")


class TestAuthEndpoints:
    def test_login_validation(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 422

    def test_refresh_invalid(self, client):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "bad"})
        assert resp.status_code == 401

    def test_me_requires_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_change_password_requires_token(self, client):
        resp = client.post("/api/auth/change-password", json={
            "old_password": "old", "new_password": "new",
        })
        assert resp.status_code == 401


class TestEndpointProtection:
    def test_upload_requires_auth(self, client):
        resp = client.post("/api/presensi/upload")
        assert resp.status_code in (401, 422)

    def test_opd_ranking_requires_auth(self, client):
        resp = client.get("/api/analytics/opd-ranking?tahun=2026&bulan=5")
        assert resp.status_code == 401

    def test_pdf_requires_auth(self, client):
        resp = client.get("/api/reports/pdf?tahun=2026&bulan=5")
        assert resp.status_code == 401

    def test_opd_detail_requires_auth(self, client):
        resp = client.get("/api/analytics/opd/1?tahun=2026&bulan=5")
        assert resp.status_code == 401
