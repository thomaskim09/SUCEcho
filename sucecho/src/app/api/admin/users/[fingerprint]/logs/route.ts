// sucecho/src/app/api/admin/users/[fingerprint]/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { fingerprint: string } }
) {
    const { fingerprint } = await params;
    
    try {
        const logs = await prisma.adminLog.findMany({
            where: {
                targetFingerprintHash: fingerprint,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch logs" }, { status: 500 });
    }
}