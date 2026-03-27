"""
Bunyan — Project CRUD Endpoints
================================
All endpoints require authentication.
All queries are scoped to the current user (user_id = current_user.id).

POST   /api/v1/projects              — create project
GET    /api/v1/projects              — list user's projects (no state)
GET    /api/v1/projects/{id}         — get full project (with state)
PUT    /api/v1/projects/{id}         — update metadata (name, description)
PUT    /api/v1/projects/{id}/state   — save engineering state (JSONB blob)
DELETE /api/v1/projects/{id}         — delete project
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models.project import Project
from backend.models.user import User
from backend.schemas.project import (
    ProjectCreate,
    ProjectFull,
    ProjectStateUpdate,
    ProjectSummary,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


async def _get_own_project(
    project_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Project:
    """Fetch a project by ID, 404 if not found or not owned by current_user."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=ProjectFull, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        state=None,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("", response_model=list[ProjectSummary])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectFull)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_own_project(project_id, current_user, db)


@router.put("/{project_id}", response_model=ProjectFull)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_own_project(project_id, current_user, db)
    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    await db.commit()
    await db.refresh(project)
    return project


@router.put("/{project_id}/state", response_model=ProjectFull)
async def save_project_state(
    project_id: uuid.UUID,
    body: ProjectStateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_own_project(project_id, current_user, db)
    project.state = body.state
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await _get_own_project(project_id, current_user, db)
    await db.delete(project)
    await db.commit()
