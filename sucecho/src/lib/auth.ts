// sucecho/src/lib/auth.ts
import { jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
    throw new Error('Missing JWT_SECRET_KEY in environment variables.');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

// This remains our target interface for the session data
export interface UserPayload extends JWTPayload {
    username: string;
}

export async function verifySession(session: string): Promise<UserPayload | null> {
    try {
        // 1. Await the verification and let it return its default payload type
        const { payload } = await jwtVerify(session, JWT_SECRET, {
            algorithms: ['HS256'],
        });

        // 2. Check if the 'username' exists on the payload
        if (typeof payload.username !== 'string') {
            console.error("JWT payload is missing 'username'.");
            return null;
        }

        // 3. We can now safely cast and return the payload as our UserPayload type
        return payload as UserPayload;

    } catch (error) {
        // Catches invalid/expired tokens and other errors
        console.error("JWT Verification Failed:", error);
        return null;
    }
}