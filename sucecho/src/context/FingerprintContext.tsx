"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
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
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setFingerprint(result.visitorId);
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