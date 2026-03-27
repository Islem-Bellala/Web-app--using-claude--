"""
Bunyan — SQLAlchemy Models
============================
All models inherit from Base, which provides:
  - id          : UUID primary key
  - created_at  : timestamp with timezone (server default)
  - updated_at  : timestamp with timezone (auto-updated)
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# Import models so their tables register on Base.metadata (needed for Alembic autogenerate)
from backend.models.user import User  # noqa: E402, F401
from backend.models.project import Project  # noqa: E402, F401
