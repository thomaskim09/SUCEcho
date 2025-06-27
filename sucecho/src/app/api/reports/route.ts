// sucecho/src/app/api/reports/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, fingerprintHash, reason } = body;

        if (!postId || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Post ID and fingerprint are required' },
                { status: 400 }
            );
        }

        // Use upsert to prevent a user from reporting the same post multiple times.
        // If they report again, it will just update the timestamp.
        await prisma.report.upsert({
            where: {
                postId_fingerprintHash: {
                    postId: Number(postId),
                    fingerprintHash,
                },
            },
            update: {
                reason: reason || null,
                createdAt: new Date(),
            },
            create: {
                postId: Number(postId),
                fingerprintHash,
                reason: reason || null,
            },
        });

        return NextResponse.json(
            { message: 'Report submitted successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating report:', error);
        // Handle cases where the post might have been deleted
        if (
            error instanceof Error &&
            'code' in error &&
            (error as any).code === 'P2003'
        ) {
            return NextResponse.json(
                { error: '无法举报，该帖子已不存在。' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to submit report' },
            { status: 500 }
        );
    }
}
