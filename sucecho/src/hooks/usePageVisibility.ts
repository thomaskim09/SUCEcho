// sucecho/src/hooks/usePageVisibility.ts
'use client';

import { useState, useEffect } from 'react';

export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Fallback for browsers that might not support document.hidden
        if (
            typeof document === 'undefined' ||
            typeof document.hidden === 'undefined'
        ) {
            return;
        }

        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set the initial state
        handleVisibilityChange();

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
        };
    }, []);

    return isVisible;
}
