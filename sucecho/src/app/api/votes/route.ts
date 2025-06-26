// sucecho/src/app/api/votes/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export async function POST(request: Request) {
  let body: { postId: number; voteType: 1 | -1; fingerprintHash: string; };

  try {
    body = await request.json();
    const { postId, voteType, fingerprintHash } = body;

    if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  
  try {
    const minVotesForPurification = parseInt(process.env.PURIFICATION_MIN_VOTES || '20', 10);
    const downvoteRatioForPurification = parseFloat(process.env.PURIFICATION_DOWNVOTE_RATIO || '0.7');

    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { postId_fingerprintHash: { postId: body.postId, fingerprintHash: body.fingerprintHash } },
      });

      if (existingVote) {
        // If the user is trying to cast the same vote again, do nothing.
        if (existingVote.voteType === body.voteType) {
          return { error: 'Already voted with this type', status: 409 };
        }
        // If they are changing their vote, update it.
        await tx.vote.update({
          where: { id: existingVote.id },
          data: { voteType: body.voteType },
        });
      } else {
        // If no vote exists, create a new one.
        await tx.vote.create({
          data: { postId: body.postId, fingerprintHash: body.fingerprintHash, voteType: body.voteType },
        });
      }

      // Recalculate the total votes for the post
      const upvotes = await tx.vote.count({ where: { postId: body.postId, voteType: 1 } });
      const downvotes = await tx.vote.count({ where: { postId: body.postId, voteType: -1 } });
      const hotnessScore = upvotes + downvotes;

      // Update the PostStats table with the new counts
      await tx.postStats.update({
        where: { postId: body.postId },
        data: { upvotes, downvotes, hotnessScore },
      });

      // Check if the post should be purified
      const totalVotes = upvotes + downvotes;
      if (
        totalVotes >= minVotesForPurification &&
        (downvotes / totalVotes) >= downvoteRatioForPurification
      ) {
        // Delete the post if it meets purification criteria
        await tx.post.delete({ where: { id: body.postId } });
        return { purified: true, postId: body.postId };
      }
      
      return { purified: false, postId: body.postId, stats: { upvotes, downvotes } };
    });

    // Handle the transaction result
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.purified) {
      console.log(`Post ${result.postId} has been purified by the community.`);
      eventEmitter.emit('delete_post', { postId: result.postId });
      return NextResponse.json({ message: `Post ${result.postId} purified.` });
    } 
    
    // If not purified, broadcast the vote update.
    eventEmitter.emit('update_vote', { postId: result.postId, stats: result.stats });
    return NextResponse.json({ postId: result.postId, stats: result.stats });

  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       console.warn(`Vote failed because post ${body.postId} no longer exists. It was likely purified or deleted.`);
       return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    console.error(`Error processing vote for post ${body.postId}:`, error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}

