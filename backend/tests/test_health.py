from unittest.mock import patch
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """Verify that /api/health responds with 200 OK and expected structure."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["service"] == "Salvex Auction Platform API"
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_when_db_connected():
    """
    Unit test: Verify that /api/ready returns HTTP 200 OK when database is connected.
    Simulates database connectivity returning (True, 'database_connected').
    """
    with patch("app.api.health.check_db_connectivity", return_value=(True, "database_connected")):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/ready")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
            assert data["database"] == "connected"
            assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_when_db_unavailable():
    """
    Unit test: Verify that /api/ready returns HTTP 503 Service Unavailable when database is unreachable.
    Simulates database connectivity returning (False, 'database_unreachable: ConnectionRefusedError').
    """
    with patch("app.api.health.check_db_connectivity", return_value=(False, "database_unreachable: ConnectionRefusedError")):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/ready")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "not_ready"
            assert data["database"] == "database_unreachable: ConnectionRefusedError"
            assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_endpoint_unmocked_live_check():
    """
    Integration check: Invokes the actual check_db_connectivity() without mocks.
    Verifies that the endpoint returns a valid contract (either 200 if DB is configured,
    or 503 with safe error message if credentials/DB are offline) and never raises unhandled 500.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/ready")
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "timestamp" in data
