// SUCEcho_packaged/src/app/api/notifications/mark-all-as-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
    const { fingerprintHash } = await request.json();

    if (!fingerprintHash) {
        return NextResponse.json(
            { error: 'Fingerprint hash is required' },
            { status: 400 }
        );
    }

    try {
        // Changed from 'updateMany' to 'deleteMany'
        await prisma.notification.deleteMany({
            where: {
                recipientFingerprintHash: fingerprintHash,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting all notifications:', error);
        // Updated error message for clarity
        return NextResponse.json(
            { error: 'Failed to delete all notifications' },
            { status: 500 }
        );
    }
}
