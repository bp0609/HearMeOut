"""
Flask API for Speech Emotion Recognition
This API accepts audio file paths and returns emotion predictions.
"""

from flask import Flask, request, jsonify
import torch
import torch.nn as nn
import librosa
import numpy as np
from transformers import Wav2Vec2Model, Wav2Vec2PreTrainedModel, AutoFeatureExtractor, AutoConfig
from transformers.modeling_outputs import SequenceClassifierOutput
from safetensors.torch import load_file
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Define emotion labels
EMOTIONS = ['angry', 'calm', 'disgust', 'fearful', 'happy', 'neutral', 'sad', 'surprised']
MODEL_PATH = "./wav2vec2-lg-xlsr-en-speech-emotion-recognition"
SAMPLING_RATE = 16000


# Define custom model class
class Wav2Vec2ClassificationHead(nn.Module):
    """Head for wav2vec classification task."""
    def __init__(self, config):
        super().__init__()
        self.dense = nn.Linear(config.hidden_size, config.hidden_size)
        self.dropout = nn.Dropout(config.final_dropout)
        self.out_proj = nn.Linear(config.hidden_size, config.num_labels)

    def forward(self, features):
        x = features
        x = self.dropout(x)
        x = self.dense(x)
        x = torch.tanh(x)
        x = self.dropout(x)
        x = self.out_proj(x)
        return x


class Wav2Vec2ForSpeechClassification(Wav2Vec2PreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.num_labels = config.num_labels
        self.pooling_mode = getattr(config, 'pooling_mode', 'mean')
        self.config = config

        self.wav2vec2 = Wav2Vec2Model(config)
        self.classifier = Wav2Vec2ClassificationHead(config)

        self.init_weights()

    def freeze_feature_extractor(self):
        self.wav2vec2.feature_extractor._freeze_parameters()

    def merged_strategy(self, hidden_states, mode="mean"):
        if mode == "mean":
            outputs = torch.mean(hidden_states, dim=1)
        elif mode == "sum":
            outputs = torch.sum(hidden_states, dim=1)
        elif mode == "max":
            outputs = torch.max(hidden_states, dim=1)[0]
        else:
            raise Exception("The pooling method hasn't been defined! Your pooling mode must be one of these ['mean', 'sum', 'max']")
        return outputs

    def forward(self, input_values, attention_mask=None, output_attentions=None, 
                output_hidden_states=None, return_dict=None, labels=None):
        return_dict = return_dict if return_dict is not None else self.config.use_return_dict
        outputs = self.wav2vec2(
            input_values, 
            attention_mask=attention_mask, 
            output_attentions=output_attentions, 
            output_hidden_states=output_hidden_states, 
            return_dict=return_dict
        )
        hidden_states = outputs[0]
        hidden_states = self.merged_strategy(hidden_states, mode=self.pooling_mode)
        logits = self.classifier(hidden_states)

        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits.view(-1, self.num_labels), labels.view(-1))

        if not return_dict:
            output = (logits,) + outputs[2:]
            return ((loss,) + output) if loss is not None else output

        return SequenceClassifierOutput(
            loss=loss, 
            logits=logits, 
            hidden_states=outputs.hidden_states, 
            attentions=outputs.attentions
        )


# Global variables for model and feature extractor
model = None
feature_extractor = None
device = None


def load_model():
    """Load the emotion recognition model and feature extractor."""
    global model, feature_extractor, device
    
    logger.info("Loading emotion recognition model...")
    
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Load config
    config = AutoConfig.from_pretrained(MODEL_PATH)
    
    # Create the model
    model = Wav2Vec2ForSpeechClassification(config)
    
    # Load the trained weights from safetensors
    state_dict = load_file(f"{MODEL_PATH}/model.safetensors")
    
    # Map old classifier key names to new classifier key names
    new_state_dict = {}
    for key, value in state_dict.items():
        if key == "classifier.output.weight":
            new_state_dict["classifier.out_proj.weight"] = value
        elif key == "classifier.output.bias":
            new_state_dict["classifier.out_proj.bias"] = value
        else:
            new_state_dict[key] = value
    
    # Load the mapped weights
    model.load_state_dict(new_state_dict, strict=False)
    
    # Move model to device and set to evaluation mode
    model = model.to(device)
    model.eval()
    
    # Load feature extractor
    feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_PATH)
    
    logger.info("✅ Model loaded successfully!")


def predict_emotion(audio_path):
    """
    Predict emotion from an audio file
    
    Args:
        audio_path: Path to the audio file
    
    Returns:
        Dictionary with prediction results
    """
    # Load and preprocess audio
    speech, sr = librosa.load(audio_path, sr=SAMPLING_RATE)
    
    # Extract features
    inputs = feature_extractor(speech, sampling_rate=SAMPLING_RATE, return_tensors="pt", padding=True)
    inputs = {key: val.to(device) for key, val in inputs.items()}
    
    # Make prediction
    with torch.no_grad():
        logits = model(**inputs).logits
    
    # Get probabilities
    scores = torch.nn.functional.softmax(logits, dim=1).detach().cpu().numpy()[0]
    
    # Get predicted emotion
    predicted_id = np.argmax(scores)
    predicted_emotion = EMOTIONS[predicted_id]
    confidence = float(scores[predicted_id])
    
    # Create results dictionary
    results = {
        'predicted_emotion': predicted_emotion,
        'confidence': confidence,
        'all_scores': {emotion: float(score) for emotion, score in zip(EMOTIONS, scores)}
    }
    
    return results


@app.route('/', methods=['GET'])
def home():
    """API home endpoint with usage information."""
    return jsonify({
        'message': 'Speech Emotion Recognition API',
        'version': '1.0',
        'endpoints': {
            '/': 'GET - API information',
            '/health': 'GET - Health check',
            '/predict': 'POST - Predict emotion from audio file',
        },
        'usage': {
            'endpoint': '/predict',
            'method': 'POST',
            'content_type': 'application/json',
            'body': {
                'audio_path': 'path/to/audio/file.wav'
            },
            'response': {
                'predicted_emotion': 'emotion_name',
                'confidence': 0.95,
                'all_scores': {
                    'angry': 0.01,
                    'calm': 0.02,
                    'disgust': 0.01,
                    'fearful': 0.01,
                    'happy': 0.95,
                    'neutral': 0.00,
                    'sad': 0.00,
                    'surprised': 0.00
                }
            }
        },
        'supported_emotions': EMOTIONS
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device) if device is not None else 'not initialized'
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict emotion from audio file.
    
    Request body:
        {
            "audio_path": "path/to/audio/file.wav"
        }
    
    Response:
        {
            "success": true,
            "audio_path": "path/to/audio/file.wav",
            "predicted_emotion": "happy",
            "confidence": 0.95,
            "all_scores": {
                "angry": 0.01,
                "calm": 0.02,
                ...
            }
        }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate request
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        if 'audio_path' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "audio_path" in request body'
            }), 400
        
        audio_path = data['audio_path']
        
        # Check if file exists
        if not os.path.exists(audio_path):
            return jsonify({
                'success': False,
                'error': f'Audio file not found: {audio_path}'
            }), 404
        
        # Check if it's a file (not a directory)
        if not os.path.isfile(audio_path):
            return jsonify({
                'success': False,
                'error': f'Path is not a file: {audio_path}'
            }), 400
        
        # Make prediction
        logger.info(f"Processing audio file: {audio_path}")
        results = predict_emotion(audio_path)
        
        # Return results
        response = {
            'success': True,
            'audio_path': audio_path,
            'predicted_emotion': results['predicted_emotion'],
            'confidence': results['confidence'],
            'all_scores': results['all_scores']
        }
        
        logger.info(f"Prediction: {results['predicted_emotion']} ({results['confidence']:.2%})")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Load model before starting the server
    load_model()
    
    # Run the Flask app
    # Set host='0.0.0.0' to make it accessible from other machines
    # Set debug=False in production
    app.run(host='127.0.0.1', port=5000, debug=True)
