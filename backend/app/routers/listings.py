from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..core.firebase import db, get_current_user
from ..models.listing import ListingCreate, ListingUpdate, ListingInDB
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[ListingInDB])
async def get_listings():
    """Get all active listings"""
    listings_ref = db.collection("listings").where("is_active", "==", True)
    docs = listings_ref.stream()
    return [ListingInDB(id=doc.id, **doc.to_dict()) for doc in docs]

@router.post("/", response_model=ListingInDB)
async def create_listing(
    listing: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new listing"""
    listing_data = listing.model_dump()
    listing_data["owner_id"] = current_user["uid"]
    listing_data["created_at"] = datetime.utcnow()
    listing_data["updated_at"] = datetime.utcnow()
    listing_data["is_active"] = True
    
    doc_ref = db.collection("listings").document()
    doc_ref.set(listing_data)
    
    return ListingInDB(id=doc_ref.id, **listing_data)

@router.get("/{listing_id}", response_model=ListingInDB)
async def get_listing(listing_id: str):
    """Get a specific listing"""
    doc = db.collection("listings").document(listing_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingInDB(id=doc.id, **doc.to_dict())

@router.put("/{listing_id}", response_model=ListingInDB)
async def update_listing(
    listing_id: str,
    listing: ListingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a listing"""
    doc_ref = db.collection("listings").document(listing_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if doc.to_dict()["owner_id"] != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this listing")
    
    update_data = listing.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    doc_ref.update(update_data)
    updated_doc = doc_ref.get()
    return ListingInDB(id=updated_doc.id, **updated_doc.to_dict())

@router.delete("/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a listing"""
    doc_ref = db.collection("listings").document(listing_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if doc.to_dict()["owner_id"] != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    doc_ref.update({"is_active": False, "updated_at": datetime.utcnow()})
    return {"message": "Listing deleted successfully"} 