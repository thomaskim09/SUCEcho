// src/app/api/votes/route.ts

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import supabase, {
    MAIN_CHANNEL,
    getPostRoomChannelName,
} from '@/lib/supabase-realtime';
import { checkPurificationStatus } from '@/lib/purification';
import logger from '@/lib/logger';
import { generateCodename } from '@/lib/codename';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, voteType, fingerprintHash } = body;

        if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
            return NextResponse.json(
                { error: '请求参数无效' },
                { status: 400 }
            );
        }

        const transactionResult = await prisma.$transaction(async (tx) => {
            const userProfile = await tx.userAnonymizedProfile.upsert({
                where: { fingerprintHash },
                create: {
                    fingerprintHash,
                    codename: generateCodename(fingerprintHash),
                    lastSeenAt: new Date(),
                },
                update: {
                    lastSeenAt: new Date(),
                },
            });

            if (userProfile.isBanned) {
                if (
                    !userProfile.banExpiresAt ||
                    new Date(userProfile.banExpiresAt) > new Date()
                ) {
                    throw new Error('BANNED');
                }
            }

            const postExists = await tx.post.findUnique({
                where: { id: postId },
            });

            if (!postExists) {
                throw new Error('POST_NOT_FOUND');
            }

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

            return {
                shouldPurify,
                postId,
                stats: updatedStats,
                parentPostId: postExists.parentPostId,
            };
        });

        const isVoteStatsBroadcastEnabled =
            process.env.REALTIME_VOTE_STATS_ENABLED === 'true';
        const isGranularEnabled =
            process.env.NEXT_PUBLIC_GRANULAR_REALTIME_ENABLED === 'true';

        if (isVoteStatsBroadcastEnabled) {
            let channelName = MAIN_CHANNEL;
            if (isGranularEnabled) {
                channelName = transactionResult.parentPostId
                    ? getPostRoomChannelName(transactionResult.parentPostId)
                    : getPostRoomChannelName(transactionResult.postId);
            }

            const channel = supabase.channel(channelName);
            channel
                .send({
                    type: 'broadcast',
                    event: 'update_vote',
                    payload: {
                        postId: transactionResult.postId,
                        stats: transactionResult.stats,
                        shouldPurify: transactionResult.shouldPurify,
                    },
                })
                .then(() => {
                    supabase.removeChannel(channel);
                });
        }

        return NextResponse.json({
            postId: transactionResult.postId,
            stats: transactionResult.stats,
            purified: transactionResult.shouldPurify,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'BANNED') {
                return NextResponse.json(
                    { error: '你已被封禁，无法进行投票。' },
                    { status: 403 }
                );
            }
            if (error.message === 'POST_NOT_FOUND') {
                return NextResponse.json(
                    { error: '该回音已消失，未能计入你的投票。' },
                    { status: 410 }
                );
            }
        }

        logger.error(`Error processing vote for post:`, error);
        return NextResponse.json({ error: '投票处理失败' }, { status: 500 });
    }
}
