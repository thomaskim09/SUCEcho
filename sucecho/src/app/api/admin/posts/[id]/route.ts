// sucecho/src/app/api/admin/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: any) {
    try {
        const postId = params.id;

        if (!postId) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        // Check if the post exists
        const existingPost = await prisma.post.findUnique({
            where: { id: Number(postId) },
        });

        if (!existingPost) {
            return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        // Delete the post
        await prisma.post.delete({
            where: { id: Number(postId) },
        });

        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
