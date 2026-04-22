"""
Pytest configuration and shared fixtures.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.config import get_settings, Settings


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return Settings(
        openai_api_key="sk-test-key",
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="test-service-key",
    )


@pytest.fixture
def mock_supabase() -> AsyncMock:
    """Mock Supabase client for unit tests — no real DB calls."""
    client = AsyncMock()
    client.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "test-id"}])
    )
    client.rpc.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    return client


@pytest.fixture
def client(mock_supabase: AsyncMock, test_settings: Settings):
    """FastAPI test client with mocked external dependencies."""
    app.state.supabase = mock_supabase
    app.state.settings = test_settings
    with TestClient(app) as c:
        yield c
