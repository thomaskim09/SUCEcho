// SUCEcho_packaged/src/app/api/admin/votes/summary/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

export async function GET(request: Request) {
    // 1. Authenticate the admin session
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Group votes by user and vote type to get counts
        const voteCounts = await prisma.vote.groupBy({
            by: ['fingerprintHash', 'voteType'],
            _count: {
                _all: true,
            },
        });

        // 3. Process the raw counts into a more usable map
        const userVoteStats: Map<
            string,
            { upvotes: number; downvotes: number }
        > = new Map();

        for (const { fingerprintHash, voteType, _count } of voteCounts) {
            if (!userVoteStats.has(fingerprintHash)) {
                userVoteStats.set(fingerprintHash, {
                    upvotes: 0,
                    downvotes: 0,
                });
            }
            const stats = userVoteStats.get(fingerprintHash)!;
            if (voteType === 1) {
                stats.upvotes = _count._all;
            } else if (voteType === -1) {
                stats.downvotes = _count._all;
            }
        }

        const userFingerprints = Array.from(userVoteStats.keys());

        // 4. Fetch the codenames for the users we found
        const users = await prisma.userAnonymizedProfile.findMany({
            where: {
                fingerprintHash: {
                    in: userFingerprints,
                },
            },
            select: {
                fingerprintHash: true,
                codename: true,
            },
        });

        // 5. Combine the stats and codenames into a final array
        const responseData = users.map((user) => ({
            fingerprintHash: user.fingerprintHash,
            codename: user.codename,
            ...userVoteStats.get(user.fingerprintHash)!,
        }));

        return NextResponse.json(responseData);
    } catch (error) {
        logger.error('Error fetching vote summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vote summary' },
            { status: 500 }
        );
    }
}
