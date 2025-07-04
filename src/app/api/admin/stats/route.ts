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

        const [totalUsers, totalPosts, postsWithin24h, expiredPostsCount] =
            await prisma.$transaction([
                prisma.userAnonymizedProfile.count(),
                prisma.post.count(),
                prisma.post.count({
                    where: {
                        createdAt: {
                            gte: twentyFourHoursAgo,
                        },
                    },
                }),
                prisma.post.count({
                    where: {
                        createdAt: {
                            lt: twentyFourHoursAgo,
                        },
                    },
                }),
            ]);

        return NextResponse.json({
            totalUsers,
            totalPosts,
            postsWithin24h,
            expiredPostsCount,
        });
    } catch (error) {
        logger.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
