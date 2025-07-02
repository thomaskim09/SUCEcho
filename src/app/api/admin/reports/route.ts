// sucecho/src/app/api/admin/reports/route.ts
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
                        id: true, // Add id to be able to delete it
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

        const postsWithReporterCodename = reportedPosts.map((post) => {
            const reportsWithCodename = post.reports.map((report) => ({
                ...report,
                reporterCodename: generateCodename(report.fingerprintHash),
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
