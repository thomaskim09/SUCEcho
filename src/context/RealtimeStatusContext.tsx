// src/context/RealtimeStatusContext.tsx
"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface RealtimeStatusContextType {
    isSubscribed: boolean;
    setIsSubscribed: Dispatch<SetStateAction<boolean>>;
}

const RealtimeStatusContext = createContext<RealtimeStatusContextType | undefined>(undefined);

export const RealtimeStatusProvider = ({ children }: { children: ReactNode }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);

    return (
        <RealtimeStatusContext.Provider value={{ isSubscribed, setIsSubscribed }}>
            {children}
        </RealtimeStatusContext.Provider>
    );
};

export const useRealtimeStatus = (): RealtimeStatusContextType => {
    const context = useContext(RealtimeStatusContext);
    if (context === undefined) {
        throw new Error('useRealtimeStatus must be used within a RealtimeStatusProvider');
    }
    return context;
};