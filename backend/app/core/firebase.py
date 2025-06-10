import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .config import get_settings, BACKEND_DIR
from pathlib import Path

settings = get_settings()

# --- Resolve the service-account file path robustly ---
# 1. Take the env / settings value
# 2. If it is relative, interpret relative to ``backend/``
# 3. If the resulting file does not exist, fall back to the known filename in backend/
sa_path = Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH)

# If not absolute, treat it as relative to backend/
if not sa_path.is_absolute():
    sa_path = (BACKEND_DIR / sa_path).resolve()

# If file still not found, fall back to default file in backend/
default_sa = BACKEND_DIR / "usublease-firebase-adminsdk-fbsvc-ab3630848f.json"
if not sa_path.exists() and default_sa.exists():
    sa_path = default_sa

# ------------------------------------------------------
cred = credentials.Certificate(sa_path)
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