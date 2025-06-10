from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.firebase import db, bucket

app = FastAPI(
    title="USublease API",
    description="Backend API for USublease - Sublease Management Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "firestore": "connected", "storage": "connected"}

# Import and include routers
from .routers import listings, messaging, auth, geocode

app.include_router(listings.router, prefix="/api/listings", tags=["listings"])
app.include_router(messaging.router, prefix="/api/messaging", tags=["messaging"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(geocode.router, prefix="/api", tags=["geocode"]) 