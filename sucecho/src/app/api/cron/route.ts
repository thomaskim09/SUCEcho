// sucecho/src/app/api/cron/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // 1. Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Get survival time from environment variable, defaulting to 24 hours
        const survivalHours = parseInt(
            process.env.POST_SURVIVAL_HOURS || '24',
            10
        );
        const timeAgo = new Date(Date.now() - survivalHours * 60 * 60 * 1000);

        // 3. Find all posts (and their replies) older than the survival time
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
            logger.log('CRON: No expired posts to delete.');
            return NextResponse.json({
                message: 'No expired posts to delete.',
            });
        }

        const postIdsToDelete = postsToDelete.map((p) => p.id);

        // 4. Delete the posts. Prisma's cascading delete will handle related data.
        const result = await prisma.post.deleteMany({
            where: {
                id: {
                    in: postIdsToDelete,
                },
            },
        });

        const message = `CRON: Successfully deleted ${result.count} posts and their related votes, stats, and reports.`;
        logger.log(message);

        return NextResponse.json({
            message: `Deleted ${result.count} posts.`,
        });
    } catch (error) {
        logger.error('CRON ERROR:', error);
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
    }
}
