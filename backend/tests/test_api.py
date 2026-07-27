import io
import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    def test_health_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "healthy", "version": "0.1.0"}


class TestAuthStub:
    def test_login_requires_body(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 422


class TestPresensiUpload:
    def test_upload_no_auth(self, client):
        resp = client.post("/api/presensi/upload")
        assert resp.status_code == 401

    def test_upload_invalid_ext_no_auth(self, client):
        f = io.BytesIO(b"not xlsx")
        resp = client.post(
            "/api/presensi/upload",
            files={"file": ("test.txt", f, "text/plain")},
        )
        assert resp.status_code == 401

    def test_upload_invalid_magic_bytes(self, client):
        from app.middleware.auth import get_current_user
        from app.models.master import User

        mock_user = User(id=1, username="test_admin", role="SUPER_ADMIN", is_active=True)
        app.dependency_overrides[get_current_user] = lambda: mock_user

        try:
            f = io.BytesIO(b"not xlsx")
            resp = client.post(
                "/api/presensi/upload",
                files={"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            )
            assert resp.status_code == 400
            assert "File signature does not match .xlsx format." in resp.json()["detail"]
        finally:
            app.dependency_overrides.clear()


class TestAnalytics:
    def test_opd_ranking_no_auth(self, client):
        resp = client.get("/api/analytics/opd-ranking?tahun=2026&bulan=5")
        assert resp.status_code == 401

    def test_opd_detail_no_auth(self, client):
        resp = client.get("/api/analytics/opd/1?tahun=2026&bulan=5")
        assert resp.status_code == 401


class TestReports:
    def test_pdf_no_auth(self, client):
        resp = client.get("/api/reports/pdf?tahun=2026&bulan=5")
        assert resp.status_code == 401


class TestUsers:
    def test_list_users_stub(self, client):
        resp = client.get("/api/users")
        assert resp.status_code == 200


class TestOpenAPI:
    def test_openapi_schema(self, client):
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        paths = schema["paths"]
        assert "/api/auth/login" in paths
        assert "/api/presensi/upload" in paths
        assert "/api/presensi/periods" in paths
        assert "/api/analytics/opd-ranking" in paths
        assert "/api/analytics/opd/{opd_id}" in paths
        assert "/api/reports/pdf" in paths
        assert "/api/users" in paths
        assert "/health" in paths
        assert schema["info"]["title"] == "SENTER ASN"
        assert len(schema["paths"]) >= 8


class TestCORS:
    def test_cors_headers(self, client):
        resp = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.status_code == 200
        assert "access-control-allow-origin" in resp.headers


class TestPublicAPI:
    def test_public_opd_ranking_no_auth(self, client):
        from unittest.mock import patch, AsyncMock
        from app.api.deps import get_db

        mock_repo = AsyncMock()
        mock_repo.get_opd_ranking.return_value = [
            {"ranking": 1, "id": 10, "nama_opd": "Dinas Test", "kode_opd": "OPD_0010", "total_skor": 95.5, "kategori": "SANGAT_DISIPLIN"}
        ]

        app.dependency_overrides[get_db] = lambda: AsyncMock()

        with patch("app.api.public.PresensiRepository", return_value=mock_repo):
            try:
                resp = client.get("/api/public/ranking?tahun=2026&bulan=5")
                assert resp.status_code == 200
                data = resp.json()
                assert data["periode"] == {"tahun": 2026, "bulan": 5}
                assert data["opd_count"] == 1
                assert len(data["rankings"]) == 1
                assert data["rankings"][0]["nama_opd"] == "Dinas Test"
                assert data["rankings"][0]["total_skor"] == 95.5
            finally:
                app.dependency_overrides.clear()
