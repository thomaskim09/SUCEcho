// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';


interface Params {
  id: string;
}

/**
 * Handles GET requests to fetch a single post and its replies.
 */
export async function GET(request: Request, context: { params: Params }) {
  try {
    const postId = parseInt(context.params.id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        // Optional: you might want to ensure you can only open threads from a top-level post
        // parentPostId: null, 
      },
      include: {
        stats: true,
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            stats: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    if (post.content === null) {
      return NextResponse.json({ error: 'This echo has faded into silence.' }, { status: 410 });
    }

    // Helper to format any post-like object into the PostWithStats structure
    const formatPostWithStats = (p: any) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      stats: {
        upvotes: p.stats?.upvotes ?? 0,
        downvotes: p.stats?.downvotes ?? 0,
        replyCount: p.replies?.length ?? 0,
      },
    });

    const responseData = {
        ...formatPostWithStats(post),
        replies: post.replies.map(formatPostWithStats),
    };


    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error fetching post ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}


/**
 * Handles POST requests to create a new post or a reply.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, fingerprintHash, parentId } = body;

    // Basic validation
    if (!content || !fingerprintHash) {
      return NextResponse.json({ error: 'Missing content or fingerprint' }, { status: 400 });
    }

    if (content.length > 400) {
      return NextResponse.json({ error: 'Content exceeds 400 characters' }, { status: 400 });
    }

    // Use a transaction to ensure creating the post and its stats is an atomic operation
    const newPost = await prisma.$transaction(async (tx) => {
        // Create the new post (or reply)
        const createdPost = await tx.post.create({
            data: {
                content,
                fingerprintHash,
                parentPostId: parentId ? Number(parentId) : null,
            },
        });

        // If it's a reply, we also need to update the reply count on the parent's stats
        if (parentId) {
            await tx.postStats.update({
                where: { postId: Number(parentId) },
                data: {
                   replyCount: {
                       increment: 1,
                   }
                },
            });
        }
        
        // Every new post gets its own stats entry
        await tx.postStats.create({
          data: {
            postId: createdPost.id,
            upvotes: 0,
            downvotes: 0,
            replyCount: 0,
            hotnessScore: 0,
          }
        });

        // Return the fully populated post for the SSE broadcast
        return tx.post.findUnique({
            where: { id: createdPost.id },
            include: {
                stats: true,
                _count: {
                  select: {
                    replies: true,
                  },
                },
            },
        });
    });
    
    if (!newPost) {
        throw new Error("Post creation failed within the database transaction.");
    }

    // Format the new post data to match the PostWithStats type for broadcasting
    const postWithStats = {
      ...newPost,
      stats: {
        upvotes: newPost.stats?.upvotes ?? 0,
        downvotes: newPost.stats?.downvotes ?? 0,
        replyCount: newPost._count.replies,
      },
    };

    // Broadcast the 'new_post' event to all connected SSE clients
    // This event is fired for both new top-level posts and new replies
    eventEmitter.emit('new_post', postWithStats);

    // Return the newly created post to the original requester
    return NextResponse.json(postWithStats, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    // Specifically handle the case where a user tries to reply to a post that was just deleted
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       return NextResponse.json({ error: 'The post you are replying to no longer exists.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
