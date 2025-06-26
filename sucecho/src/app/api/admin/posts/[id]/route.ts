// sucecho/src/app/api/admin/posts/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

interface Params {
    id: string;
}

export async function DELETE(request: Request, context: { params: Params }) {
    try {
        const postId = parseInt(context.params.id, 10);
        if (isNaN(postId)) {
            return NextResponse.json({ message: 'Invalid Post ID' }, { status: 400 });
        }

        // We use a transaction to ensure we delete the post and its related data atomically
        await prisma.$transaction(async (tx) => {
            await tx.vote.deleteMany({ where: { postId } });
            await tx.postStats.delete({ where: { postId } });
            await tx.post.delete({ where: { id: postId } });
        });

        // Emit an event to notify all connected clients to remove this post
        eventEmitter.emit('delete_post', { postId });
        
        console.log(`Admin has deleted post ${postId}`);
        return NextResponse.json({ message: `Post ${postId} deleted successfully.` });

    } catch (error) {
        console.error(`Error deleting post ${context.params.id}:`, error);
        // Prisma throws a specific error code if the record to delete is not found
        if (error instanceof Error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: 'Post not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Failed to delete post' }, { status: 500 });
    }
}