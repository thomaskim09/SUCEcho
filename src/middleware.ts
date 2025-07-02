// sucecho/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    const payload = await verifySession(sessionCookie);

    if (!payload) {
        const response = NextResponse.redirect(
            new URL('/admin-login', request.url)
        );
        response.cookies.set('session', '', { maxAge: -1 });
        return response;
    }

    return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
    // --- MODIFIED MATCHER ---
    // We are now only protecting the front-end pages under /admin.
    // The API routes will handle their own session verification internally.
    matcher: ['/admin/:path*'],
};
