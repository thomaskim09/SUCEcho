// sucecho/src/app/api/admin/manual-cron/route.ts

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
        const survivalHours = parseInt(
            process.env.NEXT_PUBLIC_POST_SURVIVAL_HOURS || '24',
            10
        );
        const timeAgo = new Date(Date.now() - survivalHours * 60 * 60 * 1000);

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
            const message = `没有发现超过 ${survivalHours} 小时的过期帖子。`;
            logger.log(`MANUAL CRON: ${message}`);
            return NextResponse.json({
                message,
                deletedCount: 0,
                survivalHours,
            });
        }

        const postIdsToDelete = postsToDelete.map((p) => p.id);

        const result = await prisma.post.deleteMany({
            where: {
                id: {
                    in: postIdsToDelete,
                },
            },
        });

        const message = `成功删除了 ${result.count} 个发布于 ${survivalHours} 小时前的帖子。`;
        logger.log(`MANUAL CRON: ${message}`);
        return NextResponse.json({
            message,
            deletedCount: result.count,
            survivalHours,
        });
    } catch (error) {
        logger.error('MANUAL CRON ERROR:', error);
        return NextResponse.json(
            { error: 'Manual cron job failed' },
            { status: 500 }
        );
    }
}
