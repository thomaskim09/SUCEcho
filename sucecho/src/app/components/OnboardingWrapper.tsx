// sucecho/src/app/components/OnboardingWrapper.tsx
"use client";

import { useState, useEffect } from 'react';
import WelcomeAnimation from './WelcomeAnimation';
import logger from '@/lib/logger';

// This is a simple, non-React component to prevent the main app from flashing
// before we can check localStorage.
const FullScreenBlocker = () => (
    <div style={{
        backgroundColor: '#0B192F', // This is var(--background) from your globals.css
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
    }} />
);

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    // We now have two states: one to track the check, one to track the decision.
    const [isChecking, setIsChecking] = useState(true);
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        // This effect runs only once on the client.
        const visited = localStorage.getItem('hasVisitedSUCEcho');
        logger.log('[OnboardingWrapper] localStorage hasVisitedSUCEcho:', visited);

        if (visited === 'true') {
            setShowSplash(false);
            logger.log('[OnboardingWrapper] Splash will NOT show (visited)');
        } else {
            // It's the first visit. Set the flag so we don't show it again.
            localStorage.setItem('hasVisitedSUCEcho', 'true');
            setShowSplash(true);
            logger.log('[OnboardingWrapper] Splash WILL show (first visit)');
        }

        // The check is complete.
        setIsChecking(false);
    }, []);

    const handleAnimationComplete = () => {
        setShowSplash(false);
        logger.log('[OnboardingWrapper] Animation complete, hiding splash');
    };

    if (isChecking) {
        // While we are checking, render the blocker. Nothing else will be visible.
        return <FullScreenBlocker />;
    }

    if (showSplash) {
        // If we decided to show the splash, render it.
        return <WelcomeAnimation onComplete={handleAnimationComplete} />;
    }

    // Otherwise, render the main application.
    return <>{children}</>;
}