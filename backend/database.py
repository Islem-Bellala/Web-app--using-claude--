"""
Bunyan — Async Database Engine & Session
=========================================
SQLAlchemy 2.0 async style.

Exports:
    engine            — AsyncEngine instance
    AsyncSessionLocal — async_sessionmaker factory
    get_db            — FastAPI dependency (async generator)
    dispose_engine    — clean shutdown helper
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.config import settings

# =============================================================================
# ENGINE
# =============================================================================

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

# =============================================================================
# SESSION FACTORY
# =============================================================================

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# =============================================================================
# FASTAPI DEPENDENCY
# =============================================================================


async def get_db() -> AsyncSession:
    """Yield a database session, closing it after the request completes."""
    async with AsyncSessionLocal() as session:
        yield session


# =============================================================================
# SHUTDOWN HELPER
# =============================================================================


async def dispose_engine() -> None:
    """Dispose the engine connection pool — call on app shutdown."""
    await engine.dispose()
