// sucecho/src/context/PageTransitionContext.tsx
"use client";

import { createContext, useState, useContext, ReactNode } from 'react';
import type { PostWithStats } from '@/lib/types';

// Define a type for the user profile based on what's available in the dashboard list
interface UserProfileSummary {
    fingerprintHash: string;
    codename: string;
    isBanned: boolean;
    purifiedPostCount: number;
    lastSeenAt: string;
}

interface PageTransitionContextType {
    post: PostWithStats | null;
    setPost: (post: PostWithStats | null) => void;
    userProfile: UserProfileSummary | null;
    setUserProfile: (user: UserProfileSummary | null) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const PageTransitionProvider = ({ children }: { children: ReactNode }) => {
    const [post, setPost] = useState<PostWithStats | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfileSummary | null>(null);

    return (
        <PageTransitionContext.Provider value={{ post, setPost, userProfile, setUserProfile }}>
            {children}
        </PageTransitionContext.Provider>
    );
};

export const usePageTransition = () => {
    const context = useContext(PageTransitionContext);
    if (context === undefined) {
        throw new Error('usePageTransition must be used within a PageTransitionProvider');
    }
    return context;
};