// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma'; // <-- Import the shared client
import { NextResponse } from 'next/server';

// DO NOT create a new client here: const prisma = new PrismaClient()

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