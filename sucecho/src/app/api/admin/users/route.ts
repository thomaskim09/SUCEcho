// sucecho/src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.userAnonymizedProfile.findMany({
            select: {
                fingerprint: true,
                createdAt: true,
                _count: {
                    select: { posts: true, votes: true },
                },
            },
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
