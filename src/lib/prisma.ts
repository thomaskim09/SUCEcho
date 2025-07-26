// SUCEcho_packaged/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
}

// Conditionally add 'query' to the log levels
const logLevels: ('query' | 'info' | 'warn' | 'error')[] = [
    'info',
    'warn',
    'error',
];
if (process.env.DATABASE_LOG_QUERIES === 'true') {
    logLevels.push('query');
}

const prisma =
    globalThis.prisma ||
    new PrismaClient({
        log: logLevels,
    });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
