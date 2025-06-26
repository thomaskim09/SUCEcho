// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

/**
 * Handles GET requests to fetch the main feed of posts.
 */
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        content: { not: null },
        parentPostId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        stats: true,
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new post OR a reply.
 * This is the corrected and consolidated logic.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, fingerprintHash, parentId } = body;

    if (!content || !fingerprintHash) {
      return NextResponse.json({ error: 'Missing content or fingerprint' }, { status: 400 });
    }
    if (content.length > 400) {
      return NextResponse.json({ error: 'Content exceeds 400 characters' }, { status: 400 });
    }

    const newPostWithStats = await prisma.$transaction(async (tx) => {
        const createdPost = await tx.post.create({
            data: {
                content,
                fingerprintHash,
                parentPostId: parentId ? Number(parentId) : null,
            },
        });

        // If it's a reply, we must update the parent post's reply count.
        if (parentId) {
            // FIX: Use upsert to prevent errors if the parent post is old and lacks a stats entry.
            await tx.postStats.upsert({
                where: { postId: Number(parentId) },
                update: { replyCount: { increment: 1 } },
                create: { 
                    postId: Number(parentId), 
                    replyCount: 1, 
                    // Set default values for other fields if creating
                    upvotes: 0, 
                    downvotes: 0, 
                    hotnessScore: 0 
                }
            });
        }
        
        // Every new post or reply must get its own stats entry. This prevents future voting errors.
        const createdStats = await tx.postStats.create({
          data: {
            postId: createdPost.id,
            upvotes: 0,
            downvotes: 0,
            replyCount: 0,
            hotnessScore: 0,
          }
        });

        // Attach the newly created stats to the post object to return
        return {
            ...createdPost,
            stats: createdStats
        };
    });

    // The 'new_post' event is broadcast for both new posts and replies.
    // The frontend will determine where to place it based on the parentId.
    eventEmitter.emit('new_post', newPostWithStats);
    
    return NextResponse.json(newPostWithStats, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    // Handle the specific error for replying to a non-existent post
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       return NextResponse.json({ error: 'The post you are replying to no longer exists.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
