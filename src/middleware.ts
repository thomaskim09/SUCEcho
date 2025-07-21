// sucecho/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // Create new headers so we can modify them
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-search', search);

    // Admin route protection logic
    if (pathname.startsWith('/admin')) {
        const sessionCookie = request.cookies.get('session')?.value;

        if (!sessionCookie || !(await verifySession(sessionCookie))) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin-login';
            const response = NextResponse.redirect(url);
            response.cookies.set('session', '', { maxAge: -1 });
            return response;
        }
    }

    // Pass the modified headers to the next middleware or page
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Config to run the middleware on all pages except for static assets and API routes
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)'],
};
