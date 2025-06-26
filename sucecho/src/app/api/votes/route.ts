// sucecho/src/app/api/votes/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, voteType, fingerprintHash } = body;

    // 1. Validate the input
    if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 2. Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if this user has already voted on this post
      const existingVote = await tx.vote.findUnique({
        where: {
          postId_fingerprintHash: {
            postId,
            fingerprintHash,
          },
        },
      });

      if (existingVote) {
        // If the user is trying to cast the same vote again, do nothing.
        if (existingVote.voteType === voteType) {
          return { error: 'Already voted', status: 409 };
        }
        // If the user is changing their vote, update the existing vote.
        await tx.vote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      } else {
        // If no existing vote, create a new one.
        await tx.vote.create({
          data: {
            postId,
            fingerprintHash,
            voteType,
          },
        });
      }

      // 3. Recalculate the vote counts for the post
      const upvotes = await tx.vote.count({ where: { postId, voteType: 1 } });
      const downvotes = await tx.vote.count({ where: { postId, voteType: -1 } });
      const hotnessScore = upvotes + downvotes;

      // Update the PostStats table
      await tx.postStats.upsert({
        where: { postId },
        create: { postId, upvotes, downvotes, hotnessScore },
        update: { upvotes, downvotes, hotnessScore },
      });

      return { upvotes, downvotes };
    });

    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // 4. Broadcast the updated vote counts to all clients
    const voteUpdatePayload = {
        postId,
        stats: {
            upvotes: result.upvotes,
            downvotes: result.downvotes,
        }
    }
    eventEmitter.emit('update_vote', voteUpdatePayload);


    return NextResponse.json(voteUpdatePayload);

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}