from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth
from ..core.firebase import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserResponse(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user in Firebase"""
    try:
        # Create user in Firebase
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.name
        )
        
        return UserResponse(
            uid=user_record.uid,
            email=user_record.email,
            name=user_record.display_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    try:
        user_record = auth.get_user(current_user["uid"])
        return UserResponse(
            uid=user_record.uid,
            email=user_record.email,
            name=user_record.display_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/me")
async def delete_user(current_user: dict = Depends(get_current_user)):
    """Delete the current user"""
    try:
        auth.delete_user(current_user["uid"])
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 