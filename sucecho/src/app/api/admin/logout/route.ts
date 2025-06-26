// sucecho/src/app/api/admin/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create a response object
        const response = NextResponse.json({ message: 'Logout successful' });

        // Set the cookie with an immediate expiration date
        response.cookies.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: -1, // Expire the cookie immediately
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}