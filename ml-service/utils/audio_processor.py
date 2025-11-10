"""Audio processing utilities"""

import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Tuple
import config

def load_audio(file_path: str) -> Tuple[np.ndarray, int]:
    """
    Load audio file and resample to target sample rate

    Args:
        file_path: Path to audio file

    Returns:
        Tuple of (audio_data, sample_rate)
    """
    try:
        # Load audio file with librosa (automatically resamples to 22050 Hz by default)
        audio, sr = librosa.load(file_path, sr=config.SAMPLE_RATE, mono=True)

        # Validate duration
        duration = len(audio) / sr
        if duration < config.MIN_AUDIO_LENGTH_SECONDS:
            raise ValueError(f"Audio too short: {duration:.2f}s (minimum {config.MIN_AUDIO_LENGTH_SECONDS}s)")

        if duration > config.MAX_AUDIO_LENGTH_SECONDS:
            # Trim to max length
            max_samples = config.MAX_AUDIO_LENGTH_SECONDS * sr
            audio = audio[:max_samples]

        return audio, sr
    except Exception as e:
        raise Exception(f"Error loading audio file: {str(e)}")

def extract_audio_features(audio: np.ndarray, sr: int) -> Dict:
    """
    Extract acoustic features from audio signal

    Args:
        audio: Audio signal array
        sr: Sample rate

    Returns:
        Dictionary of audio features
    """
    try:
        # MFCCs (Mel-frequency cepstral coefficients)
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1).tolist()
        mfcc_std = np.std(mfccs, axis=1).tolist()

        # Pitch (fundamental frequency)
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)

        pitch_mean = float(np.mean(pitch_values)) if pitch_values else 0.0
        pitch_std = float(np.std(pitch_values)) if pitch_values else 0.0

        # Energy (RMS)
        rms = librosa.feature.rms(y=audio)
        energy_mean = float(np.mean(rms))
        energy_std = float(np.std(rms))

        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)
        spectral_centroid = float(np.mean(spectral_centroids))

        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)
        spectral_rolloff_mean = float(np.mean(spectral_rolloff))

        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(audio)
        zcr_mean = float(np.mean(zcr))

        return {
            'mfcc_mean': mfcc_mean,
            'mfcc_std': mfcc_std,
            'pitch_mean': pitch_mean,
            'pitch_std': pitch_std,
            'energy_mean': energy_mean,
            'energy_std': energy_std,
            'spectral_centroid': spectral_centroid,
            'spectral_rolloff': spectral_rolloff_mean,
            'zero_crossing_rate': zcr_mean,
            'duration': float(len(audio) / sr),
        }
    except Exception as e:
        raise Exception(f"Error extracting audio features: {str(e)}")

def convert_to_wav(input_path: str, output_path: str) -> str:
    """
    Convert audio file to WAV format if needed

    Args:
        input_path: Input file path
        output_path: Output WAV file path

    Returns:
        Path to WAV file
    """
    try:
        # Load audio
        audio, sr = librosa.load(input_path, sr=config.SAMPLE_RATE, mono=True)

        # Save as WAV
        sf.write(output_path, audio, sr, subtype='PCM_16')

        return output_path
    except Exception as e:
        raise Exception(f"Error converting to WAV: {str(e)}")
