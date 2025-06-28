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

        const postsToNullify = await prisma.post.findMany({
            where: {
                createdAt: {
                    lt: timeAgo, // 'lt' means "less than"
                },
                content: {
                    not: null, // Only find posts that haven't been nullified yet
                },
            },
            select: {
                id: true, // We only need the IDs
            },
        });

        if (postsToNullify.length === 0) {
            logger.log('CRON: No posts needed to be nullified.');
            return NextResponse.json({ message: 'No posts to nullify.' });
        }

        const postIdsToNullify = postsToNullify.map((p) => p.id);

        // 3. Update the found posts to set their content to null
        const result = await prisma.post.updateMany({
            where: {
                id: {
                    in: postIdsToNullify,
                },
            },
            data: {
                content: null, // This is the "destruction"
            },
        });

        logger.log(
            `CRON: Successfully nullified content for ${result.count} posts.`
        );

        return NextResponse.json({
            message: 'Cron job completed successfully.',
            nullifiedCount: result.count,
        });
    } catch (error) {
        logger.error('CRON ERROR:', error);
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
    }
}
