import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "dynamodb" in data
    assert "s3" in data

def test_docs_endpoint():
    """Test that the API documentation is accessible"""
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_schema():
    """Test that the OpenAPI schema is accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema

def test_cors_headers():
    """Test that CORS headers are properly set"""
    response = client.options("/health")
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers 