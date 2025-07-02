// sucecho/src/app/api/admin/session/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ isAdmin: false });
    }

    const payload = await verifySession(sessionCookie);

    if (!payload) {
        return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: true });
}
