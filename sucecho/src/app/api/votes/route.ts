// sucecho/src/app/api/votes/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, voteType, fingerprintHash } = body;

    if (!postId || !fingerprintHash || ![-1, 1].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    
    const minVotesForPurification = 20;
    const downvoteRatioForPurification = 0.7;

    const transactionResult = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { postId_fingerprintHash: { postId, fingerprintHash } },
      });

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // If the user clicks the same vote button, it's an "un-vote".
          await tx.vote.delete({ where: { id: existingVote.id } });
        } else {
          // If they click the other button, change their vote.
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { voteType },
          });
        }
      } else {
        // If no vote exists, create a new one.
        await tx.vote.create({
          data: { postId, fingerprintHash, voteType },
        });
      }

      // After any vote change, recalculate the totals for the post.
      const upvotes = await tx.vote.count({ where: { postId, voteType: 1 } });
      const downvotes = await tx.vote.count({ where: { postId, voteType: -1 } });
      const hotnessScore = upvotes + downvotes;

      // Use `upsert` to safely update or create the stats record. This is robust.
      const updatedStats = await tx.postStats.upsert({
        where: { postId },
        update: { upvotes, downvotes, hotnessScore },
        create: { postId, upvotes, downvotes, hotnessScore, replyCount: 0 }
      });

      // Check for community purification.
      if (updatedStats.upvotes + updatedStats.downvotes >= minVotesForPurification && 
          (updatedStats.downvotes / (updatedStats.upvotes + updatedStats.downvotes)) >= downvoteRatioForPurification) {
        await tx.post.delete({ where: { id: postId } });
        return { purified: true, postId };
      }
      
      // Return the final, complete stats object from the transaction.
      return { purified: false, postId, stats: updatedStats };
    });

    // Now, handle the result of the transaction.
    if (transactionResult.purified) {
      console.log(`Post ${transactionResult.postId} has been purified by the community.`);
      eventEmitter.emit('delete_post', { postId: transactionResult.postId });
      return NextResponse.json({ message: `Post ${transactionResult.postId} purified.` });
    }
    
    // THE KEY FIX: Emit the 'update_vote' event with the complete stats object.
    eventEmitter.emit('update_vote', { 
        postId: transactionResult.postId, 
        stats: transactionResult.stats 
    });
    
    // Also return the final stats to the original caller.
    return NextResponse.json({ postId: transactionResult.postId, stats: transactionResult.stats });

  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as Record<string, unknown>).code === 'P2025') {
       return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    console.error(`Error processing vote for post:`, error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
