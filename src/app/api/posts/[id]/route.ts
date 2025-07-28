// src/app/api/posts/[id]/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { Post } from '@prisma/client';
import type { PostWithStats, PostWithReplies } from '@/lib/types';

interface Params {
    id: string;
}

type RawReply = Post & {
    upvotes: number | null;
    downvotes: number | null;
    replyCount: number | null;
    averageRating: number | null;
    ratingCount: number | null;
    parentReplyContent: string | null;
    depth: number;
};

const buildReplyTree = (replies: PostWithStats[]): PostWithReplies[] => {
    const replyMap = new Map<number, PostWithReplies>();
    const topLevelReplies: PostWithReplies[] = [];

    for (const reply of replies) {
        replyMap.set(reply.id, { ...reply, replies: [] });
    }

    for (const reply of replies) {
        const replyWithNode = replyMap.get(reply.id)!;
        if (reply.parentReplyId && replyMap.has(reply.parentReplyId)) {
            const parent = replyMap.get(reply.parentReplyId)!;
            if (!parent.replies) {
                parent.replies = [];
            }
            parent.replies.push(replyWithNode);
        } else {
            topLevelReplies.push(replyWithNode);
        }
    }
    return topLevelReplies;
};

export async function GET(
    _request: Request,
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
            include: {
                stats: true,
                pollOptions: { orderBy: { id: 'asc' } },
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

        const allRepliesRaw: RawReply[] = await prisma.$queryRaw`
            WITH RECURSIVE post_thread AS (
                SELECT
                    p.*,
                    ps.upvotes, ps.downvotes, ps."replyCount", ps."averageRating", ps."ratingCount",
                    pr.content as "parentReplyContent",
                    1 as depth
                FROM "Post" p
                LEFT JOIN "PostStats" ps ON p.id = ps."postId"
                LEFT JOIN "Post" pr ON p."parentReplyId" = pr.id
                WHERE p."parentPostId" = ${postId} AND p."parentReplyId" IS NULL

                UNION ALL

                SELECT
                    p_child.*,
                    ps_child.upvotes, ps_child.downvotes, ps_child."replyCount", ps_child."averageRating", ps_child."ratingCount",
                    pr_child.content as "parentReplyContent",
                    pt.depth + 1
                FROM "Post" p_child
                JOIN post_thread pt ON p_child."parentReplyId" = pt.id
                LEFT JOIN "PostStats" ps_child ON p_child.id = ps_child."postId"
                LEFT JOIN "Post" pr_child ON p_child."parentReplyId" = pr_child.id
            )
            SELECT * FROM post_thread ORDER BY "createdAt" ASC;
        `;

        const allReplies: PostWithStats[] = allRepliesRaw.map((reply) => ({
            ...reply,
            createdAt: new Date(reply.createdAt),
            stats: {
                upvotes: reply.upvotes ?? 0,
                downvotes: reply.downvotes ?? 0,
                replyCount: reply.replyCount ?? 0,
                averageRating: reply.averageRating ?? undefined,
                ratingCount: reply.ratingCount ?? undefined,
            },
            parentReply:
                reply.parentReplyId && reply.parentReplyContent
                    ? {
                          id: reply.parentReplyId,
                          content: reply.parentReplyContent,
                      }
                    : null,
            depth: reply.depth,
        }));

        const replyTree = buildReplyTree(allReplies);

        // Correctly count all nested replies and update the main post's stats
        if (post.stats) {
            post.stats.replyCount = allReplies.length;
        }

        return NextResponse.json({ ...post, replies: replyTree });
    } catch (error) {
        logger.error(`Error fetching post:`, error);
        return NextResponse.json({ error: '获取回音失败' }, { status: 500 });
    }
}
