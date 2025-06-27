// sucecho/src/app/api/admin/users/[fingerprint]/ban/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

// Ban a user
export async function POST(
    request: NextRequest,
    { params }: { params: { fingerprint: string } }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser)
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { fingerprint: targetFingerprintHash } = await params;
    const { durationDays, reason } = await request.json(); // reason can now be undefined

    if (!targetFingerprintHash) {
        // No longer check for reason here
        return NextResponse.json(
            { message: 'User fingerprint is required' },
            { status: 400 }
        );
    }

    let banExpiresAt: Date | null = null;
    if (durationDays) {
        banExpiresAt = new Date();
        banExpiresAt.setDate(banExpiresAt.getDate() + durationDays);
    }

    try {
        const [updatedUser] = await prisma.$transaction([
            prisma.userAnonymizedProfile.update({
                where: { fingerprintHash: targetFingerprintHash },
                data: { isBanned: true, banExpiresAt },
            }),
            prisma.adminLog.create({
                data: {
                    targetFingerprintHash,
                    action: 'BAN',
                    reason,
                    adminId: adminUser.username,
                },
            }),
        ]);
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to ban user' },
            { status: 500 }
        );
    }
}

// Unban a user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { fingerprint: string } }
) {
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser)
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { fingerprint: targetFingerprintHash } = await params;
    const { durationDays, reason } = await request.json(); // reason can now be undefined

    if (!targetFingerprintHash) {
        // No longer check for reason here
        return NextResponse.json(
            { message: 'User fingerprint is required' },
            { status: 400 }
        );
    }

    try {
        const [updatedUser] = await prisma.$transaction([
            prisma.userAnonymizedProfile.update({
                where: { fingerprintHash: targetFingerprintHash },
                data: { isBanned: false, banExpiresAt: null },
            }),
            prisma.adminLog.create({
                data: {
                    targetFingerprintHash,
                    action: 'UNBAN',
                    reason,
                    adminId: adminUser.username,
                },
            }),
        ]);
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to unban user' },
            { status: 500 }
        );
    }
}
