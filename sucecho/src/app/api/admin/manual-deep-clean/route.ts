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
            process.env.POST_MAX_LIFETIME_DAYS || '180',
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
            const message = 'No posts older than 180 days found to delete.';
            logger.log(`MANUAL DEEP CLEAN: ${message}`);
            return NextResponse.json({ message });
        }

        const result = await prisma.post.deleteMany({
            where: {
                createdAt: {
                    lt: timeAgo,
                },
            },
        });

        const message = `Successfully performed deep clean, deleting ${result.count} posts (and all related data) older than ${maxLifetimeDays} days.`;
        logger.log(`MANUAL DEEP CLEAN: ${message}`);

        return NextResponse.json({ message });
    } catch (error) {
        logger.error('MANUAL DEEP CLEAN ERROR:', error);
        return NextResponse.json(
            { error: 'Manual deep clean job failed' },
            { status: 500 }
        );
    }
}
