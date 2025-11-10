"""Configuration for ML Service"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
MODEL_CACHE_DIR = os.environ.get('MODEL_CACHE_DIR', str(BASE_DIR / 'model_cache'))
TEMP_AUDIO_DIR = os.environ.get('TEMP_AUDIO_DIR', '/app/temp_audio')

# Model configurations
EMOTION_MODEL_NAME = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
WHISPER_MODEL_SIZE = "base"  # Options: tiny, base, small, medium, large

# Emotion to emoji mapping
EMOTION_TO_EMOJI = {
    'angry': ['😠', '😡', '😤'],
    'calm': ['😌', '😇', '🙂'],
    'disgust': ['😒', '🙄', '😑'],
    'fearful': ['😰', '😨', '😱'],
    'happy': ['😊', '😄', '🥰'],
    'neutral': ['😐', '😶', '🤔'],
    'sad': ['😢', '😔', '😞'],
    'surprised': ['😮', '😯', '😲'],
}

# Audio processing parameters
SAMPLE_RATE = 16000
MAX_AUDIO_LENGTH_SECONDS = 60
MIN_AUDIO_LENGTH_SECONDS = 1

# Flask configuration
FLASK_DEBUG = os.environ.get('FLASK_ENV', 'production') == 'development'
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 8000
