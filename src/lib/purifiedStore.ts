// sucecho/src/lib/purifiedStore.ts
import logger from './logger';

const PURIFIED_POSTS_KEY = 'purified_post_ids';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type PurifiedEntry = {
    id: number;
    purifiedAt: number;
};

export const getPurifiedPostIds = (): Set<number> => {
    if (typeof window === 'undefined') {
        return new Set();
    }
    try {
        const item = window.localStorage.getItem(PURIFIED_POSTS_KEY);
        if (!item) return new Set();

        const allEntries: PurifiedEntry[] = JSON.parse(item);
        const now = Date.now();

        const recentEntries = allEntries.filter((entry) => {
            if (
                typeof entry?.id !== 'number' ||
                typeof entry?.purifiedAt !== 'number'
            ) {
                return false;
            }
            return now - entry.purifiedAt < TWENTY_FOUR_HOURS_MS;
        });

        if (recentEntries.length !== allEntries.length) {
            window.localStorage.setItem(
                PURIFIED_POSTS_KEY,
                JSON.stringify(recentEntries)
            );
        }

        return new Set(recentEntries.map((entry) => entry.id));
    } catch (error) {
        logger.error(
            'Failed to parse or clean purified posts from localStorage',
            error
        );
        window.localStorage.removeItem(PURIFIED_POSTS_KEY);
        return new Set();
    }
};

export const addPurifiedPostId = (postId: number): void => {
    if (typeof window === 'undefined' || typeof postId !== 'number') {
        return;
    }

    try {
        const currentIds = Array.from(getPurifiedPostIds());
        if (!currentIds.includes(postId)) {
            const newEntry: PurifiedEntry = {
                id: postId,
                purifiedAt: Date.now(),
            };
            const currentEntries: PurifiedEntry[] = JSON.parse(
                window.localStorage.getItem(PURIFIED_POSTS_KEY) || '[]'
            );
            const updatedEntries = [
                newEntry,
                ...currentEntries.filter((e) => e.id !== postId),
            ];
            window.localStorage.setItem(
                PURIFIED_POSTS_KEY,
                JSON.stringify(updatedEntries)
            );
        }
    } catch (error) {
        logger.error('Failed to add purified post ID to localStorage', error);
    }
};
