"""
Add weight tracking table to database.
"""

import sqlite3
from datetime import datetime

def add_weight_tracking_table():
    """Add pet_weight_records table to the database."""
    
    conn = sqlite3.connect('pawpal.db')
    cursor = conn.cursor()
    
    try:
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='pet_weight_records'
        """)
        
        if cursor.fetchone():
            print("✓ pet_weight_records table already exists")
            return
        
        # Create pet_weight_records table
        cursor.execute("""
            CREATE TABLE pet_weight_records (
                id TEXT PRIMARY KEY,
                pet_id TEXT NOT NULL,
                weight REAL NOT NULL,
                weight_unit TEXT DEFAULT 'lbs' NOT NULL,
                measurement_date DATE NOT NULL,
                source TEXT,
                notes TEXT,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets (id)
            )
        """)
        
        # Create indexes
        cursor.execute("""
            CREATE INDEX idx_pet_weight_records_pet_id 
            ON pet_weight_records(pet_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_pet_weight_records_measurement_date 
            ON pet_weight_records(measurement_date)
        """)
        
        conn.commit()
        print("✓ Successfully created pet_weight_records table")
        print("✓ Created indexes for pet_id and measurement_date")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error creating table: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Adding weight tracking table to database...")
    add_weight_tracking_table()
    print("\nDatabase migration completed successfully!")
