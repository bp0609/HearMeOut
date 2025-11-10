// ML Service Integration

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { MLAnalysisResponse } from '../types';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends audio file to ML service for emotion analysis
 * @param audioFilePath - Path to the temporary audio file
 * @param language - Language of the recording (en, hi, gu)
 * @returns ML analysis results including transcription and emotion scores
 */
export async function analyzeAudio(
  audioFilePath: string,
  language: string = 'en'
): Promise<MLAnalysisResponse> {
  try {
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Create form data
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath));
    formData.append('language', language);

    // Call ML service
    const response = await axios.post<MLAnalysisResponse>(
      `${ML_SERVICE_URL}/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout for processing
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML analysis failed');
    }

    return response.data;
  } catch (error) {
    console.error('ML Service Error:', error);

    // Return graceful fallback
    if (axios.isAxiosError(error)) {
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
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('ML Service health check failed:', error);
    return false;
  }
}
