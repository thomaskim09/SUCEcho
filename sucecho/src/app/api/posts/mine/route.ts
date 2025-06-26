// sucecho/src/app/api/posts/mine/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Handles POST requests to fetch a specific set of posts by their IDs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postIds } = body;

    // Validate the input
    if (!Array.isArray(postIds) || postIds.length === 0 || !postIds.every(id => typeof id === 'number')) {
      return NextResponse.json({ error: 'Invalid post IDs provided' }, { status: 400 });
    }

    const posts = await prisma.post.findMany({
      where: {
        id: {
          in: postIds,
        },
        // We also check that the content is not null, so we don't show purified posts
        content: { not: null },
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
    console.error("Error fetching user's posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}