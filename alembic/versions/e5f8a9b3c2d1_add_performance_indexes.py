"""Add performance indexes

Revision ID: e5f8a9b3c2d1
Revises: d6e08d3cc031
Create Date: 2026-02-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f8a9b3c2d1'
down_revision: Union[str, None] = 'd6e08d3cc031'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes for frequently queried fields."""
    
    # Users table indexes
    op.create_index('ix_users_phone_number', 'users', ['phone_number'])
    op.create_index('ix_users_is_active', 'users', ['is_active'])
    
    # Pets table indexes
    op.create_index('ix_pets_name', 'pets', ['name'])
    op.create_index('ix_pets_species', 'pets', ['species'])
    op.create_index('ix_pets_is_active', 'pets', ['is_active'])
    
    # Medications table indexes
    op.create_index('ix_medications_medication_name', 'medications', ['medication_name'])
    op.create_index('ix_medications_start_date', 'medications', ['start_date'])
    op.create_index('ix_medications_end_date', 'medications', ['end_date'])
    op.create_index('ix_medications_active', 'medications', ['active'])
    
    # Medication logs table indexes
    op.create_index('ix_medication_logs_administered_at', 'medication_logs', ['administered_at'])
    op.create_index('ix_medication_logs_completed', 'medication_logs', ['completed'])
    
    # Health records table indexes
    op.create_index('ix_health_records_record_date', 'health_records', ['record_date'])
    op.create_index('ix_health_records_record_type', 'health_records', ['record_type'])
    
    # Appointments table indexes
    op.create_index('ix_appointments_appointment_date', 'appointments', ['appointment_date'])
    op.create_index('ix_appointments_appointment_type', 'appointments', ['appointment_type'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])
    op.create_index('ix_appointments_reminder_sent_24h', 'appointments', ['reminder_sent_24h'])
    op.create_index('ix_appointments_reminder_sent_2h', 'appointments', ['reminder_sent_2h'])
    
    # AI assessments table indexes
    op.create_index('ix_ai_assessments_triage_level', 'ai_assessments', ['triage_level'])
    
    # Composite indexes for common query patterns
    op.create_index('ix_medications_pet_active', 'medications', ['pet_id', 'active'])
    op.create_index('ix_appointments_pet_status', 'appointments', ['pet_id', 'status'])
    op.create_index('ix_health_records_pet_date', 'health_records', ['pet_id', 'record_date'])


def downgrade() -> None:
    """Remove performance indexes."""
    
    # Drop composite indexes
    op.drop_index('ix_health_records_pet_date', 'health_records')
    op.drop_index('ix_appointments_pet_status', 'appointments')
    op.drop_index('ix_medications_pet_active', 'medications')
    
    # Drop AI assessments indexes
    op.drop_index('ix_ai_assessments_triage_level', 'ai_assessments')
    
    # Drop appointments indexes
    op.drop_index('ix_appointments_reminder_sent_2h', 'appointments')
    op.drop_index('ix_appointments_reminder_sent_24h', 'appointments')
    op.drop_index('ix_appointments_status', 'appointments')
    op.drop_index('ix_appointments_appointment_type', 'appointments')
    op.drop_index('ix_appointments_appointment_date', 'appointments')
    
    # Drop health records indexes
    op.drop_index('ix_health_records_record_type', 'health_records')
    op.drop_index('ix_health_records_record_date', 'health_records')
    
    # Drop medication logs indexes
    op.drop_index('ix_medication_logs_completed', 'medication_logs')
    op.drop_index('ix_medication_logs_administered_at', 'medication_logs')
    
    # Drop medications indexes
    op.drop_index('ix_medications_active', 'medications')
    op.drop_index('ix_medications_end_date', 'medications')
    op.drop_index('ix_medications_start_date', 'medications')
    op.drop_index('ix_medications_medication_name', 'medications')
    
    # Drop pets indexes
    op.drop_index('ix_pets_is_active', 'pets')
    op.drop_index('ix_pets_species', 'pets')
    op.drop_index('ix_pets_name', 'pets')
    
    # Drop users indexes
    op.drop_index('ix_users_is_active', 'users')
    op.drop_index('ix_users_phone_number', 'users')
