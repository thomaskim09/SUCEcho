// sucecho/src/app/api/posts/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(request: Request, context: { params: Params }) {
  try {
    const postId = parseInt(context.params.id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      // --- START OF CHANGE ---
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentPostId: true,
        fingerprintHash: true, // <-- The missing piece for the main post
        stats: {
          select: { upvotes: true, downvotes: true, replyCount: true }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            parentPostId: true,
            fingerprintHash: true, // <-- The missing piece for the replies
            stats: {
              select: { upvotes: true, downvotes: true, replyCount: true }
            }
          }
        },
      },
      // --- END OF CHANGE ---
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    if (post.content === null) {
      return NextResponse.json({ error: 'This echo has faded into silence.' }, { status: 410 });
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error(`Error fetching post ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}