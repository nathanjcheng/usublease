from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ListingBase(BaseModel):
    title: str
    description: str
    price: float
    location: str
    start_date: datetime
    end_date: datetime
    images: List[str] = []
    amenities: List[str] = []
    contact_info: str

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    contact_info: Optional[str] = None

class ListingInDB(ListingBase):
    id: str
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        from_attributes = True 