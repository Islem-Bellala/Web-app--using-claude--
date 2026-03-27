"""
Bunyan — Project Schemas (Pydantic)
"""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectStateUpdate(BaseModel):
    state: dict[str, Any]


class ProjectSummary(BaseModel):
    """List view — no state (state can be large)."""
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectFull(BaseModel):
    """Single project view — includes state."""
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    state: dict[str, Any] | None

    model_config = {"from_attributes": True}
