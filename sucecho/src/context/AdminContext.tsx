// sucecho/src/context/AdminContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AdminContextType {
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check for the session cookie on initial load
        const hasSessionCookie = document.cookie.split(';').some((item) => item.trim().startsWith('session='));
        setIsAdmin(hasSessionCookie);
    }, []);

    const login = () => {
        // The cookie is set by the API, this just updates the state
        setIsAdmin(true);
    };

    const logout = async () => {
        // Clear the cookie by sending a request to the logout endpoint
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
        } catch (error) {
            console.error('Failed to logout:', error);
        }
        setIsAdmin(false);
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
