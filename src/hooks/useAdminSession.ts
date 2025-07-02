// sucecho/src/hooks/useAdminSession.ts
"use client";

import { useAdmin } from '@/context/AdminContext';

/**
 * A hook to easily access the admin state from the AdminContext.
 * @returns {boolean} True if the user is in admin mode.
 */
export const useAdminSession = (): boolean => {
    const { isAdmin } = useAdmin();
    return isAdmin;
};