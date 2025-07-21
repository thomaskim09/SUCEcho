// SUCEcho_packaged/src/context/InfoModalContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import InfoModal from '../app/components/InfoModal';
import { Icon } from '@/app/components/Icon';

interface ModalContent {
    title: string;
    iconName: React.ComponentProps<typeof Icon>['name'];
    content: string;
    storageKey: string;
}

interface InfoModalContextType {
    showInfoModal: (content: ModalContent) => void;
}

const InfoModalContext = createContext<InfoModalContextType | undefined>(undefined);

export const InfoModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState<Omit<ModalContent, 'storageKey'> | null>(null);
    const [storageKey, setStorageKey] = useState<string>('');

    const showInfoModal = useCallback((modalContent: ModalContent) => {
        if (typeof window !== 'undefined' && localStorage.getItem(modalContent.storageKey) !== 'true') {
            setContent({
                title: modalContent.title,
                iconName: modalContent.iconName,
                content: modalContent.content,
            });
            setStorageKey(modalContent.storageKey);
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        if (typeof window !== 'undefined' && storageKey) {
            localStorage.setItem(storageKey, 'true');
        }
        setIsOpen(false);
    };

    return (
        <InfoModalContext.Provider value={{ showInfoModal }}>
            {children}
            {content && (
                <InfoModal
                    isOpen={isOpen}
                    onClose={handleClose}
                    title={content.title}
                    iconName={content.iconName}
                >
                    <p>{content.content}</p>
                </InfoModal>
            )}
        </InfoModalContext.Provider>
    );
};

export const useInfoModal = () => {
    const context = useContext(InfoModalContext);
    if (context === undefined) {
        throw new Error('useInfoModal must be used within an InfoModalProvider');
    }
    return context;
};