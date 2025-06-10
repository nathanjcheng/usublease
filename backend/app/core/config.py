from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    FIREBASE_PROJECT_ID: str = os.getenv("REACT_APP_FIREBASE_PROJECT_ID", "usublease")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("REACT_APP_FIREBASE_STORAGE_BUCKET", "usublease.firebasestorage.app")
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        str(BACKEND_DIR / "usublease-firebase-adminsdk-fbsvc-ab3630848f.json")
    )

    # Mapbox API Key to be used by server-side proxy
    MAPBOX_API_KEY: str | None = os.getenv("MAPBOX_API_KEY")

    class Config:
        env_file = ".env"
        extra = "ignore"  # ignore any additional env vars without raising errors

@lru_cache()
def get_settings() -> Settings:
    return Settings() 