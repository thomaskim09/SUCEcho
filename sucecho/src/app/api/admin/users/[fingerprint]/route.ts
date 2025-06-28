// sucecho/src/app/api/admin/users/[fingerprint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

interface Params {
    fingerprint: string;
}

/**
 * Handles GET requests to fetch details for a specific user profile based on their fingerprint.
 * The function signature has been updated to correctly destructure params.
 */
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
        const { fingerprint: userFingerprint } = await params;

        if (!userFingerprint) {
            return NextResponse.json(
                { message: 'User fingerprint is required' },
                { status: 400 }
            );
        }

        const user = await prisma.userAnonymizedProfile.findUnique({
            where: { fingerprintHash: userFingerprint },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        logger.error('Error fetching user details:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
