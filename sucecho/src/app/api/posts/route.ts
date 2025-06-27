// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';
import { generateCodename } from '@/lib/codename';

/**
 * Handles GET requests to fetch the main feed of posts with pagination.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');

    const posts = await prisma.post.findMany({
      take: limit,
      ...(cursor && {
        skip: 1, // Skip the cursor itself
        cursor: {
          id: parseInt(cursor, 10),
        },
      }),
      where: {
        content: { not: null },
        parentPostId: null,
      },
      // --- START OF CHANGE ---
      // We need to explicitly select all the fields we need to ensure
      // that fingerprintHash is included.
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentPostId: true,
        fingerprintHash: true, // <-- The missing piece
        stats: {
          select: {
            upvotes: true,
            downvotes: true,
            replyCount: true,
          }
        }
      },
      // --- END OF CHANGE ---
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextCursor: number | null = null;
    if (posts.length === limit) {
      nextCursor = posts[posts.length - 1].id;
    }

    return NextResponse.json({
      posts,
      nextCursor,
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}


/**
 * Handles POST requests to create a new post OR a reply.
 * (This function remains unchanged)
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

    const userProfile = await prisma.userAnonymizedProfile.findUnique({
      where: { fingerprintHash },
    });
    
    if (userProfile?.isBanned) {
        const expires = userProfile.banExpiresAt;
        if (!expires || new Date(expires) > new Date()) {
            const banLog = await prisma.adminLog.findFirst({
                where: { targetFingerprintHash: fingerprintHash, action: 'BAN' },
                orderBy: { createdAt: 'desc' },
            });
    
            let message = `You are currently banned.`;
            if (expires) {
                message += ` Your ban will expire on ${new Date(expires).toLocaleString()}.`;
            } else {
                message += ` This ban is permanent.`;
            }
            if (banLog?.reason) {
                message += ` Reason: ${banLog.reason}`;
            }
            
            return NextResponse.json({ error: message }, { status: 403 });
        }
    }

    // --- START OF NEW LOGIC ---
    // Use a transaction to ensure both post and user profile are handled together
    const newPostWithStats = await prisma.$transaction(async (tx) => {
        // Step 1: Create or update the user's anonymized profile
        await tx.userAnonymizedProfile.upsert({
            where: { fingerprintHash },
            update: {
                lastSeenAt: new Date(),
            },
            create: {
                fingerprintHash,
                codename: generateCodename(fingerprintHash),
                lastSeenAt: new Date(),
            }
        });

        // Step 2: Create the post
        const createdPost = await tx.post.create({
            data: {
                content,
                fingerprintHash,
                parentPostId: parentId ? Number(parentId) : null,
            },
        });
        
        // Step 3: Handle reply counts if it's a reply
        if (parentId) {
            await tx.postStats.upsert({
                where: { postId: Number(parentId) },
                update: { replyCount: { increment: 1 } },
                create: { 
                    postId: Number(parentId), 
                    replyCount: 1,
                }
            });
        }
        
        // Step 4: Create the stats for the new post
        const createdStats = await tx.postStats.create({
          data: {
            postId: createdPost.id,
            // default values are set in schema, but being explicit is fine
            upvotes: 0,
            downvotes: 0,
            replyCount: 0,
            hotnessScore: 0,
          }
        });

        return {
            ...createdPost,
            stats: createdStats
        };
    });
    // --- END OF NEW LOGIC ---

    eventEmitter.emit('new_post', newPostWithStats);
    
    return NextResponse.json(newPostWithStats, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       return NextResponse.json({ error: 'The post you are replying to no longer exists.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}