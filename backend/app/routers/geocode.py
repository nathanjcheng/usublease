from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import urllib.parse
from ..core.config import get_settings

router = APIRouter()

settings = get_settings()
MAPBOX_API_KEY = settings.MAPBOX_API_KEY

@router.get("/geocode")
async def geocode(q: str = Query(..., description="Search text")):
    """Proxy endpoint that forwards geocoding queries to Mapbox keeping the secret key on the server."""
    if not MAPBOX_API_KEY:
        raise HTTPException(status_code=500, detail="Mapbox API key not configured on the server")

    url_encoded_q = urllib.parse.quote(q)
    url = (
        f"https://api.mapbox.com/geocoding/v5/mapbox.places/{url_encoded_q}.json"
        f"?access_token={MAPBOX_API_KEY}&autocomplete=true&limit=5&country=us&proximity=-81.5158,27.6648"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch data from Mapbox")
    return resp.json() 