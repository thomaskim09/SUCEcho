// sucecho/src/app/api/posts/[id]/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface Params {
    id: string;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<Params> }
) {
    try {
        const { id } = await params;
        const postId = parseInt(id, 10);

        if (isNaN(postId)) {
            return NextResponse.json(
                { error: '无效的回音ID' },
                { status: 400 }
            );
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                content: true,
                createdAt: true,
                parentPostId: true,
                fingerprintHash: true,
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        parentPostId: true,
                        fingerprintHash: true,
                        stats: {
                            select: {
                                upvotes: true,
                                downvotes: true,
                                replyCount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: '未找到该回音' },
                { status: 404 }
            );
        }

        if (post.content === null) {
            return NextResponse.json(
                { error: '该回音已消失于寂静之中。' },
                { status: 410 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        logger.error(`Error fetching post:`, error);
        return NextResponse.json({ error: '获取回音失败' }, { status: 500 });
    }
}
