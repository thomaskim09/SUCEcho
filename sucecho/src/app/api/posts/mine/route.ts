// sucecho/src/app/api/posts/mine/route.ts
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postIds } = body;

        if (
            !Array.isArray(postIds) ||
            postIds.length === 0 ||
            !postIds.every((id) => typeof id === 'number')
        ) {
            return NextResponse.json(
                { error: 'Invalid post IDs provided' },
                { status: 400 }
            );
        }

        const posts = await prisma.post.findMany({
            where: {
                id: { in: postIds },
                content: { not: null },
            },
            // --- START OF CHANGE ---
            select: {
                id: true,
                content: true,
                createdAt: true,
                parentPostId: true,
                fingerprintHash: true, // <-- The missing piece
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
            },
            // --- END OF CHANGE ---
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        logger.error("Error fetching user's posts:", error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}
