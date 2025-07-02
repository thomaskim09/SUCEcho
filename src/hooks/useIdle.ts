// sucecho/src/hooks/useIdle.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import logger from '@/lib/logger';

// Get the idle timeout from environment variables, with a default of 5 minutes (300,000 ms)
const IDLE_TIMEOUT_MS = parseInt(
    process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS || '300000',
    10
);

/**
 * Hook to detect user idle state.
 * @returns {boolean} - True if the user is idle, false otherwise.
 */
export function useIdle(): boolean {
    const [isIdle, setIsIdle] = useState(false);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];

        const resetTimer = () => {
            if (isIdle) {
                logger.log('User is no longer idle.');
                setIsIdle(false);
            }

            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }

            timeoutId.current = setTimeout(() => {
                logger.log(
                    `User has been idle for ${IDLE_TIMEOUT_MS / 1000}s.`
                );
                setIsIdle(true);
            }, IDLE_TIMEOUT_MS);
        };

        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach((event) =>
                window.removeEventListener(event, resetTimer)
            );
        };
    }, [isIdle]);

    return isIdle;
}
