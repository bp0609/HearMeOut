"""
Flask ML Service for Daily Mood Journal
Provides emotion detection and speech-to-text analysis from audio files
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import traceback
from pathlib import Path

import config
from utils.audio_processor import load_audio, extract_audio_features
from utils.emotion_detector import EmotionDetector
from utils.emoji_mapper import emotions_to_emojis, get_emojis_by_category

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global model instances (loaded once at startup)
emotion_detector = None
whisper_model = None

def initialize_models():
    """Load ML models at startup"""
    global emotion_detector, whisper_model

    print("=" * 60)
    print("Initializing ML Service...")
    print("=" * 60)

    try:
        # Create model cache directory
        os.makedirs(config.MODEL_CACHE_DIR, exist_ok=True)

        # Load emotion detection model
        print("\n1. Loading emotion detection model...")
        emotion_detector = EmotionDetector()

        # Load Whisper model for speech-to-text
        print(f"\n2. Loading Whisper model (size: {config.WHISPER_MODEL_SIZE})...")
        whisper_model = whisper.load_model(
            config.WHISPER_MODEL_SIZE,
            download_root=config.MODEL_CACHE_DIR
        )
        print("✓ Whisper model loaded successfully")

        print("\n" + "=" * 60)
        print("✓ ML Service initialized successfully!")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n✗ Error initializing models: {str(e)}")
        traceback.print_exc()
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'models_loaded': emotion_detector is not None and whisper_model is not None,
        'version': '1.0.0'
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    """
    Analyze audio file for emotion and transcription

    Expected form data:
    - audio: Audio file (WAV, MP3, WEBM, etc.)
    - language: Language code (en, hi, gu) - optional

    Returns:
        JSON with emotion scores, emoji suggestions, transcription, and audio features
    """
    try:
        # Check if models are loaded
        if emotion_detector is None or whisper_model is None:
            return jsonify({
                'success': False,
                'error': 'ML models not initialized'
            }), 503

        # Get audio file from request
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400

        audio_file = request.files['audio']
        language = request.form.get('language', 'en')

        # Save uploaded file temporarily
        temp_dir = Path(config.TEMP_AUDIO_DIR)
        temp_dir.mkdir(exist_ok=True)

        temp_file_path = temp_dir / f"temp_{os.getpid()}_{audio_file.filename}"
        audio_file.save(str(temp_file_path))

        try:
            # Load and process audio
            print(f"Processing audio file: {audio_file.filename}")
            audio_data, sample_rate = load_audio(str(temp_file_path))

            # Extract audio features
            print("Extracting audio features...")
            audio_features = extract_audio_features(audio_data, sample_rate)

            # Detect emotions
            print("Detecting emotions...")
            emotion_scores = emotion_detector.predict(audio_data, sample_rate)

            # Map emotions to emojis
            suggested_emojis = emotions_to_emojis(emotion_scores, top_k=3)

            # Transcribe audio with Whisper
            print("Transcribing audio...")
            transcription_result = whisper_model.transcribe(
                str(temp_file_path),
                language=language if language != 'en' else None,
                fp16=False  # Disable FP16 for CPU compatibility
            )
            transcription = transcription_result['text'].strip()

            print(f"✓ Analysis complete: {suggested_emojis[0] if suggested_emojis else 'N/A'}")

            # Return results
            return jsonify({
                'success': True,
                'transcription': transcription,
                'emotionScores': emotion_scores[:5],  # Top 5 emotions
                'suggestedEmojis': suggested_emojis,
                'audioFeatures': audio_features,
            }), 200

        finally:
            # Clean up temporary file
            if temp_file_path.exists():
                temp_file_path.unlink()
                print(f"Deleted temp file: {temp_file_path}")

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        traceback.print_exc()

        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if config.FLASK_DEBUG else None
        }), 500

@app.route('/emojis', methods=['GET'])
def get_emojis():
    """Get available emojis grouped by category"""
    return jsonify({
        'success': True,
        'data': get_emojis_by_category()
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Initialize models before starting server
    initialize_models()

    # Start Flask server
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.FLASK_DEBUG
    )
