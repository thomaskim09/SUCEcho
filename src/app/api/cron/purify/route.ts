// src/app/api/cron/purify/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const minVotes = parseInt(
            process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '10',
            10
        );
        const purificationRatio = parseFloat(
            process.env.NEXT_PUBLIC_PURIFICATION_DOWNVOTE_RATIO || '0.6'
        );

        // Only check posts created in the last 72 hours.
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

        // Find posts that meet the purification criteria using a raw query for the complex condition.
        const postsToPurify: { id: number }[] = await prisma.$queryRaw`
            SELECT p.id
            FROM "Post" AS p
            JOIN "PostStats" AS ps ON p.id = ps."postId"
            WHERE p."createdAt" >= ${threeDaysAgo}
              AND (ps.upvotes + ps.downvotes) >= ${minVotes}
              AND ps.downvotes >= (ps.upvotes + ps.downvotes) * ${purificationRatio}
        `;

        if (postsToPurify.length === 0) {
            logger.log(
                'CRON (Purify): No posts to purify within the last 72 hours.'
            );
            return NextResponse.json({
                message: 'No posts met the purification criteria.',
            });
        }

        const postIdsToDelete = postsToPurify.map((p) => p.id);

        // Delete the identified posts
        const result = await prisma.post.deleteMany({
            where: {
                id: {
                    in: postIdsToDelete,
                },
            },
        });

        const message = `CRON (Purify): Successfully purified and deleted ${result.count} posts.`;
        logger.log(message);
        return NextResponse.json({
            message: `Deleted ${result.count} posts.`,
        });
    } catch (error) {
        logger.error('CRON (Purify) ERROR:', error);
        return NextResponse.json(
            { error: 'Purification cron job failed' },
            { status: 500 }
        );
    }
}
