// sucecho/src/app/api/admin/reports/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request: Request) {
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reportedPosts = await prisma.post.findMany({
            where: {
                reports: {
                    some: {},
                },
            },
            include: {
                // MODIFICATION: Add the stats relation to the query
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
                _count: {
                    select: { reports: true },
                },
                reports: {
                    select: {
                        fingerprintHash: true,
                        reason: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
            orderBy: {
                reports: {
                    _count: 'desc',
                },
            },
        });

        return NextResponse.json(reportedPosts);
    } catch (error) {
        logger.error('Error fetching reported posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
