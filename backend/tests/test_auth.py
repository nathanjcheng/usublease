import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

# Mock data for testing
mock_user_data = {
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
}

mock_cognito_response = {
    "UserSub": "test-user-id-123",
    "UserAttributes": [
        {"Name": "email", "Value": "test@example.com"},
        {"Name": "name", "Value": "Test User"}
    ]
}

mock_current_user = {
    "uid": "test-user-id-123",
    "username": "test@example.com",
    "email": "test@example.com",
    "name": "Test User"
}

@patch('app.routers.auth.create_user_in_cognito')
def test_create_user_success(mock_create_user):
    """Test successful user creation"""
    mock_create_user.return_value = {"UserSub": "test-user-id-123"}
    
    response = client.post("/auth/users", json=mock_user_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test-user-id-123"
    assert data["email"] == mock_user_data["email"]
    assert data["name"] == mock_user_data["name"]
    mock_create_user.assert_called_once()

@patch('app.routers.auth.create_user_in_cognito')
def test_create_user_failure(mock_create_user):
    """Test user creation failure"""
    mock_create_user.side_effect = Exception("Cognito error")
    
    response = client.post("/auth/users", json=mock_user_data)
    
    assert response.status_code == 400
    assert "Cognito error" in response.json()["detail"]

@patch('app.routers.auth.get_current_user')
@patch('app.routers.auth.get_user_from_cognito')
def test_get_current_user_success(mock_get_user, mock_current_user_dep):
    """Test getting current user information"""
    mock_current_user_dep.return_value = mock_current_user
    mock_get_user.return_value = mock_cognito_response
    
    response = client.get("/auth/users/me")
    
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == mock_current_user["uid"]
    assert data["email"] == mock_user_data["email"]
    assert data["name"] == mock_user_data["name"]

@patch('app.routers.auth.get_current_user')
def test_get_current_user_unauthorized(mock_current_user_dep):
    """Test getting current user without authentication"""
    mock_current_user_dep.side_effect = Exception("Unauthorized")
    
    response = client.get("/auth/users/me")
    
    assert response.status_code == 400

@patch('app.routers.auth.get_current_user')
@patch('app.routers.auth.delete_user_from_cognito')
def test_delete_user_success(mock_delete_user, mock_current_user_dep):
    """Test successful user deletion"""
    mock_current_user_dep.return_value = mock_current_user
    mock_delete_user.return_value = None
    
    response = client.delete("/auth/users/me")
    
    assert response.status_code == 200
    assert response.json()["message"] == "User deleted successfully"
    mock_delete_user.assert_called_once_with(mock_current_user["username"])

def test_create_user_invalid_data():
    """Test user creation with invalid data"""
    invalid_data = {
        "email": "invalid-email",
        "password": "short",
        "name": ""
    }
    
    response = client.post("/auth/users", json=invalid_data)
    
    # Should fail validation
    assert response.status_code == 422 