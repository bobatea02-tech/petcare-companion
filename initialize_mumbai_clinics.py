"""
Script to initialize Mumbai veterinary clinics in the database.
Run this once after setting up the database.
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.services.mumbai_vet_service import MumbaiVetService


async def initialize_clinics():
    """Initialize Mumbai clinics in the database."""
    print("Connecting to database...")
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        future=True
    )
    
    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        print("\nInitializing Mumbai veterinary clinics...")
        mumbai_service = MumbaiVetService(session)
        
        try:
            clinics = await mumbai_service.initialize_mumbai_clinics()
            print(f"\n✅ Successfully initialized {len(clinics)} Mumbai clinics!")
            
            print("\nInitialized clinics:")
            for clinic in clinics:
                print(f"  - {clinic.name} ({clinic.address})")
            
            return True
        except Exception as e:
            print(f"\n❌ Error initializing clinics: {e}")
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("Mumbai Veterinary Clinics Initialization")
    print("=" * 60)
    
    success = asyncio.run(initialize_clinics())
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Initialization complete!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ Initialization failed!")
        print("=" * 60)
        sys.exit(1)
