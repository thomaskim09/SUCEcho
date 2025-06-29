// sucecho/src/app/api/votes/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';
import { checkPurificationStatus } from '@/lib/purification';
import logger from '@/lib/logger';
import { generateCodename } from '@/lib/codename';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, voteType, fingerprintHash } = body;

        if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
            return NextResponse.json(
                { error: 'Invalid request parameters' },
                { status: 400 }
            );
        }

        const userProfile = await prisma.userAnonymizedProfile.upsert({
            where: { fingerprintHash },
            create: {
                fingerprintHash,
                codename: generateCodename(fingerprintHash),
                lastSeenAt: new Date(),
            },
            update: {},
        });

        if (userProfile?.isBanned) {
            if (
                !userProfile.banExpiresAt ||
                new Date(userProfile.banExpiresAt) > new Date()
            ) {
                return NextResponse.json(
                    { error: 'You are currently banned and cannot vote.' },
                    { status: 403 }
                );
            }
        }

        const postExists = await prisma.post.findUnique({
            where: { id: postId },
        });

        if (!postExists) {
            return NextResponse.json(
                {
                    error: 'This echo vanished before your vote could be counted.',
                },
                { status: 410 }
            );
        }

        const transactionResult = await prisma.$transaction(async (tx) => {
            const existingVote = await tx.vote.findUnique({
                where: { postId_fingerprintHash: { postId, fingerprintHash } },
            });

            let upvoteChange = 0;
            let downvoteChange = 0;

            if (existingVote) {
                if (existingVote.voteType === voteType) {
                    await tx.vote.delete({ where: { id: existingVote.id } });
                    if (voteType === 1) upvoteChange = -1;
                    else downvoteChange = -1;
                } else {
                    await tx.vote.update({
                        where: { id: existingVote.id },
                        data: { voteType },
                    });
                    if (voteType === 1) {
                        upvoteChange = 1;
                        downvoteChange = -1;
                    } else {
                        upvoteChange = -1;
                        downvoteChange = 1;
                    }
                }
            } else {
                await tx.vote.create({
                    data: { postId, fingerprintHash, voteType },
                });
                if (voteType === 1) upvoteChange = 1;
                else downvoteChange = 1;
            }

            const updatedStats = await tx.postStats.update({
                where: { postId },
                data: {
                    upvotes: { increment: upvoteChange },
                    downvotes: { increment: downvoteChange },
                    hotnessScore: { increment: upvoteChange + downvoteChange },
                },
            });

            const { shouldPurify } = checkPurificationStatus(updatedStats);

            if (shouldPurify) {
                return { shouldPurify: true, postId, stats: updatedStats };
            }

            return { shouldPurify: false, postId, stats: updatedStats };
        });

        if (transactionResult.shouldPurify) {
            await prisma.post.delete({
                where: { id: transactionResult.postId },
            });
            eventEmitter.emit('update_vote', {
                postId: transactionResult.postId,
                stats: transactionResult.stats,
                shouldPurify: true,
            });
            logger.log(`[SSE] Emitting update_vote for purified post:`, {
                postId: transactionResult.postId,
                stats: transactionResult.stats,
                shouldPurify: true,
            });
            return NextResponse.json({ purified: true });
        }

        eventEmitter.emit('update_vote', {
            postId: transactionResult.postId,
            stats: transactionResult.stats,
            shouldPurify: transactionResult.shouldPurify,
        });

        return NextResponse.json({
            postId: transactionResult.postId,
            stats: transactionResult.stats,
            shouldPurify: transactionResult.shouldPurify,
        });
    } catch (error: unknown) {
        if ((error as { code?: string }).code === 'P2003') {
            return NextResponse.json(
                {
                    error: 'This echo vanished before your vote could be counted.',
                },
                { status: 410 }
            );
        }
        if (
            error instanceof Error &&
            'code' in error &&
            (error as Record<string, unknown>).code === 'P2025'
        ) {
            return NextResponse.json(
                { error: 'Post not found during update.' },
                { status: 404 }
            );
        }

        logger.error(`Error processing vote for post:`, error);
        return NextResponse.json(
            { error: 'Failed to process vote' },
            { status: 500 }
        );
    }
}
