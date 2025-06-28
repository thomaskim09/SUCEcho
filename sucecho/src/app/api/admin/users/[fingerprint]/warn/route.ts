// sucecho/src/app/api/admin/users/[fingerprint]/warn/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(
    request: NextRequest,
    { params }: { params: { fingerprint: string } }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');

    // Ensure an admin is making the request
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { fingerprint: targetFingerprintHash } = await params;
    const { reason } = await request.json();

    if (!targetFingerprintHash) {
        return NextResponse.json(
            { message: 'User fingerprint is required' },
            { status: 400 }
        );
    }
    if (!reason) {
        return NextResponse.json(
            { message: 'A reason for the warning is required' },
            { status: 400 }
        );
    }

    try {
        const log = await prisma.adminLog.create({
            data: {
                targetFingerprintHash,
                action: 'WARN',
                reason,
                adminId: adminUser.username, // Log which admin took the action
            },
        });
        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        logger.error('Failed to create warning log:', error);
        return NextResponse.json(
            { message: 'Failed to issue warning' },
            { status: 500 }
        );
    }
}
