#!/usr/bin/env python3
"""
Manual API testing script
Run this after starting the FastAPI server with: python -m uvicorn app.main:app --reload
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_docs():
    """Test that docs are accessible"""
    print("\n🔍 Testing API documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"Status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_listings_endpoint():
    """Test the listings endpoint"""
    print("\n🔍 Testing listings endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/listings/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            listings = response.json()
            print(f"Found {len(listings)} listings")
        else:
            print(f"Response: {response.text}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_create_listing():
    """Test creating a listing (will fail without auth)"""
    print("\n🔍 Testing create listing (should fail without auth)...")
    listing_data = {
        "title": "Test Apartment",
        "description": "A beautiful test apartment",
        "price": 1500,
        "location": "Test City, CA",
        "bedrooms": 2,
        "bathrooms": 1,
        "available_from": "2024-01-01",
        "available_until": "2024-12-31"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/listings/", json=listing_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        # Should fail with 401 or 422 due to missing auth
        return response.status_code in [401, 422]
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_auth_endpoints():
    """Test auth endpoints (will fail without proper setup)"""
    print("\n🔍 Testing auth endpoints...")
    
    # Test user creation
    user_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/users", json=user_data)
        print(f"Create user status: {response.status_code}")
        print(f"Create user response: {response.text}")
    except Exception as e:
        print(f"Create user error: {e}")
    
    # Test getting current user (should fail without auth)
    try:
        response = requests.get(f"{BASE_URL}/auth/users/me")
        print(f"Get current user status: {response.status_code}")
        print(f"Get current user response: {response.text}")
    except Exception as e:
        print(f"Get current user error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting API tests...")
    print(f"Testing against: {BASE_URL}")
    
    tests = [
        ("Health Check", test_health_check),
        ("API Documentation", test_docs),
        ("Listings Endpoint", test_listings_endpoint),
        ("Create Listing", test_create_listing),
        ("Auth Endpoints", test_auth_endpoints),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append((test_name, False))
    
    print(f"\n{'='*50}")
    print("TEST RESULTS SUMMARY")
    print('='*50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main() 