"""
Community/Blog API endpoints for pet parent social features.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.database.models import (
    BlogPost, BlogComment, BlogLike, CommentLike, 
    UserFollow, User
)
from app.core.auth import get_current_user
from pydantic import BaseModel, Field


router = APIRouter(prefix="/community", tags=["community"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================


class BlogPostCreate(BaseModel):
    """Schema for creating a blog post."""
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    pet_type: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogPostUpdate(BaseModel):
    """Schema for updating a blog post."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    pet_type: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogPostResponse(BaseModel):
    """Schema for blog post response."""
    id: UUID
    author_id: UUID
    author_name: str
    title: str
    content: str
    pet_type: Optional[str]
    tags: Optional[List[str]]
    view_count: int
    like_count: int
    comment_count: int
    is_published: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    is_liked_by_user: bool = False

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    """Schema for comment response."""
    id: UUID
    post_id: UUID
    author_id: UUID
    author_name: str
    content: str
    parent_comment_id: Optional[UUID]
    like_count: int
    created_at: datetime
    is_deleted: bool
    is_liked_by_user: bool = False

    class Config:
        from_attributes = True


# ============================================================================
# BLOG POST ENDPOINTS
# ============================================================================


@router.get("/posts", response_model=List[BlogPostResponse])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    pet_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("recent", regex="^(recent|popular|trending)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get blog posts with filtering and sorting.
    
    - **skip**: Number of posts to skip (pagination)
    - **limit**: Maximum number of posts to return
    - **pet_type**: Filter by pet type (dog, cat, etc.)
    - **search**: Search in title and content
    - **sort_by**: Sort order (recent, popular, trending)
    """
    query = select(BlogPost).where(BlogPost.is_published == True)
    
    # Apply filters
    if pet_type:
        query = query.where(BlogPost.pet_type == pet_type)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                BlogPost.title.ilike(search_term),
                BlogPost.content.ilike(search_term)
            )
        )
    
    # Apply sorting
    if sort_by == "popular":
        query = query.order_by(desc(BlogPost.like_count))
    elif sort_by == "trending":
        query = query.order_by(desc(BlogPost.view_count))
    else:  # recent
        query = query.order_by(desc(BlogPost.created_at))
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    # Get user's likes
    user_likes_query = select(BlogLike.post_id).where(BlogLike.user_id == current_user.id)
    user_likes_result = await db.execute(user_likes_query)
    user_liked_posts = set(user_likes_result.scalars().all())
    
    # Build response
    response = []
    for post in posts:
        # Get author name
        author_query = select(User).where(User.id == post.author_id)
        author_result = await db.execute(author_query)
        author = author_result.scalar_one_or_none()
        
        response.append(BlogPostResponse(
            id=post.id,
            author_id=post.author_id,
            author_name=f"{author.first_name} {author.last_name}" if author else "Unknown",
            title=post.title,
            content=post.content,
            pet_type=post.pet_type,
            tags=eval(post.tags) if post.tags else None,
            view_count=post.view_count,
            like_count=post.like_count,
            comment_count=post.comment_count,
            is_published=post.is_published,
            is_featured=post.is_featured,
            created_at=post.created_at,
            updated_at=post.updated_at,
            is_liked_by_user=post.id in user_liked_posts
        ))
    
    return response


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single blog post by ID."""
    query = select(BlogPost).where(BlogPost.id == post_id)
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    post.view_count += 1
    await db.commit()
    
    # Check if user liked this post
    like_query = select(BlogLike).where(
        and_(BlogLike.post_id == post_id, BlogLike.user_id == current_user.id)
    )
    like_result = await db.execute(like_query)
    is_liked = like_result.scalar_one_or_none() is not None
    
    # Get author name
    author_query = select(User).where(User.id == post.author_id)
    author_result = await db.execute(author_query)
    author = author_result.scalar_one_or_none()
    
    return BlogPostResponse(
        id=post.id,
        author_id=post.author_id,
        author_name=f"{author.first_name} {author.last_name}" if author else "Unknown",
        title=post.title,
        content=post.content,
        pet_type=post.pet_type,
        tags=eval(post.tags) if post.tags else None,
        view_count=post.view_count,
        like_count=post.like_count,
        comment_count=post.comment_count,
        is_published=post.is_published,
        is_featured=post.is_featured,
        created_at=post.created_at,
        updated_at=post.updated_at,
        is_liked_by_user=is_liked
    )


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: BlogPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new blog post."""
    import json
    
    new_post = BlogPost(
        author_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        pet_type=post_data.pet_type,
        tags=json.dumps(post_data.tags) if post_data.tags else None
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    return BlogPostResponse(
        id=new_post.id,
        author_id=new_post.author_id,
        author_name=f"{current_user.first_name} {current_user.last_name}",
        title=new_post.title,
        content=new_post.content,
        pet_type=new_post.pet_type,
        tags=post_data.tags,
        view_count=0,
        like_count=0,
        comment_count=0,
        is_published=True,
        is_featured=False,
        created_at=new_post.created_at,
        updated_at=new_post.updated_at,
        is_liked_by_user=False
    )


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: UUID,
    post_data: BlogPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a blog post (only by author)."""
    import json
    
    query = select(BlogPost).where(BlogPost.id == post_id)
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    
    # Update fields
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.pet_type is not None:
        post.pet_type = post_data.pet_type
    if post_data.tags is not None:
        post.tags = json.dumps(post_data.tags)
    
    await db.commit()
    await db.refresh(post)
    
    return BlogPostResponse(
        id=post.id,
        author_id=post.author_id,
        author_name=f"{current_user.first_name} {current_user.last_name}",
        title=post.title,
        content=post.content,
        pet_type=post.pet_type,
        tags=eval(post.tags) if post.tags else None,
        view_count=post.view_count,
        like_count=post.like_count,
        comment_count=post.comment_count,
        is_published=post.is_published,
        is_featured=post.is_featured,
        created_at=post.created_at,
        updated_at=post.updated_at,
        is_liked_by_user=False
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a blog post (only by author)."""
    query = select(BlogPost).where(BlogPost.id == post_id)
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.delete(post)
    await db.commit()


# ============================================================================
# LIKE ENDPOINTS
# ============================================================================


@router.post("/posts/{post_id}/like", status_code=status.HTTP_201_CREATED)
async def like_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Like a blog post."""
    # Check if post exists
    post_query = select(BlogPost).where(BlogPost.id == post_id)
    post_result = await db.execute(post_query)
    post = post_result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    like_query = select(BlogLike).where(
        and_(BlogLike.post_id == post_id, BlogLike.user_id == current_user.id)
    )
    like_result = await db.execute(like_query)
    existing_like = like_result.scalar_one_or_none()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")
    
    # Create like
    new_like = BlogLike(post_id=post_id, user_id=current_user.id)
    db.add(new_like)
    
    # Update like count
    post.like_count += 1
    
    await db.commit()
    
    return {"message": "Post liked successfully"}


@router.delete("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlike a blog post."""
    # Find the like
    like_query = select(BlogLike).where(
        and_(BlogLike.post_id == post_id, BlogLike.user_id == current_user.id)
    )
    like_result = await db.execute(like_query)
    like = like_result.scalar_one_or_none()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    # Get post to update count
    post_query = select(BlogPost).where(BlogPost.id == post_id)
    post_result = await db.execute(post_query)
    post = post_result.scalar_one_or_none()
    
    if post:
        post.like_count = max(0, post.like_count - 1)
    
    await db.delete(like)
    await db.commit()


# ============================================================================
# COMMENT ENDPOINTS
# ============================================================================


@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all comments for a post."""
    query = select(BlogComment).where(
        and_(BlogComment.post_id == post_id, BlogComment.is_deleted == False)
    ).order_by(BlogComment.created_at)
    
    result = await db.execute(query)
    comments = result.scalars().all()
    
    # Get user's comment likes
    user_likes_query = select(CommentLike.comment_id).where(CommentLike.user_id == current_user.id)
    user_likes_result = await db.execute(user_likes_query)
    user_liked_comments = set(user_likes_result.scalars().all())
    
    # Build response
    response = []
    for comment in comments:
        # Get author name
        author_query = select(User).where(User.id == comment.author_id)
        author_result = await db.execute(author_query)
        author = author_result.scalar_one_or_none()
        
        response.append(CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_name=f"{author.first_name} {author.last_name}" if author else "Unknown",
            content=comment.content,
            parent_comment_id=comment.parent_comment_id,
            like_count=comment.like_count,
            created_at=comment.created_at,
            is_deleted=comment.is_deleted,
            is_liked_by_user=comment.id in user_liked_comments
        ))
    
    return response


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a comment on a post."""
    # Check if post exists
    post_query = select(BlogPost).where(BlogPost.id == post_id)
    post_result = await db.execute(post_query)
    post = post_result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    new_comment = BlogComment(
        post_id=post_id,
        author_id=current_user.id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id
    )
    
    db.add(new_comment)
    
    # Update comment count
    post.comment_count += 1
    
    await db.commit()
    await db.refresh(new_comment)
    
    return CommentResponse(
        id=new_comment.id,
        post_id=new_comment.post_id,
        author_id=new_comment.author_id,
        author_name=f"{current_user.first_name} {current_user.last_name}",
        content=new_comment.content,
        parent_comment_id=new_comment.parent_comment_id,
        like_count=0,
        created_at=new_comment.created_at,
        is_deleted=False,
        is_liked_by_user=False
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a comment (only by author)."""
    query = select(BlogComment).where(BlogComment.id == comment_id)
    result = await db.execute(query)
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Soft delete
    comment.is_deleted = True
    comment.content = "[deleted]"
    
    # Update post comment count
    post_query = select(BlogPost).where(BlogPost.id == comment.post_id)
    post_result = await db.execute(post_query)
    post = post_result.scalar_one_or_none()
    
    if post:
        post.comment_count = max(0, post.comment_count - 1)
    
    await db.commit()
