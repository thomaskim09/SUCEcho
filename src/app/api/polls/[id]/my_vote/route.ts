// SUCEcho_packaged/src/app/api/polls/[id]/my_vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

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
        const { fingerprintHash } = await request.json();

        if (isNaN(postId) || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Invalid postId or fingerprint' },
                { status: 400 }
            );
        }

        const pollVote = await prisma.pollVote.findFirst({
            where: {
                fingerprintHash,
                pollOption: {
                    postId: postId,
                },
            },
            select: {
                pollOptionId: true,
            },
        });

        return NextResponse.json({
            votedOptionId: pollVote ? pollVote.pollOptionId : null,
        });
    } catch (error) {
        const { id } = await params;
        logger.error(`Error fetching user poll vote for post #${id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch user poll vote' },
            { status: 500 }
        );
    }
}
