// SUCEcho_packaged/src/app/api/notifications/[id]/mark-as-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface Params {
    id: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    try {
        const { id } = await params;
        const notificationId = parseInt(id, 10);

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: 'Invalid notification ID' },
                { status: 400 }
            );
        }

        try {
            // Changed from 'update' to 'delete'
            await prisma.notification.delete({
                where: {
                    id: notificationId,
                },
            });
        } catch (error: unknown) {
            // If the error is that the record was not found, it means it was already deleted, which is fine.
            if ((error as { code?: string }).code !== 'P2025') {
                throw error;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        // Updated error message for clarity
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
