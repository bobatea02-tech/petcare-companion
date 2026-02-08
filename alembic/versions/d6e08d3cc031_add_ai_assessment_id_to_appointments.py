"""add_ai_assessment_id_to_appointments

Revision ID: d6e08d3cc031
Revises: c44089c4ffb6
Create Date: 2026-02-06 18:27:40.212671

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6e08d3cc031'
down_revision: Union[str, None] = 'c44089c4ffb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ai_assessment_id column to appointments table using batch mode for SQLite
    with op.batch_alter_table('appointments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ai_assessment_id', sa.UUID(), nullable=True))
        batch_op.create_index(batch_op.f('ix_appointments_ai_assessment_id'), ['ai_assessment_id'], unique=False)
        batch_op.create_foreign_key('fk_appointments_ai_assessment_id', 'ai_assessments', ['ai_assessment_id'], ['id'])


def downgrade() -> None:
    # Remove ai_assessment_id column from appointments table using batch mode for SQLite
    with op.batch_alter_table('appointments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_appointments_ai_assessment_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_appointments_ai_assessment_id'))
        batch_op.drop_column('ai_assessment_id')