// File Upload Middleware using Multer

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create temp_audio directory if it doesn't exist
const TEMP_AUDIO_DIR = path.join(process.cwd(), 'temp_audio');
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
  fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

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

/**
 * Cleans up old files in temp directory (older than 1 hour)
 * Run this periodically to prevent disk space issues
 */
export function cleanupOldAudioFiles(): void {
  try {
    const files = fs.readdirSync(TEMP_AUDIO_DIR);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(TEMP_AUDIO_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old audio file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up audio files:', error);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldAudioFiles, 30 * 60 * 1000);
