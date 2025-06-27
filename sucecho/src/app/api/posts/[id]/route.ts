// sucecho/src/app/api/posts/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Define the expected shape of the params
interface Params {
    id: string;
}

// The { params } object's type is now a Promise that resolves to Params
export async function GET(
    request: Request,
    { params }: { params: Promise<Params> }
) {
    try {
        // **CRITICAL FIX**: Await the params object before accessing its properties.
        const { id } = await params;
        const postId = parseInt(id, 10);

        if (isNaN(postId)) {
            return NextResponse.json(
                { error: 'Invalid post ID' },
                { status: 400 }
            );
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                content: true,
                createdAt: true,
                parentPostId: true,
                fingerprintHash: true,
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        parentPostId: true,
                        fingerprintHash: true,
                        stats: {
                            select: {
                                upvotes: true,
                                downvotes: true,
                                replyCount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        if (post.content === null) {
            return NextResponse.json(
                { error: 'This echo has faded into silence.' },
                { status: 410 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error(`Error fetching post:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}
