import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const postId = parseInt(params.id, 10);
        const { rating, fingerprintHash } = await request.json();

        if (![1, 2, 3, 4, 5].includes(rating) || !fingerprintHash) {
            return NextResponse.json(
                { error: 'Invalid rating or fingerprint' },
                { status: 400 }
            );
        }

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create or update the rating
            await tx.jobRating.upsert({
                where: { postId_fingerprintHash: { postId, fingerprintHash } },
                update: { rating },
                create: { postId, rating, fingerprintHash },
            });

            // Recalculate the average rating and count
            const aggregate = await tx.jobRating.aggregate({
                _avg: { rating: true },
                _count: { id: true },
                where: { postId },
            });

            // Update the PostStats table
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
        logger.error(`Error rating job post #${params.id}:`, error);
        return NextResponse.json(
            { error: 'Failed to submit rating' },
            { status: 500 }
        );
    }
}
