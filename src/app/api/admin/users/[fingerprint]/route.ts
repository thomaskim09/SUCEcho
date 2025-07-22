// sucecho/src/app/api/admin/users/[fingerprint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

interface Params {
    fingerprint: string;
}

/**
 * Handles GET requests to fetch details, logs, and recent posts for a specific user profile.
 * This version uses separate database calls to avoid schema relation requirements,
 * preserving data integrity by not requiring a migration.
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

        // 1. Fetch the user profile
        const user = await prisma.userAnonymizedProfile.findUnique({
            where: { fingerprintHash: userFingerprint },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // 2. Fetch recent posts for that user in a separate query
        const posts = await prisma.post.findMany({
            where: {
                fingerprintHash: userFingerprint,
            },
            include: {
                stats: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // 3. Fetch admin logs for that user in a separate query
        const adminLogs = await prisma.adminLog.findMany({
            where: {
                targetFingerprintHash: userFingerprint,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // 4. Combine the results into a single response object
        const userProfile = {
            ...user,
            posts,
            adminLogs,
        };

        return NextResponse.json(userProfile, { status: 200 });
    } catch (error) {
        logger.error('Error fetching user details:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
