// SUCEcho_packaged/src/app/api/jobs/[id]/rate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface RouteParams {
    id: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { id } = await params;
        const postId = parseInt(id, 10);
        const { rating, fingerprintHash } = await request.json();

        if (![1, 2, 3, 4, 5].includes(rating) || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Invalid rating or fingerprint' },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.jobRating.upsert({
                where: { postId_fingerprintHash: { postId, fingerprintHash } },
                update: { rating },
                create: { postId, rating, fingerprintHash },
            });

            const aggregate = await tx.jobRating.aggregate({
                _avg: { rating: true },
                _count: { id: true },
                where: { postId },
            });

            const updatedStats = await tx.postStats.update({
                where: { postId },
                data: {
                    averageRating: aggregate._avg.rating || 0,
                    ratingCount: aggregate._count.id || 0,
                },
            });

            return updatedStats;
        });

        return NextResponse.json(result);
    } catch (error) {
        const { id } = await params;
        logger.error(`Error rating job post #${id}:`, error);
        return NextResponse.json(
            { error: 'Failed to submit rating' },
            { status: 500 }
        );
    }
}
