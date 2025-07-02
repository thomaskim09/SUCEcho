// sucecho/src/app/components/OnboardingWrapper.tsx
"use client";

import { useState, useEffect } from 'react';
import WelcomeAnimation from './WelcomeAnimation';
import logger from '@/lib/logger';

const FullScreenBlocker = () => (
    <div style={{
        backgroundColor: '#0B192F',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
    }} />
);

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        const visited = localStorage.getItem('hasVisitedSUCEcho');
        logger.log('[OnboardingWrapper] localStorage hasVisitedSUCEcho:', visited);

        if (visited === 'true') {
            setShowSplash(false);
            logger.log('[OnboardingWrapper] Splash will NOT show (visited)');
        } else {
            localStorage.setItem('hasVisitedSUCEcho', 'true');
            setShowSplash(true);
            logger.log('[OnboardingWrapper] Splash WILL show (first visit)');
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