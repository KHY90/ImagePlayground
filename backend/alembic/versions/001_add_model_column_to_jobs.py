"""Add model column to jobs table.

Revision ID: 001_add_model
Revises:
Create Date: 2026-01-20

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_add_model"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add model column to jobs table."""
    op.add_column(
        "jobs",
        sa.Column("model", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    """Remove model column from jobs table."""
    op.drop_column("jobs", "model")
