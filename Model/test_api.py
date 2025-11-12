"""
Test script for the Speech Emotion Recognition API
This script demonstrates how to make API calls to the Flask application.
"""

import requests
import json
import os

# API base URL (update if running on a different host/port)
API_BASE_URL = "http://127.0.0.1:5000"


def test_home():
    """Test the home endpoint."""
    print("\n" + "="*60)
    print("Testing Home Endpoint")
    print("="*60)
    
    response = requests.get(f"{API_BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")


def test_health():
    """Test the health check endpoint."""
    print("\n" + "="*60)
    print("Testing Health Check Endpoint")
    print("="*60)
    
    response = requests.get(f"{API_BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")


def test_prediction(audio_path):
    """Test the prediction endpoint."""
    print("\n" + "="*60)
    print("Testing Prediction Endpoint")
    print("="*60)
    print(f"Audio file: {audio_path}")
    
    # Prepare request data
    data = {
        "audio_path": audio_path
    }
    
    # Make API request
    response = requests.post(
        f"{API_BASE_URL}/predict",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    
    # Parse and display response
    result = response.json()
    print(f"Response:\n{json.dumps(result, indent=2)}")
    
    # Display results in a more readable format
    if result.get('success'):
        print("\n" + "-"*60)
        print(f"Predicted Emotion: {result['predicted_emotion']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print("\nAll emotion scores:")
        for emotion, score in sorted(result['all_scores'].items(), key=lambda x: x[1], reverse=True):
            print(f"  {emotion:12s}: {score:.2%}")
        print("-"*60)


def test_invalid_path():
    """Test with an invalid audio file path."""
    print("\n" + "="*60)
    print("Testing with Invalid Audio Path")
    print("="*60)
    
    data = {
        "audio_path": "/path/to/nonexistent/file.wav"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/predict",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")


def test_missing_parameter():
    """Test with missing audio_path parameter."""
    print("\n" + "="*60)
    print("Testing with Missing Parameter")
    print("="*60)
    
    data = {}
    
    response = requests.post(
        f"{API_BASE_URL}/predict",
        json=data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    print("\n" + "🎯" + "="*58 + "🎯")
    print(" "*15 + "Speech Emotion Recognition API Test")
    print("🎯" + "="*58 + "🎯")
    
    try:
        # Test basic endpoints
        test_home()
        test_health()
        
        # Test prediction with a valid audio file (update path as needed)
        # Replace 'angry.mp3' with an actual audio file path in your directory
        audio_file = "angry.mp3"
        
        if os.path.exists(audio_file):
            test_prediction(audio_file)
        else:
            print(f"\n⚠️  Audio file '{audio_file}' not found.")
            print("Please update the 'audio_file' variable in the script with a valid audio file path.")
            print("You can still test with an absolute path:")
            
            # Example with absolute path (uncomment and update)
            # test_prediction("/absolute/path/to/your/audio/file.wav")
        
        # Test error cases
        test_invalid_path()
        test_missing_parameter()
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to the API server.")
        print("Make sure the Flask app is running on http://127.0.0.1:5000")
        print("Run the API server with: python app.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
