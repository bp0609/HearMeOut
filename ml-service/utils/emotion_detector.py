"""Emotion detection using Hugging Face transformers"""

import torch
import torchaudio
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
from typing import List, Dict
import numpy as np
import config

class EmotionDetector:
    """Emotion detection model wrapper"""

    def __init__(self):
        """Initialize emotion detection model"""
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")

        # Load model and feature extractor
        print(f"Loading emotion model: {config.EMOTION_MODEL_NAME}")
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(
            config.EMOTION_MODEL_NAME,
            cache_dir=config.MODEL_CACHE_DIR
        ).to(self.device)

        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(
            config.EMOTION_MODEL_NAME,
            cache_dir=config.MODEL_CACHE_DIR
        )

        self.model.eval()
        print("✓ Emotion model loaded successfully")

        # Get emotion labels from model config
        self.emotion_labels = self.model.config.id2label

    def predict(self, audio: np.ndarray, sample_rate: int) -> List[Dict[str, float]]:
        """
        Predict emotion from audio

        Args:
            audio: Audio signal array
            sample_rate: Sample rate

        Returns:
            List of emotion scores [{'emotion': str, 'score': float}]
        """
        try:
            # Prepare input for model
            inputs = self.feature_extractor(
                audio,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True
            )

            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits

            # Convert to probabilities
            probs = torch.nn.functional.softmax(logits, dim=-1)
            probs = probs.cpu().numpy()[0]

            # Create emotion scores
            emotion_scores = []
            for idx, score in enumerate(probs):
                emotion = self.emotion_labels[idx]
                emotion_scores.append({
                    'emotion': emotion,
                    'score': float(score)
                })

            # Sort by score (descending)
            emotion_scores.sort(key=lambda x: x['score'], reverse=True)

            return emotion_scores

        except Exception as e:
            raise Exception(f"Error during emotion prediction: {str(e)}")

    def get_top_emotions(self, emotion_scores: List[Dict], top_k: int = 3) -> List[Dict]:
        """Get top K emotions"""
        return emotion_scores[:top_k]
