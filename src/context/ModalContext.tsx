// SUCEcho_packaged/src/context/ModalContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import ShareModal from '../app/components/ShareModal';
import logger from '@/lib/logger';

interface ModalContextType {
    triggerShareModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isShareModalOpen, setShareModalOpen] = useState(false);

    const triggerShareModal = useCallback(() => {
        const seenItem = localStorage.getItem('hasSeenShareInvitation');
        let hasSeen = false;

        if (seenItem) {
            try {
                const { timestamp } = JSON.parse(seenItem);
                if (timestamp && (Date.now() - timestamp < THIRTY_DAYS_MS)) {
                    hasSeen = true;
                }
            } catch (error) {
                logger.error('[ModalContext] Failed to parse hasSeenShareInvitation:', error);
            }
        }

        if (hasSeen) {
            logger.log('[ModalContext] Share modal will NOT show (seen recently)');
            return;
        }

        setTimeout(() => {
            setShareModalOpen(true);
            logger.log('[ModalContext] Share modal WILL show (first time or expired)');
        }, 5000);
    }, []);

    const handleClose = () => {
        setShareModalOpen(false);
        localStorage.setItem('hasSeenShareInvitation', JSON.stringify({ timestamp: Date.now() }));
    };

    return (
        <ModalContext.Provider value={{ triggerShareModal }}>
            {children}
            <ShareModal isOpen={isShareModalOpen} onClose={handleClose} />
        </ModalContext.Provider>
    );
};

// A custom hook to easily access the trigger function
export const useShareModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useShareModal must be used within a ModalProvider');
    }
    return context;
};