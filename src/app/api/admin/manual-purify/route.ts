// src/app/api/admin/manual-purify/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

export async function POST(request: Request) {
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

        const postsToPurify: { id: number }[] = await prisma.$queryRaw`
            SELECT p.id
            FROM "Post" AS p
            JOIN "PostStats" AS ps ON p.id = ps."postId"
            WHERE p."createdAt" >= ${threeDaysAgo} 
              AND (ps.upvotes + ps.downvotes) >= ${minVotes}
              AND ps.downvotes >= (ps.upvotes + ps.downvotes) * ${purificationRatio}
        `;

        if (postsToPurify.length === 0) {
            const message = `没有发现过去 3 天内符合净化标准的帖子。`;
            logger.log(`MANUAL PURIFY: ${message}`);
            return NextResponse.json({
                message,
                deletedCount: 0,
            });
        }

        const postIdsToDelete = postsToPurify.map((p) => p.id);

        const result = await prisma.post.deleteMany({
            where: {
                id: {
                    in: postIdsToDelete,
                },
            },
        });

        const message = `成功净化并删除了 ${result.count} 个发布于 3 天内的帖子。`;
        logger.log(`MANUAL PURIFY: ${message}`);
        return NextResponse.json({
            message,
            deletedCount: result.count,
        });
    } catch (error) {
        logger.error('MANUAL PURIFY ERROR:', error);
        return NextResponse.json(
            { error: 'Manual purify job failed' },
            { status: 500 }
        );
    }
}
