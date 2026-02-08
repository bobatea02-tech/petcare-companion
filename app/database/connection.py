"""
Database connection and session management with connection pooling.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool, QueuePool, AsyncAdaptedQueuePool

from app.core.config import settings


# Determine if using SQLite
is_sqlite = "sqlite" in settings.DATABASE_URL.lower()

# Create async database engine with optimized connection pooling
if is_sqlite:
    # SQLite doesn't support connection pooling with async
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args={
            "timeout": 30,
        },
    )
else:
    # PostgreSQL/MySQL support connection pooling
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        poolclass=AsyncAdaptedQueuePool,
        pool_pre_ping=True,
        # Connection pool settings for production
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT,
        pool_recycle=settings.DATABASE_POOL_RECYCLE,
        # Query optimization settings
        echo_pool=settings.DEBUG,  # Log pool checkouts/checkins in debug mode
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Alias for consistency with imports
get_db_session = get_db