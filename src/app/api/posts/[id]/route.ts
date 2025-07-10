// src/app/api/posts/[id]/route.ts
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

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const cursor = searchParams.get('cursor');

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                stats: true,
                pollOptions: {
                    orderBy: {
                        id: 'asc',
                    },
                },
                replies: {
                    take: limit,
                    ...(cursor && {
                        skip: 1,
                        cursor: { id: parseInt(cursor, 10) },
                    }),
                    orderBy: { createdAt: 'asc' },
                    include: {
                        stats: true,
                        parentReply: {
                            select: {
                                id: true,
                                content: true,
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

        let nextReplyCursor: number | null = null;
        if (post.replies.length === limit) {
            nextReplyCursor = post.replies[post.replies.length - 1].id;
        }

        return NextResponse.json({ ...post, nextReplyCursor });
    } catch (error) {
        logger.error(`Error fetching post:`, error);
        return NextResponse.json({ error: '获取回音失败' }, { status: 500 });
    }
}
