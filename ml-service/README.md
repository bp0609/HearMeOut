# ML Service - Speech Emotion Recognition

Flask API for emotion detection from audio files using a pre-trained Wav2Vec2 model.

## Prerequisites

Ensure the pre-trained model files exist in `wav2vec2-lg-xlsr-en-speech-emotion-recognition/`:
- `config.json`
- `model.safetensors`
- `preprocessor_config.json`

## API Endpoints

### Health Check

**Endpoint:** `GET /`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "Speech Emotion Recognition API",
  "version": "1.0.0",
  "model_loaded": true,
  "device": "cpu",
  "supported_emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"]
}
```

### Predict Emotion

**Endpoint:** `POST /predict`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "audio_path": "/app/temp_audio/user_123_1699999999_abc123.wav"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "audio_path": "/app/temp_audio/user_123_1699999999_abc123.wav",
  "predicted_emotion": "happy",
  "confidence": 0.85,
  "all_scores": {
    "angry": 0.02,
    "calm": 0.05,
    "disgust": 0.01,
    "fearful": 0.01,
    "happy": 0.85,
    "neutral": 0.03,
    "sad": 0.02,
    "surprised": 0.01
  },
  "top_emotions": [
    {"emotion": "happy", "score": 0.85},
    {"emotion": "calm", "score": 0.05},
    {"emotion": "neutral", "score": 0.03}
  ]
}
```

**Error Responses:**

`400 Bad Request` - Missing or invalid parameters
```json
{
  "success": false,
  "error": "Missing \"audio_path\" in request body"
}
```

`404 Not Found` - Audio file doesn't exist
```json
{
  "success": false,
  "error": "Audio file not found: /path/to/file.wav"
}
```

`500 Internal Server Error` - Processing error
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Supported Emotions

`angry` | `calm` | `disgust` | `fearful` | `happy` | `neutral` | `sad` | `surprised`

## Model Details

- **Model:** wav2vec2-lg-xlsr-en-speech-emotion-recognition
- **Supported Formats:** WAV, MP3, WebM, OGG
- **Sampling Rate:** 16kHz
- **Framework:** PyTorch + Transformers

## Running the Service

### Initial Step

Download the model from given OneDrive Link and extract the .zip file in `ml-service/` folder.

[OneDrive Link](https://iitgnacin-my.sharepoint.com/:u:/g/personal/22110098_iitgn_ac_in1/ERKzT030GVdHo8w0YrRFEvABpVxMuRPxxTZjXlU1SLsi7w?e=ppMZGc)


### Development
```bash
python app.py
```

### Docker
```bash
docker-compose up ml-service
```
Service runs at `http://localhost:8000`

### Development
```bash
pip install -r requirements.txt
python app.py
```

## Backend Integration

- **Service URL (Docker):** `http://ml-service:8000`
- **Environment Variable:** `ML_SERVICE_URL` (default: `http://ml-service:8000`)
- **Shared Volume:** `/app/temp_audio` ↔ `./backend/temp_audio`

Backend converts local file paths to container paths before sending requests.

## Testing

```bash
python ml-service/test_api.py
```

Tests health check, predictions, and error handling.
