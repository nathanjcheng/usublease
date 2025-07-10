import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from botocore.exceptions import ClientError

client = TestClient(app)

# Mock data for testing
mock_listing_data = {
    "title": "Test Apartment",
    "description": "A beautiful test apartment",
    "price": 1500,
    "location": "Test City, CA",
    "bedrooms": 2,
    "bathrooms": 1,
    "available_from": "2024-01-01",
    "available_until": "2024-12-31"
}

mock_listing_response = {
    "id": "test-listing-id",
    "owner_id": "test-user-id",
    "title": "Test Apartment",
    "description": "A beautiful test apartment",
    "price": 1500,
    "location": "Test City, CA",
    "bedrooms": 2,
    "bathrooms": 1,
    "available_from": "2024-01-01",
    "available_until": "2024-12-31",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
    "is_active": True
}

mock_current_user = {
    "uid": "test-user-id",
    "username": "test@example.com",
    "email": "test@example.com",
    "name": "Test User"
}

@patch('app.routers.listings.table')
def test_get_listings_success(mock_table):
    """Test getting all active listings"""
    mock_table.scan.return_value = {
        "Items": [mock_listing_response]
    }
    
    response = client.get("/listings/")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == mock_listing_data["title"]
    mock_table.scan.assert_called_once()

@patch('app.routers.listings.table')
def test_get_listings_database_error(mock_table):
    """Test getting listings with database error"""
    mock_table.scan.side_effect = ClientError(
        error_response={'Error': {'Code': 'InternalServerError'}},
        operation_name='Scan'
    )
    
    response = client.get("/listings/")
    
    assert response.status_code == 500
    assert "Database error" in response.json()["detail"]

@patch('app.routers.listings.get_current_user')
@patch('app.routers.listings.table')
def test_create_listing_success(mock_table, mock_current_user_dep):
    """Test creating a new listing"""
    mock_current_user_dep.return_value = mock_current_user
    mock_table.put_item.return_value = None
    
    response = client.post("/listings/", json=mock_listing_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == mock_listing_data["title"]
    assert data["owner_id"] == mock_current_user["uid"]
    assert "id" in data
    assert data["is_active"] is True
    mock_table.put_item.assert_called_once()

@patch('app.routers.listings.get_current_user')
@patch('app.routers.listings.table')
def test_create_listing_database_error(mock_table, mock_current_user_dep):
    """Test creating listing with database error"""
    mock_current_user_dep.return_value = mock_current_user
    mock_table.put_item.side_effect = ClientError(
        error_response={'Error': {'Code': 'InternalServerError'}},
        operation_name='PutItem'
    )
    
    response = client.post("/listings/", json=mock_listing_data)
    
    assert response.status_code == 500
    assert "Database error" in response.json()["detail"]

@patch('app.routers.listings.table')
def test_get_listing_success(mock_table):
    """Test getting a specific listing"""
    mock_table.get_item.return_value = {
        "Item": mock_listing_response
    }
    
    response = client.get("/listings/test-listing-id")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "test-listing-id"
    assert data["title"] == mock_listing_data["title"]
    mock_table.get_item.assert_called_once_with(Key={"id": "test-listing-id"})

@patch('app.routers.listings.table')
def test_get_listing_not_found(mock_table):
    """Test getting a non-existent listing"""
    mock_table.get_item.return_value = {"Item": None}
    
    response = client.get("/listings/non-existent-id")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Listing not found"

@patch('app.routers.listings.get_current_user')
@patch('app.routers.listings.table')
def test_update_listing_success(mock_table, mock_current_user_dep):
    """Test updating a listing"""
    mock_current_user_dep.return_value = mock_current_user
    mock_table.get_item.return_value = {
        "Item": mock_listing_response
    }
    mock_table.update_item.return_value = None
    
    update_data = {"title": "Updated Title", "price": 1600}
    response = client.put("/listings/test-listing-id", json=update_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["price"] == 1600
    mock_table.update_item.assert_called_once()

@patch('app.routers.listings.get_current_user')
@patch('app.routers.listings.table')
def test_update_listing_unauthorized(mock_table, mock_current_user_dep):
    """Test updating a listing without authorization"""
    mock_current_user_dep.return_value = mock_current_user
    # Listing owned by different user
    different_owner_listing = {**mock_listing_response, "owner_id": "different-user-id"}
    mock_table.get_item.return_value = {
        "Item": different_owner_listing
    }
    
    update_data = {"title": "Updated Title"}
    response = client.put("/listings/test-listing-id", json=update_data)
    
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to update this listing"

@patch('app.routers.listings.get_current_user')
@patch('app.routers.listings.table')
def test_delete_listing_success(mock_table, mock_current_user_dep):
    """Test deleting a listing"""
    mock_current_user_dep.return_value = mock_current_user
    mock_table.get_item.return_value = {
        "Item": mock_listing_response
    }
    mock_table.update_item.return_value = None
    
    response = client.delete("/listings/test-listing-id")
    
    assert response.status_code == 200
    assert response.json()["message"] == "Listing deleted successfully"
    mock_table.update_item.assert_called_once()

def test_create_listing_invalid_data():
    """Test creating listing with invalid data"""
    invalid_data = {
        "title": "",  # Empty title
        "price": -100,  # Negative price
        "bedrooms": "invalid"  # Wrong type
    }
    
    response = client.post("/listings/", json=invalid_data)
    
    # Should fail validation
    assert response.status_code == 422 