// sucecho/src/app/api/admin/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import supabase from '@/lib/supabase-realtime';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';
import { getPostRoomChannelName, MAIN_CHANNEL } from '@/lib/supabase-realtime';

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

        // If the deleted post was a reply, notify the parent post's channel
        if (existingPost.parentPostId) {
            const postRoomChannel = supabase.channel(
                getPostRoomChannelName(existingPost.parentPostId)
            );
            await postRoomChannel.send({
                type: 'broadcast',
                event: 'reply_deleted',
                payload: { postId: numericPostId },
            });
        } else {
            // If the deleted post was a parent post, notify the main channel
            const mainChannel = supabase.channel(MAIN_CHANNEL);
            await mainChannel.send({
                type: 'broadcast',
                event: 'post_deleted',
                payload: { postId: numericPostId },
            });

            // Also notify the specific post room that the parent is gone
            const postRoomChannel = supabase.channel(
                getPostRoomChannelName(numericPostId)
            );
            await postRoomChannel.send({
                type: 'broadcast',
                event: 'parent_post_deleted',
                payload: { postId: numericPostId },
            });
        }

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
