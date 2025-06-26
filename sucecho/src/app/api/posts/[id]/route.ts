// sucecho/src/app/api/posts/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
        // Ensure we are fetching a top-level post
        parentPostId: null,
      },
      include: {
        stats: true, // Include the full stats object
        replies: {
          orderBy: {
            createdAt: 'asc', // Show replies in chronological order
          },
          include: {
            stats: true, // Include stats for each reply
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    if (post.content === null) {
      return NextResponse.json({ error: 'This echo has faded away.' }, { status: 410 }); // 410 Gone
    }

    // Manually construct the PostWithStats type for the main post and its replies
    const formatPost = (p: any) => ({
        ...p,
        stats: {
            upvotes: p.stats?.upvotes ?? 0,
            downvotes: p.stats?.downvotes ?? 0,
            replyCount: p.replies?.length ?? 0,
        },
    });

    const postWithStats = formatPost(post);
    postWithStats.replies = post.replies.map(formatPost);


    return NextResponse.json(postWithStats);

  } catch (error) {
    console.error(`Error fetching post ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}