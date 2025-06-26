// sucecho/src/app/api/admin/login/route.ts
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

// Ensure environment variables are loaded and typed correctly
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!JWT_SECRET_KEY || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Missing required environment variables for admin authentication.');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Validate credentials
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
        }
        
        // 2. Create a JWT session token
        const expirationTime = '24h';
        const token = await new SignJWT({ username })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(expirationTime)
            .sign(JWT_SECRET);

        // 3. Create the response and set the cookie on it
        const response = NextResponse.json({ message: 'Login successful' });

        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day in seconds
            path: '/',
        });

        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}