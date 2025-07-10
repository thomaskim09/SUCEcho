// src/app/api/polls/[id]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { generateCodename } from '@/lib/codename';

interface RouteParams {
    id: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { id } = await params;
        const postId = parseInt(id, 10);
        const { pollOptionId, fingerprintHash } = await request.json();

        if (isNaN(postId) || !pollOptionId || !fingerprintHash) {
            return NextResponse.json(
                { error: '请求参数无效' },
                { status: 400 }
            );
        }

        // Perform all database operations in a single transaction
        const updatedOptions = await prisma.$transaction(async (tx) => {
            // 1. Upsert the user profile to create it or update lastSeenAt
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

            // 2. Check for ban status immediately after getting the user profile
            if (userProfile.isBanned) {
                if (
                    !userProfile.banExpiresAt ||
                    new Date(userProfile.banExpiresAt) > new Date()
                ) {
                    // Throwing an error here will automatically roll back the transaction
                    throw new Error('BANNED');
                }
            }

            // 3. Check if user has already voted on this poll
            const existingVote = await tx.pollVote.findFirst({
                where: {
                    fingerprintHash,
                    pollOption: {
                        postId: postId,
                    },
                },
            });

            if (existingVote) {
                throw new Error('ALREADY_VOTED');
            }

            // 4. Record the new vote
            await tx.pollVote.create({
                data: {
                    pollOptionId,
                    fingerprintHash,
                },
            });

            // 5. Increment the vote count on the option
            await tx.pollOption.update({
                where: { id: pollOptionId },
                data: { votes: { increment: 1 } },
            });

            // 6. Return all options for the poll to update the UI
            return tx.pollOption.findMany({
                where: { postId },
                orderBy: { id: 'asc' },
            });
        });

        return NextResponse.json(updatedOptions);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'BANNED') {
                return NextResponse.json(
                    { error: '你已被封禁，无法进行投票。' },
                    { status: 403 }
                );
            }
            if (error.message === 'ALREADY_VOTED') {
                return NextResponse.json(
                    { error: '你已经投过票了。' },
                    { status: 409 }
                );
            }
        }

        const { id } = await params; // Await params again for logging
        logger.error(`Error processing poll vote for post #${id}:`, error);
        return NextResponse.json({ error: '投票处理失败' }, { status: 500 });
    }
}
