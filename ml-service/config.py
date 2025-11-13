"""Configuration for ML Service"""

import os

# Model path
MODEL_PATH = "./wav2vec2-lg-xlsr-en-speech-emotion-recognition"

# Emotion labels
EMOTIONS = ['angry', 'calm', 'disgust', 'fearful', 'happy', 'neutral', 'sad', 'surprised']

# Audio processing parameters
SAMPLING_RATE = 16000

# Flask configuration
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 8000
FLASK_DEBUG = False
