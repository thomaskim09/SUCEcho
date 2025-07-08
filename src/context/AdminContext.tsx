// sucecho/src/context/AdminContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

const ADMIN_STORAGE_KEY = 'isAdminVisual';

interface AdminContextType {
    isAdmin: boolean;
    isVerifying: boolean;
    login: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const router = useRouter();

    const logout = useCallback(async () => {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        setIsAdmin(false);
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
        } catch (error) {
            logger.error('Failed to logout from server:', error);
        } finally {
            if (window.location.pathname.startsWith('/admin')) {
                router.push('/');
            }
        }
    }, [router]);

    useEffect(() => {
        const verifyAdminSession = async () => {
            setIsVerifying(true);
            try {
                const response = await fetch('/api/admin/session');
                const data = await response.json();

                if (data.isAdmin) {
                    setIsAdmin(true);
                    localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
                } else {
                    setIsAdmin(false);
                    localStorage.removeItem(ADMIN_STORAGE_KEY);
                }
            } catch (error) {
                logger.error('Server verification for admin failed:', error);
                setIsAdmin(false);
                localStorage.removeItem(ADMIN_STORAGE_KEY);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAdminSession();
    }, []);


    const login = () => {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        setIsAdmin(true);
        setIsVerifying(false);
    };

    return (
        <AdminContext.Provider value={{ isAdmin, isVerifying, login, logout }}>
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