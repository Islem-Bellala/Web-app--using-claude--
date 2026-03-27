"""
Tests for /api/v1/projects endpoints.

Uses the session-scoped client + session_factory from conftest.py.
Each test registers a dedicated user and cleans up after itself.
"""

import uuid

import pytest
from sqlalchemy import delete

from backend.models.project import Project
from backend.models.user import User

BASE = "/api/v1/projects"
AUTH = "/api/v1/auth"


def _unique_email() -> str:
    return f"proj_{uuid.uuid4().hex[:8]}@bunyan-test.com"


async def _register_and_token(client, email: str, password: str = "secret123") -> str:
    """Register a user and return the access token."""
    r = await client.post(AUTH + "/register", json={"email": email, "password": password})
    assert r.status_code == 201
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _cleanup_user(session_factory, email: str) -> None:
    async with session_factory() as db:
        await db.execute(delete(User).where(User.email == email))
        await db.commit()


# =============================================================================
# create project
# =============================================================================


async def test_create_project(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    r = await client.post(BASE, json={"name": "My Project"}, headers=_auth(token))
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Project"
    assert data["state"] is None

    await _cleanup_user(session_factory, email)


# =============================================================================
# list projects
# =============================================================================


async def test_list_projects_empty(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    r = await client.get(BASE, headers=_auth(token))
    assert r.status_code == 200
    assert r.json() == []

    await _cleanup_user(session_factory, email)


async def test_list_projects_with_data(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    await client.post(BASE, json={"name": "Alpha"}, headers=_auth(token))
    await client.post(BASE, json={"name": "Beta"}, headers=_auth(token))

    r = await client.get(BASE, headers=_auth(token))
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    # Both projects present (order: most recently updated first)
    assert set(names) == {"Alpha", "Beta"}
    # No "state" key in list view (ProjectSummary)
    assert "state" not in r.json()[0]

    await _cleanup_user(session_factory, email)


# =============================================================================
# get project
# =============================================================================


async def test_get_project_with_state(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    create_r = await client.post(BASE, json={"name": "Test"}, headers=_auth(token))
    project_id = create_r.json()["id"]

    state = {"project": {"wilayaCode": "09"}, "seismic": {"R": 5}}
    await client.put(f"{BASE}/{project_id}/state", json={"state": state}, headers=_auth(token))

    r = await client.get(f"{BASE}/{project_id}", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["state"] == state

    await _cleanup_user(session_factory, email)


async def test_get_project_not_found(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    fake_id = str(uuid.uuid4())
    r = await client.get(f"{BASE}/{fake_id}", headers=_auth(token))
    assert r.status_code == 404

    await _cleanup_user(session_factory, email)


async def test_get_project_wrong_user(client, session_factory):
    """User B cannot access User A's project — must return 404, not 403."""
    email_a = _unique_email()
    email_b = _unique_email()
    token_a = await _register_and_token(client, email_a)
    token_b = await _register_and_token(client, email_b)

    create_r = await client.post(BASE, json={"name": "Private"}, headers=_auth(token_a))
    project_id = create_r.json()["id"]

    r = await client.get(f"{BASE}/{project_id}", headers=_auth(token_b))
    assert r.status_code == 404  # not 403 — don't reveal existence

    await _cleanup_user(session_factory, email_a)
    await _cleanup_user(session_factory, email_b)


# =============================================================================
# update metadata
# =============================================================================


async def test_update_project_metadata(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    create_r = await client.post(BASE, json={"name": "Old Name"}, headers=_auth(token))
    project_id = create_r.json()["id"]

    r = await client.put(
        f"{BASE}/{project_id}",
        json={"name": "New Name", "description": "Updated"},
        headers=_auth(token),
    )
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"
    assert r.json()["description"] == "Updated"

    await _cleanup_user(session_factory, email)


# =============================================================================
# save state
# =============================================================================


async def test_save_project_state(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    create_r = await client.post(BASE, json={"name": "Stateful"}, headers=_auth(token))
    project_id = create_r.json()["id"]

    state = {"project": {"wilayaCode": "16", "zone": "VI"}, "structural": {"stories": []}}
    r = await client.put(
        f"{BASE}/{project_id}/state", json={"state": state}, headers=_auth(token)
    )
    assert r.status_code == 200
    assert r.json()["state"] == state

    # Round-trip: reload and verify state is identical
    r2 = await client.get(f"{BASE}/{project_id}", headers=_auth(token))
    assert r2.json()["state"] == state

    await _cleanup_user(session_factory, email)


# =============================================================================
# delete
# =============================================================================


async def test_delete_project(client, session_factory):
    email = _unique_email()
    token = await _register_and_token(client, email)

    create_r = await client.post(BASE, json={"name": "To Delete"}, headers=_auth(token))
    project_id = create_r.json()["id"]

    r = await client.delete(f"{BASE}/{project_id}", headers=_auth(token))
    assert r.status_code == 204

    r2 = await client.get(f"{BASE}/{project_id}", headers=_auth(token))
    assert r2.status_code == 404

    await _cleanup_user(session_factory, email)


# =============================================================================
# auth required
# =============================================================================


async def test_all_endpoints_require_auth(client):
    fake_id = str(uuid.uuid4())
    endpoints = [
        ("GET",    BASE),
        ("POST",   BASE),
        ("GET",    f"{BASE}/{fake_id}"),
        ("PUT",    f"{BASE}/{fake_id}"),
        ("PUT",    f"{BASE}/{fake_id}/state"),
        ("DELETE", f"{BASE}/{fake_id}"),
    ]
    for method, url in endpoints:
        r = await client.request(method, url, json={})
        assert r.status_code == 403, f"{method} {url} should require auth, got {r.status_code}"
