// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers24h,
            totalVotes,
            totalUpvotes,
            totalDownvotes,
            ephemeralPostsWithin24h,
            ephemeralExpiredPosts,
            totalEphemeralPosts,
            totalJobPosts,
            totalPermanentPosts,
        ] = await prisma.$transaction([
            prisma.userAnonymizedProfile.count(),
            prisma.userAnonymizedProfile.count({
                where: { lastSeenAt: { gte: twentyFourHoursAgo } },
            }),
            prisma.vote.count(),
            prisma.vote.count({ where: { voteType: 1 } }),
            prisma.vote.count({ where: { voteType: -1 } }),
            prisma.post.count({
                where: {
                    feed: 'EPHEMERAL',
                    createdAt: { gte: twentyFourHoursAgo },
                },
            }),
            prisma.post.count({
                where: {
                    feed: 'EPHEMERAL',
                    createdAt: { lt: twentyFourHoursAgo },
                },
            }),
            prisma.post.count({
                where: { feed: 'EPHEMERAL' },
            }),
            prisma.post.count({
                where: { feed: 'JOB' },
            }),
            prisma.post.count({
                where: { feed: 'PERMANENT' },
            }),
        ]);

        return NextResponse.json({
            totalUsers,
            activeUsers24h,
            totalVotes,
            totalUpvotes,
            totalDownvotes,
            ephemeralPostsWithin24h,
            ephemeralExpiredPosts,
            totalEphemeralPosts,
            totalJobPosts,
            totalPermanentPosts,
        });
    } catch (error) {
        logger.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
