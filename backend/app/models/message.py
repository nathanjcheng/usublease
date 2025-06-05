from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class MessageInDB(MessageBase):
    id: str
    thread_id: str
    sender_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class ThreadBase(BaseModel):
    listing_id: str
    participants: List[str]

class ThreadCreate(ThreadBase):
    pass

class ThreadInDB(ThreadBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    messages: List[MessageInDB] = []

    class Config:
        from_attributes = True 