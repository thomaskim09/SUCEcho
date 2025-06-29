// sucecho/src/app/api/admin/stats/route.ts
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
        const totalUsers = await prisma.userAnonymizedProfile.count();

        // Calculate the cutoff time for 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get total number of posts
        const totalPosts = await prisma.post.count();

        // Get the count of posts created WITHIN the last 24 hours
        const postsWithin24h = await prisma.post.count({
            where: {
                createdAt: {
                    gte: twentyFourHoursAgo,
                },
            },
        });

        // This already correctly counts posts OLDER than 24 hours
        const expiredPostsCount = await prisma.post.count({
            where: {
                createdAt: {
                    lt: twentyFourHoursAgo,
                },
            },
        });

        return NextResponse.json({
            totalUsers,
            totalPosts,
            postsWithin24h,
            expiredPostsCount,
        });

        // --- END OF MODIFICATIONS ---
    } catch (error) {
        logger.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
