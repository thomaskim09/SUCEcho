// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';
import { generateCodename } from '@/lib/codename';
import logger from '@/lib/logger';

/**
 * Handles GET requests to fetch the main feed of posts with pagination.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const cursor = searchParams.get('cursor');

        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor && {
                skip: 1, // Skip the cursor itself
                cursor: {
                    id: parseInt(cursor, 10),
                },
            }),
            where: {
                content: { not: null },
                parentPostId: null,
            },
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextCursor: number | null = null;
        if (posts.length === limit) {
            nextCursor = posts[posts.length - 1].id;
        }

        return NextResponse.json({
            posts,
            nextCursor,
        });
    } catch (error) {
        logger.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // CORRECTED: Use parentPostId to match the client request body
        const body = await request.json();
        const { content, fingerprintHash, parentPostId } = body;

        if (!content || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Missing content or fingerprint' },
                { status: 400 }
            );
        }
        if (content.length > 400) {
            return NextResponse.json(
                { error: 'Content exceeds 400 characters' },
                { status: 400 }
            );
        }

        const userProfile = await prisma.userAnonymizedProfile.findUnique({
            where: { fingerprintHash },
        });

        if (userProfile?.isBanned) {
            // (Ban checking logic is correct and remains the same)
            const expires = userProfile.banExpiresAt;
            if (!expires || new Date(expires) > new Date()) {
                const banLog = await prisma.adminLog.findFirst({
                    where: {
                        targetFingerprintHash: fingerprintHash,
                        action: 'BAN',
                    },
                    orderBy: { createdAt: 'desc' },
                });
                let message = `You are currently banned.`;
                if (expires)
                    message += ` Your ban will expire on ${new Date(
                        expires
                    ).toLocaleString()}.`;
                else message += ` This ban is permanent.`;
                if (banLog?.reason) message += ` Reason: ${banLog.reason}`;
                return NextResponse.json({ error: message }, { status: 403 });
            }
        }

        // Server-side validation to prevent replying to a reply
        if (parentPostId) {
            const parentPost = await prisma.post.findUnique({
                where: { id: Number(parentPostId) },
                select: { parentPostId: true },
            });
            if (!parentPost) {
                return NextResponse.json(
                    { error: 'The post you are replying to no longer exists.' },
                    { status: 404 }
                );
            }
            if (parentPost.parentPostId !== null) {
                return NextResponse.json(
                    { error: 'You cannot reply to a comment.' },
                    { status: 400 }
                );
            }
        }

        const newPostWithStats = await prisma.$transaction(async (tx) => {
            await tx.userAnonymizedProfile.upsert({
                where: { fingerprintHash },
                update: { lastSeenAt: new Date() },
                create: {
                    fingerprintHash,
                    codename: generateCodename(fingerprintHash),
                    lastSeenAt: new Date(),
                },
            });

            const createdPost = await tx.post.create({
                data: {
                    content,
                    fingerprintHash,
                    parentPostId: parentPostId ? Number(parentPostId) : null,
                },
            });

            if (parentPostId) {
                await tx.postStats.upsert({
                    where: { postId: Number(parentPostId) },
                    update: { replyCount: { increment: 1 } },
                    create: { postId: Number(parentPostId), replyCount: 1 },
                });
            }

            const createdStats = await tx.postStats.create({
                data: {
                    postId: createdPost.id,
                    upvotes: 0,
                    downvotes: 0,
                    replyCount: 0,
                    hotnessScore: 0,
                },
            });

            return { ...createdPost, stats: createdStats };
        });

        // Emit the 'new_post' event, which is used by the post detail page
        eventEmitter.emit('new_post', newPostWithStats);

        // If it was a reply, emit an event to update the parent's stats on the main feed
        if (newPostWithStats.parentPostId) {
            const parentStats = await prisma.postStats.findUnique({
                where: { postId: newPostWithStats.parentPostId },
            });
            if (parentStats) {
                eventEmitter.emit('update_vote', {
                    postId: newPostWithStats.parentPostId,
                    stats: parentStats,
                });
            }
        }

        return NextResponse.json(newPostWithStats, { status: 201 });
    } catch (error: unknown) {
        logger.error('Error creating post:', error);
        if ((error as { code?: string }).code === 'P2025') {
            return NextResponse.json(
                { error: 'The post you are replying to no longer exists.' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}
