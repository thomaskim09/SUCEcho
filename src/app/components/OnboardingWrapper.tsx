// sucecho/src/app/components/OnboardingWrapper.tsx
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const WelcomeAnimation = dynamic(() => import('./WelcomeAnimation'), {
    ssr: false
});
import logger from '@/lib/logger';

const FullScreenBlocker = () => (
    <div style={{
        backgroundColor: '#0B192F',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
    }} />
);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        const visitedItem = localStorage.getItem('hasVisitedSUCEcho');
        let hasVisited = false;

        if (visitedItem) {
            try {
                const { timestamp } = JSON.parse(visitedItem);
                if (timestamp && (Date.now() - timestamp < THIRTY_DAYS_MS)) {
                    hasVisited = true;
                }
            } catch (error) {
                logger.error('[OnboardingWrapper] Failed to parse hasVisitedSUCEcho:', error);
                // Treat as not visited if parsing fails
            }
        }

        logger.log('[OnboardingWrapper] hasVisited within 30 days:', hasVisited);

        if (hasVisited) {
            setShowSplash(false);
            logger.log('[OnboardingWrapper] Splash will NOT show (visited recently)');
        } else {
            localStorage.setItem('hasVisitedSUCEcho', JSON.stringify({ timestamp: Date.now() }));
            setShowSplash(true);
            logger.log('[OnboardingWrapper] Splash WILL show (first visit or expired)');
        }
        setIsChecking(false);
    }, []);

    const handleAnimationComplete = () => {
        setShowSplash(false);
        logger.log('[OnboardingWrapper] Animation complete, hiding splash');
    };

    if (isChecking) {
        return <FullScreenBlocker />;
    }

    if (showSplash) {
        return <WelcomeAnimation onComplete={handleAnimationComplete} />;
    }

    return <>{children}</>;
}