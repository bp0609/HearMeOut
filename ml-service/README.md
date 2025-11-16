# ML Service - Speech Emotion Recognition

This service provides emotion detection from audio files using a pre-trained Wav2Vec2 model.

## API Endpoints

### `GET /`
Health check endpoint to verify the service is running.

**Response:**
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

### `POST /predict`
Predict emotion from an audio file.

**Request Body:**
```json
{
  "audio_path": "/app/temp_audio/user_123_1699999999_abc123.wav"
}
```

**Response:**
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

**Error Response:**
```json
{
  "success": false,
  "error": "Audio file not found: /path/to/file.wav"
}
```

## Supported Emotions

- **angry**: Anger, frustration
- **calm**: Calmness, peace
- **disgust**: Disgust, disapproval
- **fearful**: Fear, anxiety
- **happy**: Happiness, joy
- **neutral**: Neutral state
- **sad**: Sadness, sorrow
- **surprised**: Surprise, shock

## Model Information

- **Model**: wav2vec2-lg-xlsr-en-speech-emotion-recognition
- **Input**: Audio files (WAV, MP3, WebM, OGG)
- **Sampling Rate**: 16kHz
- **Framework**: PyTorch + Transformers

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

The service will be available at `http://localhost:8000`

## Environment Variables

- `FLASK_HOST`: Host to bind to (default: 0.0.0.0)
- `FLASK_PORT`: Port to run on (default: 8000)
- `FLASK_DEBUG`: Debug mode (default: False)

## Volume Mounts

The service uses a shared volume with the backend at `/app/temp_audio` to access audio files.
