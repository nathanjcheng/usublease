from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..core.firebase import db, get_current_user
from ..models.message import ThreadCreate, ThreadInDB, MessageCreate, MessageInDB
from datetime import datetime
import uuid
from google.cloud import firestore

router = APIRouter()

@router.get("/threads", response_model=List[ThreadInDB])
async def get_user_threads(current_user: dict = Depends(get_current_user)):
    """Get all threads where the current user is a participant"""
    threads_ref = db.collection("threads").where("participants", "array_contains", current_user["uid"])
    docs = threads_ref.stream()
    return [ThreadInDB(id=doc.id, **doc.to_dict()) for doc in docs]

@router.post("/threads", response_model=ThreadInDB)
async def create_thread(
    thread: ThreadCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new message thread"""
    if current_user["uid"] not in thread.participants:
        thread.participants.append(current_user["uid"])
    
    thread_data = thread.model_dump()
    thread_data["created_at"] = datetime.utcnow()
    thread_data["last_updated"] = datetime.utcnow()
    thread_data["messages"] = []
    
    doc_ref = db.collection("threads").document()
    doc_ref.set(thread_data)
    
    return ThreadInDB(id=doc_ref.id, **thread_data)

@router.get("/threads/{thread_id}", response_model=ThreadInDB)
async def get_thread(
    thread_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific thread"""
    doc = db.collection("threads").document(thread_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread_data = doc.to_dict()
    if current_user["uid"] not in thread_data["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this thread")
    
    return ThreadInDB(id=doc.id, **thread_data)

@router.post("/threads/{thread_id}/messages", response_model=MessageInDB)
async def create_message(
    thread_id: str,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a message to a thread"""
    thread_ref = db.collection("threads").document(thread_id)
    thread = thread_ref.get()
    
    if not thread.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread_data = thread.to_dict()
    if current_user["uid"] not in thread_data["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to post in this thread")
    
    message_data = message.model_dump()
    message_data["sender_id"] = current_user["uid"]
    message_data["created_at"] = datetime.utcnow()
    
    # Add message to thread
    thread_ref.update({
        "messages": firestore.ArrayUnion([message_data]),
        "last_updated": datetime.utcnow()
    })
    
    return MessageInDB(
        id=str(uuid.uuid4()),
        thread_id=thread_id,
        **message_data
    ) 