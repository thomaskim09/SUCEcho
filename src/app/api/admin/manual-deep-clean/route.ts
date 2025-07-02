// sucecho/src/app/api/admin/manual-deep-clean/route.ts

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
        const maxLifetimeDays = parseInt(
            process.env.NEXT_PUBLIC_POST_MAX_LIFETIME_DAYS || '180',
            10
        );
        const timeAgo = new Date();
        timeAgo.setDate(timeAgo.getDate() - maxLifetimeDays);

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
            const message = `没有发现超过 ${maxLifetimeDays} 天的帖子可供深度清理。`;
            logger.log(`MANUAL DEEP CLEAN: ${message}`);
            return NextResponse.json({
                message,
                deletedCount: 0,
                maxLifetimeDays,
            });
        }

        const result = await prisma.post.deleteMany({
            where: {
                createdAt: {
                    lt: timeAgo,
                },
            },
        });

        const message = `成功深度清理，删除了 ${result.count} 个发布于 ${maxLifetimeDays} 天前的帖子。`;
        logger.log(`MANUAL DEEP CLEAN: ${message}`);
        return NextResponse.json({
            message,
            deletedCount: result.count,
            maxLifetimeDays,
        });
    } catch (error) {
        logger.error('MANUAL DEEP CLEAN ERROR:', error);
        return NextResponse.json(
            { error: 'Manual deep clean job failed' },
            { status: 500 }
        );
    }
}
