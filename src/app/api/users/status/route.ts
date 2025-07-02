// sucecho/src/app/api/users/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const { fingerprintHash } = await request.json();
        if (!fingerprintHash) {
            return NextResponse.json(
                { error: 'Fingerprint is required' },
                { status: 400 }
            );
        }

        // Find the most recent notification for this user that IS NOT acknowledged.
        const lastUnacknowledgedNotification = await prisma.adminLog.findFirst({
            where: {
                targetFingerprintHash: fingerprintHash,
                action: {
                    in: ['WARN', 'BAN', 'UNBAN'],
                },
                isAcknowledged: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (lastUnacknowledgedNotification) {
            return NextResponse.json({ notification: lastUnacknowledgedNotification });
        }

        // If no unacknowledged notifications are found, return an empty object.
        return NextResponse.json({});
    } catch (error) {
        logger.error('Failed to fetch user status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user status' },
            { status: 500 }
        );
    }
}
