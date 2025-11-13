#!/usr/bin/env python3
"""
Test script for the ML Service API
Run this after starting the ml-service with docker-compose
"""

import requests
import json

# ML Service URL
ML_SERVICE_URL = "http://localhost:8000"


def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("Testing Health Check (GET /)")
    print("="*60)
    
    try:
        response = requests.get(f"{ML_SERVICE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get('status') == 'healthy':
            print("✅ Health check passed!")
            return True
        else:
            print("❌ Health check failed!")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to ML service!")
        print("Make sure the service is running: docker-compose up ml-service")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_prediction_with_sample():
    """Test prediction with a sample audio file path"""
    print("\n" + "="*60)
    print("Testing Prediction (POST /predict)")
    print("="*60)
    
    # This is just a test - in production, the backend will provide the path
    audio_path = "/app/temp_audio/sample.wav"
    
    print(f"Testing with path: {audio_path}")
    print("Note: This will fail if the file doesn't exist in the container")
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json={"audio_path": audio_path},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("\n✅ Prediction successful!")
                print(f"Predicted Emotion: {result.get('predicted_emotion')}")
                print(f"Confidence: {result.get('confidence', 0):.2%}")
            else:
                print(f"❌ Prediction failed: {result.get('error')}")
        else:
            print(f"❌ Request failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")


def test_invalid_path():
    """Test with an invalid audio file path"""
    print("\n" + "="*60)
    print("Testing with Invalid Path")
    print("="*60)
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json={"audio_path": "/nonexistent/file.wav"},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 404:
            print("✅ Correctly returned 404 for invalid path")
        else:
            print(f"⚠️  Expected 404, got {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")


def test_missing_parameter():
    """Test with missing audio_path parameter"""
    print("\n" + "="*60)
    print("Testing with Missing Parameter")
    print("="*60)
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json={},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 400:
            print("✅ Correctly returned 400 for missing parameter")
        else:
            print(f"⚠️  Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    print("\n" + "🎯" + "="*58 + "🎯")
    print(" "*15 + "ML Service API Test Suite")
    print("🎯" + "="*58 + "🎯")
    
    # Test 1: Health Check
    health_ok = test_health_check()
    
    if not health_ok:
        print("\n❌ Health check failed. Cannot proceed with other tests.")
        print("Please ensure the ML service is running:")
        print("  docker-compose up ml-service")
        return
    
    # Test 2: Prediction with sample (will likely fail without sample file)
    test_prediction_with_sample()
    
    # Test 3: Error cases
    test_invalid_path()
    test_missing_parameter()
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
    print("\nNext steps:")
    print("1. The ML service is running correctly")
    print("2. To test with real audio, upload via the backend API")
    print("3. Check docker-compose logs for more details:")
    print("   docker-compose logs -f ml-service")
    print()


if __name__ == "__main__":
    main()
