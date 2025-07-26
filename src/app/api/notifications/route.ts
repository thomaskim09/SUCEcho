// SUCEcho_packaged/src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fingerprintHash = searchParams.get('fingerprintHash');

    if (!fingerprintHash) {
        return NextResponse.json(
            { error: 'Fingerprint hash is required' },
            { status: 400 }
        );
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                recipientFingerprintHash: fingerprintHash,
            },
            include: {
                post: {
                    select: {
                        id: true,
                        content: true,
                        parentPostId: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        const replyToReplyNotifications = notifications.filter(
            (n) => n.type === 'REPLY_TO_REPLY' && n.replyId
        );
        if (replyToReplyNotifications.length > 0) {
            const replyIds = replyToReplyNotifications.map(
                (n) => n.replyId as number
            );

            const replies = await prisma.post.findMany({
                where: {
                    id: { in: replyIds },
                },
                select: {
                    id: true,
                    content: true,
                },
            });

            const repliesMap = new Map(replies.map((r) => [r.id, r.content]));

            const notificationsWithReplyContent = notifications.map(
                (notification) => {
                    if (
                        notification.type === 'REPLY_TO_REPLY' &&
                        notification.replyId &&
                        repliesMap.has(notification.replyId)
                    ) {
                        return {
                            ...notification,
                            repliedToContent: repliesMap.get(
                                notification.replyId
                            ),
                        };
                    }
                    return notification;
                }
            );

            return NextResponse.json(notificationsWithReplyContent);
        }

        return NextResponse.json(notifications);
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
