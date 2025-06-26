// sucecho/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;

    // If there's no session cookie, redirect to the login page
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    // Verify the JWT
    const payload = await verifySession(sessionCookie);

    // If the token is invalid or expired, redirect to the login page
    if (!payload) {
        const response = NextResponse.redirect(new URL('/admin-login', request.url));
        // Clear the invalid cookie
        response.cookies.set('session', '', { maxAge: -1 }); 
        return response;
    }

    // If the token is valid, allow the request to proceed
    return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/admin/login (the login route itself)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/api/admin/:path((?!login|logout).*)', // Protects all /api/admin routes except login and logout
        '/admin/:path*', // Protects all future pages under /admin
    ],
}