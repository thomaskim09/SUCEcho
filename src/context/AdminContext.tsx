// sucecho/src/context/AdminContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

interface AdminContextType {
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
    checkSession: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    const checkSession = async () => {
        try {
            const response = await fetch('/api/admin/session');
            const data = await response.json();
            setIsAdmin(data.isAdmin);
        } catch (error) {
            logger.error('Failed to check session:', error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = () => {
        setIsAdmin(true);
    };

    const logout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setIsAdmin(false);
            router.push('/');
        } catch (error) {
            logger.error('Failed to logout:', error);
        }
    };

    return (
        <AdminContext.Provider value={{ isAdmin, login, logout, checkSession }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
