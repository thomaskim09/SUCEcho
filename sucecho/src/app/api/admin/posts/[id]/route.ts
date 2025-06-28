// sucecho/src/app/api/admin/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import eventEmitter from '@/lib/event-emitter';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

interface Params {
    id: string;
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<Params> }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: postId } = await params;

        if (!postId) {
            return NextResponse.json(
                { message: 'Post ID is required' },
                { status: 400 }
            );
        }

        const numericPostId = Number(postId);
        if (isNaN(numericPostId)) {
            return NextResponse.json(
                { message: 'Invalid Post ID' },
                { status: 400 }
            );
        }

        const existingPost = await prisma.post.findUnique({
            where: { id: numericPostId },
        });

        if (!existingPost) {
            return NextResponse.json(
                { message: 'Post not found' },
                { status: 404 }
            );
        }

        await prisma.post.delete({
            where: { id: numericPostId },
        });

        eventEmitter.emit('delete_post', { postId: numericPostId });

        return NextResponse.json(
            { message: 'Post deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Error deleting post:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
