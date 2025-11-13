// ML Service Integration

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

export interface EmotionScore {
  emotion: string;
  score: number;
}

export interface MLPredictionResponse {
  success: boolean;
  audio_path?: string;
  predicted_emotion?: string;
  confidence?: number;
  all_scores?: Record<string, number>;
  top_emotions?: EmotionScore[];
  error?: string;
}

/**
 * Convert local file path to Docker container path
 * The backend saves to ./temp_audio/ which is mapped to /app/temp_audio in the ML service container
 */
function getMLServicePath(localPath: string): string {
  // Get just the filename from the local path
  const filename = path.basename(localPath);
  // Return the path as the ML service sees it in the Docker container
  return `/app/temp_audio/${filename}`;
}

/**
 * Sends audio file path to ML service for emotion analysis
 * @param audioFilePath - Path to the audio file (local backend path)
 * @returns ML analysis results including emotion predictions
 */
export async function analyzeAudio(
  audioFilePath: string
): Promise<MLPredictionResponse> {
  try {
    // Check if file exists locally
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Convert local path to ML service container path
    const mlServicePath = getMLServicePath(audioFilePath);
    console.log(`[ML Service] Converting path: ${audioFilePath} -> ${mlServicePath}`);

    // Call ML service with audio file path
    const response = await axios.post<MLPredictionResponse>(
      `${ML_SERVICE_URL}/predict`,
      {
        audio_path: mlServicePath
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for processing
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML prediction failed');
    }

    return response.data;
  } catch (error) {
    console.error('ML Service Error:', error);

    // Return graceful fallback
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`ML service error: ${error.response.data?.error || error.message}`);
      }
      throw new Error(`ML service unavailable: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Health check for ML service
 */
export async function checkMLServiceHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`, {
      timeout: 5000,
    });
    return response.status === 200 && response.data.status === 'healthy';
  } catch (error) {
    console.error('ML Service health check failed:', error);
    return false;
  }
}
