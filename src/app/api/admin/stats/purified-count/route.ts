// src/app/api/admin/stats/purified-count/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const minVotes = parseInt(
            process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '10',
            10
        );
        const purificationRatio = parseFloat(
            process.env.NEXT_PUBLIC_PURIFICATION_DOWNVOTE_RATIO || '0.6'
        );
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const purifiedPosts: { count: bigint }[] = await prisma.$queryRaw`
            SELECT COUNT(p.id)
            FROM "Post" AS p
            JOIN "PostStats" AS ps ON p.id = ps."postId"
            WHERE p."createdAt" >= ${threeDaysAgo}
              AND (ps.upvotes + ps.downvotes) >= ${minVotes}
              AND ps.downvotes >= (ps.upvotes + ps.downvotes) * ${purificationRatio}
        `;

        const purifiedCount = Number(purifiedPosts[0]?.count || 0);

        return NextResponse.json({ purifiedCount });
    } catch (error) {
        logger.error('Error fetching purified post count:', error);
        return NextResponse.json(
            { error: 'Failed to fetch purified post count' },
            { status: 500 }
        );
    }
}
