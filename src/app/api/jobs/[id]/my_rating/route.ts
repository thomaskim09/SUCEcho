// SUCEcho_packaged/src/app/api/jobs/[id]/my_rating/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const postId = parseInt(params.id, 10);
        const { fingerprintHash } = await request.json();

        if (isNaN(postId) || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Invalid postId or fingerprint' },
                { status: 400 }
            );
        }

        const existingRating = await prisma.jobRating.findUnique({
            where: {
                postId_fingerprintHash: {
                    postId,
                    fingerprintHash,
                },
            },
        });

        if (!existingRating) {
            return NextResponse.json({ rating: null });
        }

        return NextResponse.json({ rating: existingRating.rating });
    } catch (error) {
        logger.error(
            `Error fetching user rating for job post #${params.id}:`,
            error
        );
        return NextResponse.json(
            { error: 'Failed to fetch user rating' },
            { status: 500 }
        );
    }
}
