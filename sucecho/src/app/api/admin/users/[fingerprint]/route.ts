// sucecho/src/app/api/admin/users/[fingerprint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: { fingerprint: string } }) {
    try {
        const userFingerprint = context.params.fingerprint;

        if (!userFingerprint) {
            return NextResponse.json({ message: 'User fingerprint is required' }, { status: 400 });
        }

        const user = await prisma.userAnonymizedProfile.findUnique({
            where: { fingerprintHash: userFingerprint },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
