"""Add grooming logs table

Revision ID: add_grooming_logs
Revises: 
Create Date: 2026-02-18

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_grooming_logs'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create grooming_logs table
    op.create_table(
        'grooming_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('pet_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pets.id'), nullable=False, index=True),
        sa.Column('grooming_type', sa.String(50), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table('grooming_logs')
