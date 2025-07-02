// sucecho/src/app/api/admin/users/[fingerprint]/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';

interface Params {
    fingerprint: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { fingerprint } = await params;

        const logs = await prisma.adminLog.findMany({
            where: {
                targetFingerprintHash: fingerprint,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(logs);
    } catch (error) {
        logger.error('Failed to fetch admin logs:', error);
        return NextResponse.json(
            { message: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
