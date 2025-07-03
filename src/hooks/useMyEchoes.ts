// src/hooks/useMyEchoes.ts
'use client';

import logger from '@/lib/logger';

const MY_ECHOES_KEY = 'my_echoes';

type EchoEntry = {
    id: number;
    createdAt: number;
};

interface PostWithTimestamp {
    id: number;
    createdAt: string | number | Date;
}

/**
 * Retrieves recent post IDs, cleaning up any older than 24 hours.
 * @returns {number[]} An array of post IDs from the last 24 hours.
 */
export const getMyEchoes = (): number[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem(MY_ECHOES_KEY);
        if (!item) return [];

        const allEntries: EchoEntry[] = JSON.parse(item);
        const now = Date.now();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

        const recentEntries = allEntries.filter((entry) => {
            if (
                typeof entry?.id !== 'number' ||
                typeof entry?.createdAt !== 'number'
            ) {
                return false;
            }
            return now - entry.createdAt < twentyFourHoursInMs;
        });

        window.localStorage.setItem(
            MY_ECHOES_KEY,
            JSON.stringify(recentEntries)
        );

        return recentEntries.map((entry) => entry.id);
    } catch (error) {
        logger.error(
            'Failed to parse or clean my echoes from localStorage',
            error
        );
        window.localStorage.removeItem(MY_ECHOES_KEY);
        return [];
    }
};

/**
 * Adds a new post to localStorage, but only if it was created within the last 24 hours.
 * @param {PostWithTimestamp} post The new post object from the server.
 */
export const addMyEcho = (post: PostWithTimestamp): void => {
    if (
        typeof window === 'undefined' ||
        !post ||
        typeof post.id !== 'number' ||
        !post.createdAt
    ) {
        return;
    }

    try {
        const postTimestamp = new Date(post.createdAt).getTime();
        const now = Date.now();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

        if (now - postTimestamp > twentyFourHoursInMs) {
            logger.log(
                `Post ${post.id} is older than 24 hours and will not be added to My Echoes.`
            );
            return;
        }

        const item = window.localStorage.getItem(MY_ECHOES_KEY);
        const currentEntries: EchoEntry[] = item ? JSON.parse(item) : [];

        // Avoid adding duplicates
        if (!currentEntries.some((entry) => entry.id === post.id)) {
            const newEntry: EchoEntry = {
                id: post.id,
                createdAt: postTimestamp,
            };
            const newEchoes = [newEntry, ...currentEntries];
            window.localStorage.setItem(
                MY_ECHOES_KEY,
                JSON.stringify(newEchoes)
            );
        }
    } catch (error) {
        logger.error('Failed to add echo to localStorage', error);
    }
};
