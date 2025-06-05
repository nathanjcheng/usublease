import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .config import get_settings

settings = get_settings()

# Initialize Firebase Admin
cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
firebase_app = firebase_admin.initialize_app(cred, {
    "storageBucket": settings.FIREBASE_STORAGE_BUCKET
})

# Get Firestore and Storage clients
db = firestore.client()
bucket = storage.bucket()

# Security scheme for token verification
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify Firebase ID token and return user info"""
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name")
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        ) 