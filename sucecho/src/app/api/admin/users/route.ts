// sucecho/src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch all fields from the UserAnonymizedProfile model
        const users = await prisma.userAnonymizedProfile.findMany({
            // No 'select' is needed if you want all fields,
            // but we can be explicit for clarity.
            select: {
                fingerprintHash: true,
                codename: true,
                purifiedPostCount: true,
                isBanned: true,
                banExpiresAt: true,
                firstSeenAt: true,
                lastSeenAt: true
            },
            orderBy: {
                lastSeenAt: 'desc'
            }
        });
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}