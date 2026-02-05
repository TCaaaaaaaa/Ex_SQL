from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

# Pydantic models
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    knowledge_map: Dict[str, Any]

    class Config:
        from_attributes = True # updated for pydantic v2

class UpdateKnowledgeRequest(BaseModel):
    knowledge_map: Dict[str, Any]

@router.get("/", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == user.username))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(username=user.username, knowledge_map={})
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{username}", response_model=UserResponse)
async def get_user(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{username}/knowledge", response_model=UserResponse)
async def update_user_knowledge(username: str, req: UpdateKnowledgeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update logic: merge or replace? Let's replace for now as front-end sends full map usually
    # But front-end logic is incremental update.
    # To be safe, let's assume req.knowledge_map is the full map or partial update
    # Here we just replace the json field
    user.knowledge_map = req.knowledge_map
    await db.commit()
    await db.refresh(user)
    return user
