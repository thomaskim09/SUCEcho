// src/app/api/posts/mine/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fingerprintHash, limit = 10, cursor } = body;

        if (!fingerprintHash) {
            return NextResponse.json(
                { error: 'Fingerprint hash is required' },
                { status: 400 }
            );
        }

        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: {
                    id: cursor,
                },
            }),
            where: {
                fingerprintHash: fingerprintHash,
                content: { not: null },
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                parentPostId: true,
                fingerprintHash: true,
                contentType: true,
                feed: true,
                url: true,
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                        averageRating: true,
                        ratingCount: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextCursor: number | null = null;
        if (posts.length === limit) {
            nextCursor = posts[posts.length - 1].id;
        }

        return NextResponse.json({ posts, nextCursor });
    } catch (error) {
        logger.error("Error fetching user's posts:", error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}
