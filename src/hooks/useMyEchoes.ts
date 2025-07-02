// src/hooks/useMyEchoes.ts
'use client';

import logger from '@/lib/logger';

const MY_ECHOES_KEY = 'my_echoes';

/**
 * Retrieves the user's post IDs from localStorage.
 * This function is safe to call on the server, as it checks for `window`.
 * @returns {number[]} An array of post IDs.
 */
export const getMyEchoes = (): number[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem(MY_ECHOES_KEY);
        if (!item) return [];
        const ids = JSON.parse(item);
        // Basic validation to ensure it's an array of numbers
        if (Array.isArray(ids) && ids.every((id) => typeof id === 'number')) {
            return ids;
        }
        return [];
    } catch (error) {
        logger.error('Failed to parse my echoes from localStorage', error);
        return [];
    }
};

/**
 * Adds a new post ID to the user's list in localStorage.
 * @param {number} postId The ID of the post to add.
 */
export const addMyEcho = (postId: number): void => {
    if (typeof window === 'undefined' || typeof postId !== 'number') {
        return;
    }
    try {
        const currentEchoes = getMyEchoes();
        // Avoid adding duplicates
        if (!currentEchoes.includes(postId)) {
            const newEchoes = [postId, ...currentEchoes];
            window.localStorage.setItem(
                MY_ECHOES_KEY,
                JSON.stringify(newEchoes)
            );
        }
    } catch (error) {
        logger.error('Failed to add echo to localStorage', error);
    }
};
