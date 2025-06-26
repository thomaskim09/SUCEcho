// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        content: {
          not: null, // Only fetch posts that haven't been scrubbed by the cron job
        },
        parentPostId: null, // Only fetch top-level posts (not replies)
      },
      orderBy: {
        createdAt: 'desc', // Show the newest posts first
      },
      include: {
        // This part is a placeholder for when you implement the stats table.
        // For now, we'll simulate the stats.
        _count: {
          select: {
            replies: true, // Counts the number of replies
            // upvotes and downvotes will be added later
          },
        },
      },
    });

    // Simulate the full PostWithStats structure for now
    const postsWithStats = posts.map(post => ({
      ...post,
      stats: {
        upvotes: 0, // Placeholder
        downvotes: 0, // Placeholder
        replyCount: post._count.replies,
      },
    }));


    return NextResponse.json(postsWithStats);

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, fingerprintHash } = body;

    if (!content || !fingerprintHash) {
      return NextResponse.json({ error: 'Missing content or fingerprint' }, { status: 400 });
    }

    if (content.length > 400) {
      return NextResponse.json({ error: 'Content exceeds 400 characters' }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        content,
        fingerprintHash,
      },
    });

    return NextResponse.json(newPost, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}