// sucecho/src/context/AdminContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';

const ADMIN_STORAGE_KEY = 'isAdminVisual';

interface AdminContextType {
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAdminStatus = async () => {
            const storedIsAdmin = localStorage.getItem(ADMIN_STORAGE_KEY);
            if (storedIsAdmin === 'true') {
                setIsAdmin(true);

                try {
                    const response = await fetch('/api/admin/session');
                    const data = await response.json();

                    if (!data.isAdmin) {
                        logger.warn('localStorage indicated admin, but server verification failed. Logging out.');
                        logout();
                    }
                } catch (error) {
                    logger.error('Server verification for admin failed', error);
                    logout();
                }
            }
        };

        checkAdminStatus();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === ADMIN_STORAGE_KEY) {
                setIsAdmin(event.newValue === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = () => {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        setIsAdmin(true);
    };

    const logout = async () => {
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
    };

    return (
        <AdminContext.Provider value={{ isAdmin, login, logout }}>
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