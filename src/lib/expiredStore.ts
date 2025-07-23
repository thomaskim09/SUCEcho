// SUCEcho_packaged/src/lib/expiredStore.ts
import logger from './logger';

const EXPIRED_POSTS_KEY = 'expired_post_ids';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type ExpiredEntry = {
    id: number;
    expiredAt: number;
};

export const getExpiredPostIds = (): Set<number> => {
    if (typeof window === 'undefined') {
        return new Set();
    }
    try {
        const item = window.localStorage.getItem(EXPIRED_POSTS_KEY);
        if (!item) return new Set();

        const allEntries: ExpiredEntry[] = JSON.parse(item);
        const now = Date.now();

        const recentEntries = allEntries.filter((entry) => {
            if (
                typeof entry?.id !== 'number' ||
                typeof entry?.expiredAt !== 'number'
            ) {
                return false;
            }
            return now - entry.expiredAt < TWENTY_FOUR_HOURS_MS;
        });

        if (recentEntries.length !== allEntries.length) {
            window.localStorage.setItem(
                EXPIRED_POSTS_KEY,
                JSON.stringify(recentEntries)
            );
        }

        return new Set(recentEntries.map((entry) => entry.id));
    } catch (error) {
        logger.error(
            'Failed to parse or clean expired posts from localStorage',
            error
        );
        window.localStorage.removeItem(EXPIRED_POSTS_KEY);
        return new Set();
    }
};

export const addExpiredPostId = (postId: number): void => {
    if (typeof window === 'undefined' || typeof postId !== 'number') {
        return;
    }

    try {
        const currentIds = Array.from(getExpiredPostIds());
        if (!currentIds.includes(postId)) {
            const newEntry: ExpiredEntry = {
                id: postId,
                expiredAt: Date.now(),
            };
            const currentEntries: ExpiredEntry[] = JSON.parse(
                window.localStorage.getItem(EXPIRED_POSTS_KEY) || '[]'
            );
            const updatedEntries = [
                newEntry,
                ...currentEntries.filter((e) => e.id !== postId),
            ];
            window.localStorage.setItem(
                EXPIRED_POSTS_KEY,
                JSON.stringify(updatedEntries)
            );
        }
    } catch (error) {
        logger.error('Failed to add expired post ID to localStorage', error);
    }
};
