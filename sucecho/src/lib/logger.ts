// sucecho/src/lib/logger.ts

// const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * A simple logger that only outputs messages in the development environment.
 */
const logger = {
    log: (...args: unknown[]) => {
        // if (isDevelopment) {
        console.log(...args);
        // }
    },
    warn: (...args: unknown[]) => {
        // if (isDevelopment) {
        console.warn(...args);
        // }
    },
    error: (...args: unknown[]) => {
        // if (isDevelopment) {
        console.error(...args);
        // }
    },
};

export default logger;
