// sucecho/src/lib/logger.ts

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * A simple logger that only outputs messages in the development environment.
 */
const logger = {
    log: (...args: any[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    error: (...args: any[]) => {
        // You might want to log errors in production to a service like Sentry
        // For now, we'll keep it consistent with the other methods.
        if (isDevelopment) {
            console.error(...args);
        }
    },
};

export default logger;
