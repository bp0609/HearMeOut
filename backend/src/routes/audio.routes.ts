// Audio Recording Routes - for viewing and managing stored audio files

import { Router, Response, Request } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../services/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { deleteAudioFile } from '../middleware/fileUpload';

const router = Router();

/**
 * GET /api/audio/recordings
 * Get all audio recordings for the authenticated user
 */
router.get(
    '/recordings',
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.auth?.userId) {
            throw new AppError(401, 'Unauthorized: Missing user authentication');
        }
        const clerkId = req.auth.userId;

        // Get user
        const user = await prisma.user.findUnique({
            where: { clerkId },
            include: {
                settings: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if user has audio storage enabled
        if (!user.settings?.audioStorageEnabled) {
            res.json({
                success: true,
                data: {
                    recordings: [],
                    message: 'Audio storage is not enabled',
                },
            });
            return;
        }

        // Get all mood entries with audio files (filter for non-null audioFilePath)
        const allEntries = await prisma.moodEntry.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                entryDate: true,
                dayOfWeek: true,
                audioFilePath: true,
                duration: true,
                language: true,
                selectedEmoji: true,
                createdAt: true,
            },
            orderBy: {
                entryDate: 'desc',
            },
        });

        // Filter out entries without audio files
        const moodEntries = allEntries.filter(entry => entry.audioFilePath !== null);

        // Format the response - filter and map recordings
        const recordings = moodEntries
            .filter((entry) => entry.audioFilePath !== null)
            .map((entry) => {
                const fullPath = path.join(process.cwd(), entry.audioFilePath!);
                const fileExists = fs.existsSync(fullPath);

                return {
                    id: entry.id,
                    entryDate: entry.entryDate,
                    dayOfWeek: entry.dayOfWeek,
                    duration: entry.duration,
                    language: entry.language,
                    selectedEmoji: entry.selectedEmoji,
                    createdAt: entry.createdAt,
                    fileExists,
                    audioFilePath: fileExists ? entry.audioFilePath : null,
                };
            });

        res.json({
            success: true,
            data: {
                recordings,
                totalCount: recordings.length,
            },
        });
    })
);

/**
 * DELETE /api/audio/recordings/:entryId
 * Delete a specific audio recording
 */
router.delete(
    '/recordings/:entryId',
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.auth?.userId) {
            throw new AppError(401, 'Unauthorized: Missing user authentication');
        }
        const clerkId = req.auth.userId;
        const { entryId } = req.params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get the mood entry
        const moodEntry = await prisma.moodEntry.findUnique({
            where: { id: entryId },
        });

        if (!moodEntry) {
            throw new AppError(404, 'Recording not found');
        }

        // Verify ownership
        if (moodEntry.userId !== user.id) {
            throw new AppError(403, 'Unauthorized to delete this recording');
        }

        // Delete the audio file from disk if it exists
        if (moodEntry.audioFilePath) {
            const fullPath = path.join(process.cwd(), moodEntry.audioFilePath);
            deleteAudioFile(fullPath);
        }

        // Update the mood entry to set audioFilePath to null
        await prisma.moodEntry.update({
            where: { id: entryId },
            data: { audioFilePath: null as any },
        });

        res.json({
            success: true,
            message: 'Audio recording deleted successfully',
        });
    })
);

export default router;
