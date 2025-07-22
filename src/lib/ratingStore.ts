// SUCEcho_packaged/src/lib/ratingStore.ts
import logger from './logger';

const RATING_VOTES_KEY = 'job_ratings_v1';
const MAX_RATING_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type RatingEntry = {
    rating: number;
    timestamp: number;
};

type RatingStore = Record<number, RatingEntry>;

/**
 * Retrieves recent ratings from localStorage and cleans up old ones.
 */
export const getStoredRatings = (): RatingStore => {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const item = window.localStorage.getItem(RATING_VOTES_KEY);
        if (!item) return {};

        const allRatings: RatingStore = JSON.parse(item);
        const now = Date.now();
        const recentRatings: RatingStore = {};
        let needsUpdate = false;

        for (const postId in allRatings) {
            if (Object.prototype.hasOwnProperty.call(allRatings, postId)) {
                const entry = allRatings[postId];
                if (now - entry.timestamp < MAX_RATING_AGE_MS) {
                    recentRatings[Number(postId)] = entry;
                } else {
                    needsUpdate = true;
                }
            }
        }

        if (needsUpdate) {
            window.localStorage.setItem(
                RATING_VOTES_KEY,
                JSON.stringify(recentRatings)
            );
        }

        return recentRatings;
    } catch (error) {
        logger.error('Failed to parse ratings from localStorage', error);
        window.localStorage.removeItem(RATING_VOTES_KEY);
        return {};
    }
};

/**
 * Stores a user's rating in localStorage.
 */
export const storeRating = (postId: number, rating: number | null): void => {
    if (typeof window === 'undefined') return;

    try {
        const ratings = getStoredRatings();
        if (rating === null) {
            delete ratings[postId];
        } else {
            ratings[postId] = {
                rating,
                timestamp: Date.now(),
            };
        }
        window.localStorage.setItem(RATING_VOTES_KEY, JSON.stringify(ratings));
    } catch (error) {
        logger.error('Failed to store rating in localStorage', error);
    }
};
