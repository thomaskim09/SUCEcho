"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import ShareModal from '../app/components/ShareModal';

interface ModalContextType {
    triggerShareModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isShareModalOpen, setShareModalOpen] = useState(false);

    const triggerShareModal = useCallback(() => {
        if (localStorage.getItem('hasSeenShareInvitation') === 'true') {
            return;
        }
        setTimeout(() => {
            setShareModalOpen(true);
        }, 5000);
    }, []);

    const handleClose = () => {
        setShareModalOpen(false);
        localStorage.setItem('hasSeenShareInvitation', 'true');
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