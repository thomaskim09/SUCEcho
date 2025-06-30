"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTabLeader } from '@/lib/tabLeader';

interface TabLeaderContextType {
    isTabLeader: boolean;
    multiTabAllowed: boolean;
    tabLeaderChecked: boolean;
}

const TabLeaderContext = createContext<TabLeaderContextType>({
    isTabLeader: true,
    multiTabAllowed: true,
    tabLeaderChecked: true,
});

export const TabLeaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [multiTabAllowed, setMultiTabAllowed] = useState(true);
    const [tabLeaderChecked, setTabLeaderChecked] = useState(false);
    const isTabLeader = useTabLeader();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMultiTabAllowed(process.env.NEXT_PUBLIC_ALLOW_MULTI_TAB === 'true');
        }
    }, []);

    useEffect(() => {
        setTabLeaderChecked(true);
    }, [isTabLeader]);

    return (
        <TabLeaderContext.Provider value={{ isTabLeader, multiTabAllowed, tabLeaderChecked }}>
            {children}
        </TabLeaderContext.Provider>
    );
};

export function useTabLeaderContext() {
    return useContext(TabLeaderContext);
} 