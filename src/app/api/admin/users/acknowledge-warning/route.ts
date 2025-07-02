// sucecho/src/app/api/users/acknowledge-warning/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { fingerprintHash } = await request.json();
        if (!fingerprintHash) {
            return NextResponse.json(
                { error: 'Fingerprint is required' },
                { status: 400 }
            );
        }

        // Find the most recent unacknowledged warning
        const lastWarning = await prisma.adminLog.findFirst({
            where: {
                targetFingerprintHash: fingerprintHash,
                action: 'WARN',
                isAcknowledged: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (lastWarning) {
            await prisma.adminLog.update({
                where: { id: lastWarning.id },
                data: { isAcknowledged: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: 'Failed to acknowledge warning' },
            { status: 500 }
        );
    }
}
