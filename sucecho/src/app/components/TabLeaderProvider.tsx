// sucecho/src/providers/TabLeaderProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel';
import logger from '@/lib/logger';

type TabStatus = 'checking' | 'leader' | 'follower';

interface TabLeaderContextType {
    status: TabStatus;
    multiTabAllowed: boolean;
}

const TabLeaderContext = createContext<TabLeaderContextType | undefined>(undefined);

const channel = new BroadcastChannel('sucecho_leader_election');

export const TabLeaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<TabStatus>('checking');
    const multiTabAllowed = process.env.NEXT_PUBLIC_ALLOW_MULTI_TAB === 'true';

    useEffect(() => {
        if (multiTabAllowed) {
            setStatus('leader');
            return;
        }
        const elector = createLeaderElection(channel);
        const onBecomeLeader = () => {
            setStatus('leader');
            logger.log('Tab status set to: leader');
        };
        elector.onduplicate = () => {
            logger.warn('Leader elector detected duplicate, re-electing...');
            elector.awaitLeadership().then(onBecomeLeader);
        };
        elector.awaitLeadership().then(onBecomeLeader);
        setTimeout(() => {
            if (!elector.isLeader) {
                setStatus('follower');
                logger.log('Tab status set to: follower');
            }
        }, 100);
        return () => {
            elector.die();
        };
    }, [multiTabAllowed]);

    return (
        <TabLeaderContext.Provider value={{ status, multiTabAllowed }}>
            {children}
        </TabLeaderContext.Provider>
    );
};

export const useTabLeaderContext = () => {
    const context = useContext(TabLeaderContext);
    if (context === undefined) {
        throw new Error('useTabLeaderContext must be used within a TabLeaderProvider');
    }
    return context;
};