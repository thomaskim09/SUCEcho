// src/app/api/admin/reports/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';
import { generateCodename } from '@/lib/codename';

export async function GET(request: Request) {
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const reportedPosts = await prisma.post.findMany({
            where: {
                reports: {
                    some: {
                        createdAt: {
                            gte: twentyFourHoursAgo,
                        },
                    },
                },
            },
            include: {
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
                _count: {
                    select: { reports: true },
                },
                reports: {
                    select: {
                        id: true,
                        fingerprintHash: true,
                        reason: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
            orderBy: {
                reports: {
                    _count: 'desc',
                },
            },
        });

        const reporterFingerprints = Array.from(
            new Set(
                reportedPosts.flatMap((post) =>
                    post.reports.map((r) => r.fingerprintHash)
                )
            )
        );

        const reporters = await prisma.userAnonymizedProfile.findMany({
            where: {
                fingerprintHash: {
                    in: reporterFingerprints,
                },
            },
            select: {
                fingerprintHash: true,
                codename: true,
            },
        });

        const reporterCodenameMap = new Map(
            reporters.map((r) => [r.fingerprintHash, r.codename])
        );

        const postsWithReporterCodename = reportedPosts.map((post) => {
            const reportsWithCodename = post.reports.map((report) => ({
                ...report,
                reporterCodename:
                    reporterCodenameMap.get(report.fingerprintHash) ||
                    generateCodename(report.fingerprintHash),
            }));
            return { ...post, reports: reportsWithCodename };
        });

        return NextResponse.json(postsWithReporterCodename);
    } catch (error) {
        logger.error('Error fetching reported posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
