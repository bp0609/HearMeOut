// Clerk Webhook Routes
// Handles user lifecycle events from Clerk

import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { prisma } from '../services/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Webhook event types from Clerk
interface ClerkWebhookEvent {
    type: string;
    data: {
        id: string;
        [key: string]: any;
    };
}

/**
 * POST /webhooks/clerk
 * Handles Clerk webhook events
 * 
 * Events handled:
 * - user.created: Creates user in database when they sign up
 * - user.updated: Updates user data if needed
 * - user.deleted: Removes user from database
 */
router.post(
    '/clerk',
    asyncHandler(async (req: Request, res: Response) => {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
            throw new AppError(500, 'Webhook secret not configured');
        }

        // Get the headers
        const svix_id = req.headers['svix-id'] as string;
        const svix_timestamp = req.headers['svix-timestamp'] as string;
        const svix_signature = req.headers['svix-signature'] as string;

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            throw new AppError(400, 'Missing Svix headers');
        }

        // Get the body
        const payload = req.body;
        // Convert Buffer to string if necessary
        const body = Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload);

        // Create a new Svix instance with your webhook secret
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt: ClerkWebhookEvent;

        // Verify the webhook signature
        try {
            evt = wh.verify(body, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            }) as ClerkWebhookEvent;
        } catch (err) {
            console.error('Error verifying webhook:', err);
            throw new AppError(400, 'Invalid webhook signature');
        }

        // Handle the webhook event
        const eventType = evt.type;
        console.log(`Received Clerk webhook: ${eventType}`, {
            userId: evt.data.id,
        });

        try {
            switch (eventType) {
                case 'user.created':
                    await handleUserCreated(evt.data);
                    break;

                case 'user.updated':
                    await handleUserUpdated(evt.data);
                    break;

                case 'user.deleted':
                    await handleUserDeleted(evt.data);
                    break;

                default:
                    console.log(`Unhandled webhook event type: ${eventType}`);
            }

            res.status(200).json({ success: true, message: 'Webhook processed' });
        } catch (error) {
            console.error(`Error processing webhook ${eventType}:`, error);
            throw new AppError(500, 'Failed to process webhook');
        }
    })
);

/**
 * Handle user.created event
 * Creates user in database when they sign up in Clerk
 */
async function handleUserCreated(data: any): Promise<void> {
    const clerkId = data.id;

    console.log(`Creating user in database: ${clerkId}`);

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (existingUser) {
            console.log(`User ${clerkId} already exists, skipping creation`);
            return;
        }

        // Create user with default settings
        const user = await prisma.user.create({
            data: {
                clerkId,
                settings: {
                    create: {
                        reminderEnabled: false,
                        interventionThreshold: 5,
                        cloudStorageEnabled: false,
                        preferredLanguage: 'en',
                    },
                },
            },
            include: {
                settings: true,
            },
        });

        console.log(`✓ User created successfully:`, {
            id: user.id,
            clerkId: user.clerkId,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error(`Error creating user ${clerkId}:`, error);
        throw error;
    }
}

/**
 * Handle user.updated event
 * Currently a no-op, but can be extended to sync user data
 */
async function handleUserUpdated(data: any): Promise<void> {
    const clerkId = data.id;
    console.log(`User updated: ${clerkId} (no action taken)`);

    // You can add logic here to update user data if needed
    // For example, sync email, name, profile picture, etc.
}

/**
 * Handle user.deleted event
 * Removes user and all associated data from database
 */
async function handleUserDeleted(data: any): Promise<void> {
    const clerkId = data.id;

    console.log(`Deleting user from database: ${clerkId}`);

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            console.log(`User ${clerkId} not found, skipping deletion`);
            return;
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { clerkId },
        });

        console.log(`✓ User deleted successfully: ${clerkId}`);
    } catch (error) {
        console.error(`Error deleting user ${clerkId}:`, error);
        throw error;
    }
}

export default router;
