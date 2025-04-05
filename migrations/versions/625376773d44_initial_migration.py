"""Initial migration

Revision ID: 625376773d44
Revises: 
Create Date: 2025-03-22 15:02:08.867972

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '625376773d44'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('song_order',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('order_code', sa.String(length=10), nullable=False),
    sa.Column('nickname', sa.String(length=100), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('confirmed_at', sa.DateTime(), nullable=True),
    sa.Column('youtube_url', sa.String(length=255), nullable=True),
    sa.Column('song_title', sa.String(length=255), nullable=True),
    sa.Column('artist', sa.String(length=255), nullable=True),
    sa.Column('played', sa.Boolean(), nullable=True),
    sa.Column('played_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('order_code')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('song_order')
    # ### end Alembic commands ###
