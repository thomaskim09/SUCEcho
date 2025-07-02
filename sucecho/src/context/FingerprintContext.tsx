// sucecho/src/context/FingerprintContext.tsx
"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import FingerprintJS, { hashComponents, sources } from '@fingerprintjs/fingerprintjs';
import logger from '@/lib/logger';

interface FingerprintContextType {
    fingerprint: string | null;
    isLoading: boolean;
}

const FingerprintContext = createContext<FingerprintContextType | undefined>(undefined);

export const FingerprintProvider = ({ children }: { children: ReactNode }) => {
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getFingerprint = async () => {
            try {
                // Default sources include many unstable options
                const defaultSources = { ...sources };

                // Exclude the most volatile sources to improve stability
                delete defaultSources.fonts;
                delete defaultSources.audio;
                delete defaultSources.screenFrame; // Can change if browser toolbars/UI changes

                const fp = await FingerprintJS.load();

                // Get the visitor identifier from the more stable sources
                const result = await fp.get();
                const components = result.components;

                // Manually filter out unstable components before hashing
                delete components.fonts;
                delete components.audio;
                delete components.screenFrame;

                const stableVisitorId = hashComponents(components);
                setFingerprint(stableVisitorId);

            } catch (error) {
                logger.error("Error getting fingerprint:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getFingerprint();
    }, []);

    return (
        <FingerprintContext.Provider value={{ fingerprint, isLoading }}>
            {children}
        </FingerprintContext.Provider>
    );
};

export const useFingerprint = (): FingerprintContextType => {
    const context = useContext(FingerprintContext);
    if (context === undefined) {
        throw new Error('useFingerprint must be used within a FingerprintProvider');
    }
    return context;
};