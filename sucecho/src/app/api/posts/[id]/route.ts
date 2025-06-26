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
      where: { id: postId },
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

    // The data is already in the correct format, so we can return it directly.
    return NextResponse.json(post);

  } catch (error) {
    console.error(`Error fetching post ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// The POST handler that was here has been removed as its logic is now
// consolidated in /api/posts/route.ts to handle both new posts and replies.
