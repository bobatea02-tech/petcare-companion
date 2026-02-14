"""
Migration script to add archive fields to health_records table
"""
import asyncio
from sqlalchemy import text
from app.database.connection import get_db_session

async def add_archive_fields():
    """Add is_archived and archived_at columns to health_records table"""
    print("Adding archive fields to health_records table...")
    
    async for db in get_db_session():
        try:
            # Check if columns already exist
            check_query = text("""
                SELECT COUNT(*) as count 
                FROM pragma_table_info('health_records') 
                WHERE name IN ('is_archived', 'archived_at')
            """)
            result = await db.execute(check_query)
            existing_columns = result.scalar()
            
            if existing_columns >= 2:
                print("✅ Archive fields already exist")
                return
            
            # Add is_archived column
            if existing_columns < 1:
                await db.execute(text("""
                    ALTER TABLE health_records 
                    ADD COLUMN is_archived BOOLEAN DEFAULT 0 NOT NULL
                """))
                print("✅ Added is_archived column")
            
            # Add archived_at column
            await db.execute(text("""
                ALTER TABLE health_records 
                ADD COLUMN archived_at DATETIME
            """))
            print("✅ Added archived_at column")
            
            # Create index on is_archived
            await db.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_health_records_is_archived 
                ON health_records(is_archived)
            """))
            print("✅ Created index on is_archived")
            
            await db.commit()
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise
        finally:
            await db.close()
            break

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Health Records Archive Migration")
    print("=" * 60)
    asyncio.run(add_archive_fields())
