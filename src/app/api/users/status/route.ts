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

        // Find the most recent warning for this user that IS NOT acknowledged.
        const lastUnacknowledgedWarning = await prisma.adminLog.findFirst({
            where: {
                targetFingerprintHash: fingerprintHash,
                action: 'WARN',
                isAcknowledged: false, // <-- This is the crucial filter
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (lastUnacknowledgedWarning) {
            return NextResponse.json({ warning: lastUnacknowledgedWarning });
        }

        // If no unacknowledged warnings are found, return an empty object.
        return NextResponse.json({});
    } catch (error) {
        logger.error('Failed to fetch user status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user status' },
            { status: 500 }
        );
    }
}
