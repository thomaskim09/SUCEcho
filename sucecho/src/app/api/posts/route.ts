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
        // We only want posts that have not been scrubbed by the cron job
        content: {
          not: null,
        },
        // We only want top-level posts for the main feed, not replies
        parentPostId: null,
      },
      orderBy: {
        createdAt: 'desc', // Show the newest posts first
      },
      include: {
        // Include a count of the replies for each post
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Map over the posts to add the 'stats' object, which the frontend expects.
    // This simulates the full PostWithStats structure until the PostStats table is implemented.
    const postsWithStats = posts.map(post => ({
      ...post,
      stats: {
        upvotes: 0,    // Placeholder value
        downvotes: 0,  // Placeholder value
        replyCount: post._count.replies,
      },
    }));


    return NextResponse.json(postsWithStats);

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new post.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, fingerprintHash } = body;

    // Basic validation
    if (!content || !fingerprintHash) {
      return NextResponse.json({ error: 'Missing content or fingerprint' }, { status: 400 });
    }

    if (content.length > 400) {
      return NextResponse.json({ error: 'Content exceeds 400 characters' }, { status: 400 });
    }

    // Create the new post in the database
    const newPost = await prisma.post.create({
      data: {
        content,
        fingerprintHash,
      },
      // Ensure the reply count is included in the returned object
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Format the new post data to match the PostWithStats type for broadcasting
    const postWithStats = {
      ...newPost,
      stats: {
        upvotes: 0,
        downvotes: 0,
        replyCount: newPost._count.replies,
      },
    };

    // Broadcast the 'new_post' event to all connected SSE clients
    eventEmitter.emit('new_post', postWithStats);

    // Return the newly created post to the original requester
    return NextResponse.json(postWithStats, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}