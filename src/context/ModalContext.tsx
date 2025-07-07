"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import ShareModal from '../app/components/ShareModal';

interface ModalContextType {
    triggerShareModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isShareModalOpen, setShareModalOpen] = useState(false);

    // This function can be called from anywhere in the app to start the modal sequence
    const triggerShareModal = useCallback(() => {
        // Only start the process if the user has NEVER seen the modal
        if (localStorage.getItem('hasSeenShareInvitation') === 'true') {
            return;
        }

        // Start the 5-second timer. Since this provider is in the root layout,
        // the timer will not be cancelled by page navigation.
        const timer = setTimeout(() => {
            setShareModalOpen(true);
        }, 5000);

        // Note: We don't need a cleanup function because this provider never unmounts.
    }, []);

    const handleClose = () => {
        setShareModalOpen(false);
        // **This is the key fix:** Only set the permanent flag when the user
        // actually closes the modal.
        localStorage.setItem('hasSeenShareInvitation', 'true');
    };

    return (
        <ModalContext.Provider value={{ triggerShareModal }}>
            {children}
            {/* The ShareModal now lives here, managed by the provider */}
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