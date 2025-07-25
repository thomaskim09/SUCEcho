// src/app/api/jobs/search/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm') || '';
    const minRating = Number(searchParams.get('minRating')) || 0;
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const cursor = searchParams.get('cursor');

    let dateQuery = {};
    if (dateFilter !== 'all') {
        const now = new Date();
        let pastDate;
        switch (dateFilter) {
            case '7d':
                pastDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                pastDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case '90d':
                pastDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case '180d':
                pastDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case '365d':
                pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }
        if (pastDate) {
            dateQuery = { createdAt: { gte: pastDate } };
        }
    }

    try {
        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: {
                    id: parseInt(cursor, 10),
                },
            }),
            where: {
                feed: 'JOB',
                content: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
                stats: {
                    averageRating: {
                        gte: minRating,
                    },
                },
                ...dateQuery,
            },
            include: {
                stats: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextCursor: number | null = null;
        if (posts.length === limit) {
            nextCursor = posts[posts.length - 1].id;
        }

        return NextResponse.json({ posts, nextCursor });
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch search results' },
            { status: 500 }
        );
    }
}
