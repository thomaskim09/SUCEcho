// sucecho/src/app/api/votes/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export async function POST(request: Request) {
  let body: { postId: number; voteType: 1 | -1; fingerprintHash: string; };

  // First, safely parse the request body.
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  
  // Now that we know 'body' is assigned, we can proceed with the main logic.
  try {
    const { postId, voteType, fingerprintHash } = body;

    if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const minVotesForPurification = parseInt(process.env.PURIFICATION_MIN_VOTES || '20', 10);
    const downvoteRatioForPurification = parseFloat(process.env.PURIFICATION_DOWNVOTE_RATIO || '0.7');

    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { postId_fingerprintHash: { postId, fingerprintHash } },
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          return { error: 'Already voted', status: 409 };
        }
        await tx.vote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      } else {
        await tx.vote.create({
          data: { postId, fingerprintHash, voteType },
        });
      }

      const upvotes = await tx.vote.count({ where: { postId, voteType: 1 } });
      const downvotes = await tx.vote.count({ where: { postId, voteType: -1 } });
      const hotnessScore = upvotes + downvotes;

      await tx.postStats.upsert({
        where: { postId },
        create: { postId, upvotes, downvotes, hotnessScore },
        update: { upvotes, downvotes, hotnessScore },
      });

      const totalVotes = upvotes + downvotes;
      const shouldPurify = 
        totalVotes >= minVotesForPurification && 
        (downvotes / totalVotes) >= downvoteRatioForPurification;

      if (shouldPurify) {
        await tx.post.delete({ where: { id: postId } });
        return { purified: true };
      }
      
      return { purified: false, upvotes, downvotes };
    });

    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.purified) {
        console.log(`Post ${postId} has been purified by the community.`);
        eventEmitter.emit('delete_post', { postId });
        return NextResponse.json({ message: `Post ${postId} purified.` });
    } 
    
    // If not purified, broadcast the vote update.
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
    // This catch block now only handles errors from the database transaction.
    // We can safely access 'body.postId' because parsing already succeeded.
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       console.warn(`Vote failed because post ${body.postId} no longer exists. It was likely purified.`);
       return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    console.error('Error processing vote:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}