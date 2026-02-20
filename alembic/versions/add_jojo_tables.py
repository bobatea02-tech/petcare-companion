"""Add JoJo conversation and quota tables

Revision ID: add_jojo_tables
Revises: 
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = 'add_jojo_tables'
down_revision = None  # Update this to the latest revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create conversation_history and user_question_quota tables."""
    
    # Create conversation_history table
    op.create_table(
        'conversation_history',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('pet_id', UUID(as_uuid=True), sa.ForeignKey('pets.id'), nullable=True, index=True),
        sa.Column('messages', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create user_question_quota table
    op.create_table(
        'user_question_quota',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True, index=True),
        sa.Column('questions_asked', sa.Integer(), default=0, nullable=False),
        sa.Column('quota_reset_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    """Drop conversation_history and user_question_quota tables."""
    op.drop_table('user_question_quota')
    op.drop_table('conversation_history')
