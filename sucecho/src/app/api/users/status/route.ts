// sucecho/src/app/api/users/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { fingerprintHash } = await request.json();
        if (!fingerprintHash) {
            return NextResponse.json({ error: 'Fingerprint is required' }, { status: 400 });
        }

        // Find the most recent warning for this user
        const lastWarning = await prisma.adminLog.findFirst({
            where: {
                targetFingerprintHash: fingerprintHash,
                action: 'WARN',
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (lastWarning) {
            return NextResponse.json({ warning: lastWarning });
        }

        return NextResponse.json({}); // No active warnings

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch user status' }, { status: 500 });
    }
}