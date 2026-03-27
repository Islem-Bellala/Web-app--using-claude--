"""
Tests for /api/v1/auth endpoints.

Uses httpx.AsyncClient against the real FastAPI app + real PostgreSQL (NullPool).
Each test uses a unique email. Cleanup uses the same conftest session_factory.
"""

import uuid

import pytest
from sqlalchemy import delete

from backend.models.user import User

BASE = "/api/v1/auth"


def _unique_email() -> str:
    return f"test_{uuid.uuid4().hex[:8]}@bunyan-test.com"


async def _cleanup(session_factory, email: str) -> None:
    async with session_factory() as db:
        await db.execute(delete(User).where(User.email == email))
        await db.commit()


# =============================================================================
# register
# =============================================================================


async def test_register_success(client, session_factory):
    email = _unique_email()
    r = await client.post(f"{BASE}/register", json={"email": email, "password": "secret123"})
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    await _cleanup(session_factory, email)


async def test_register_duplicate_email(client, session_factory):
    email = _unique_email()
    await client.post(f"{BASE}/register", json={"email": email, "password": "secret123"})
    r = await client.post(f"{BASE}/register", json={"email": email, "password": "other"})
    assert r.status_code == 409
    await _cleanup(session_factory, email)


# =============================================================================
# login
# =============================================================================


async def test_login_success(client, session_factory):
    email = _unique_email()
    await client.post(f"{BASE}/register", json={"email": email, "password": "secret123"})
    r = await client.post(f"{BASE}/login", json={"email": email, "password": "secret123"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    await _cleanup(session_factory, email)


async def test_login_wrong_password(client, session_factory):
    email = _unique_email()
    await client.post(f"{BASE}/register", json={"email": email, "password": "secret123"})
    r = await client.post(f"{BASE}/login", json={"email": email, "password": "wrong"})
    assert r.status_code == 401
    await _cleanup(session_factory, email)


async def test_login_nonexistent_email(client):
    r = await client.post(
        f"{BASE}/login", json={"email": "nobody@nowhere.com", "password": "x"}
    )
    assert r.status_code == 401


# =============================================================================
# /me
# =============================================================================


async def test_me_with_valid_token(client, session_factory):
    email = _unique_email()
    reg = await client.post(
        f"{BASE}/register", json={"email": email, "password": "secret123"}
    )
    token = reg.json()["access_token"]
    r = await client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email
    await _cleanup(session_factory, email)


async def test_me_without_token(client):
    r = await client.get(f"{BASE}/me")
    assert r.status_code == 403  # HTTPBearer returns 403 when no credentials present


# =============================================================================
# refresh
# =============================================================================


async def test_refresh_valid(client, session_factory):
    email = _unique_email()
    reg = await client.post(
        f"{BASE}/register", json={"email": email, "password": "secret123"}
    )
    refresh_token = reg.json()["refresh_token"]
    r = await client.post(f"{BASE}/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    await _cleanup(session_factory, email)


async def test_refresh_with_access_token_fails(client, session_factory):
    email = _unique_email()
    reg = await client.post(
        f"{BASE}/register", json={"email": email, "password": "secret123"}
    )
    access_token = reg.json()["access_token"]
    # Passing an access token where a refresh token is expected — must be rejected
    r = await client.post(f"{BASE}/refresh", json={"refresh_token": access_token})
    assert r.status_code == 401
    await _cleanup(session_factory, email)
