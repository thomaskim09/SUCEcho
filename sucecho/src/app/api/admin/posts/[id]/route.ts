// sucecho/src/app/api/admin/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import eventEmitter from '@/lib/event-emitter';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // FIX: Await params for Next.js 15 compatibility
        const { id: postId } = await params;

        if (!postId) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        const numericPostId = Number(postId);
        
        const existingPost = await prisma.post.findUnique({
            where: { id: numericPostId },
        });

        if (!existingPost) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        await prisma.post.delete({
            where: { id: numericPostId },
        });

        eventEmitter.emit('delete_post', { postId: numericPostId });

        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}