// File Upload Middleware using Multer

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create temp_audio directory if it doesn't exist
// In Docker, set the TEMP_AUDIO_DIR environment variable to /app/temp_audio; for local development, it defaults to ./temp_audio
const TEMP_AUDIO_DIR = process.env.TEMP_AUDIO_DIR || path.join(process.cwd(), 'temp_audio');
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

console.log(`📁 Audio files will be stored in: ${TEMP_AUDIO_DIR}`);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_random.wav
    const userId = (req as any).auth?.userId || 'anonymous';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = path.extname(file.originalname) || '.wav';
    cb(null, `${userId}_${timestamp}_${random}${extension}`);
  },
});

// File filter - only accept audio files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'audio/wav',
    'audio/wave',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp3',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only audio files are allowed. Received: ${file.mimetype}`));
  }
};

// Configure multer
export const audioUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Deletes a file from the temp directory
 */
export function deleteAudioFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted audio file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting audio file ${filePath}:`, error);
  }
}
