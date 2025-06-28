// sucecho/src/app/api/admin/manual-cron/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

export async function POST(request: Request) {
    // 1. Authenticate the request to ensure only an admin can run this
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];

    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Get survival time from environment variable, defaulting to 24 hours
        const survivalHours = parseInt(
            process.env.POST_SURVIVAL_HOURS || '24',
            10
        );
        const timeAgo = new Date(Date.now() - survivalHours * 60 * 60 * 1000);

        // 3. Find all posts older than the survival time.
        // We only need their IDs for the deletion query.
        const postsToDelete = await prisma.post.findMany({
            where: {
                createdAt: {
                    lt: timeAgo,
                },
            },
            select: {
                id: true,
            },
        });

        if (postsToDelete.length === 0) {
            const message = 'No posts older than 24 hours found to delete.';
            logger.log(`MANUAL CRON: ${message}`);
            return NextResponse.json({ message });
        }

        const postIdsToDelete = postsToDelete.map((p) => p.id);

        // 4. Delete the found posts. Because of the `onDelete: Cascade` in your
        // Prisma schema, this will automatically delete all related votes,
        // stats, and reports associated with these posts.
        const result = await prisma.post.deleteMany({
            where: {
                id: {
                    in: postIdsToDelete,
                },
            },
        });

        const message = `Successfully deleted ${result.count} posts (and their related data) older than 24 hours.`;
        logger.log(`MANUAL CRON: ${message}`);

        return NextResponse.json({ message });
    } catch (error) {
        logger.error('MANUAL CRON ERROR:', error);
        return NextResponse.json(
            { error: 'Manual cron job failed' },
            { status: 500 }
        );
    }
}
