"""add_community_blog_tables

Revision ID: f7a9c8d5e4b3
Revises: 3803136fff44
Create Date: 2026-02-13 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'f7a9c8d5e4b3'
down_revision = '3803136fff44'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create blog_posts table
    op.create_table(
        'blog_posts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('pet_type', sa.String(50), nullable=True, index=True),
        sa.Column('tags', sa.Text, nullable=True),
        sa.Column('view_count', sa.Integer, default=0, nullable=False, index=True),
        sa.Column('like_count', sa.Integer, default=0, nullable=False, index=True),
        sa.Column('comment_count', sa.Integer, default=0, nullable=False, index=True),
        sa.Column('is_published', sa.Boolean, default=True, nullable=False, index=True),
        sa.Column('is_featured', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('is_flagged', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('flagged_reason', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create blog_comments table
    op.create_table(
        'blog_comments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', UUID(as_uuid=True), sa.ForeignKey('blog_posts.id'), nullable=False, index=True),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('parent_comment_id', UUID(as_uuid=True), sa.ForeignKey('blog_comments.id'), nullable=True, index=True),
        sa.Column('like_count', sa.Integer, default=0, nullable=False),
        sa.Column('is_deleted', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('is_flagged', sa.Boolean, default=False, nullable=False),
        sa.Column('flagged_reason', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create blog_likes table
    op.create_table(
        'blog_likes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('post_id', UUID(as_uuid=True), sa.ForeignKey('blog_posts.id'), nullable=False, index=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create comment_likes table
    op.create_table(
        'comment_likes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('comment_id', UUID(as_uuid=True), sa.ForeignKey('blog_comments.id'), nullable=False, index=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create user_follows table
    op.create_table(
        'user_follows',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('follower_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('following_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('user_follows')
    op.drop_table('comment_likes')
    op.drop_table('blog_likes')
    op.drop_table('blog_comments')
    op.drop_table('blog_posts')
