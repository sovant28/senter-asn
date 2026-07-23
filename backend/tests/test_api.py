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
