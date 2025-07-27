// SUCEcho_packaged/src/lib/pollVoteStore.ts
import logger from './logger';

const POLL_VOTES_KEY = 'poll_votes_v2';
const MAX_VOTE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// The type now explicitly allows for a null optionId
type PollVoteEntry = {
    optionId: number | null;
    timestamp: number;
};

type PollVoteStore = Record<number, PollVoteEntry>;

/**
 * Retrieves recent poll votes and cleans up old ones.
 */
export const getStoredPollVotes = (): PollVoteStore => {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const item = window.localStorage.getItem(POLL_VOTES_KEY);
        if (!item) return {};

        const allVotes: PollVoteStore = JSON.parse(item);
        const now = Date.now();
        const recentVotes: PollVoteStore = {};
        let needsUpdate = false;

        for (const postId in allVotes) {
            if (Object.prototype.hasOwnProperty.call(allVotes, postId)) {
                const entry = allVotes[postId];
                // Check if the entry is valid and not expired
                if (entry && now - entry.timestamp < MAX_VOTE_AGE_MS) {
                    recentVotes[Number(postId)] = entry;
                } else {
                    needsUpdate = true; // Mark for cleanup
                }
            }
        }

        // If any old entries were found, update localStorage with the cleaned list
        if (needsUpdate) {
            window.localStorage.setItem(
                POLL_VOTES_KEY,
                JSON.stringify(recentVotes)
            );
        }

        return recentVotes;
    } catch (error) {
        logger.error('Failed to parse poll votes from localStorage', error);
        window.localStorage.removeItem(POLL_VOTES_KEY); // Clear corrupted data
        return {};
    }
};

/**
 * Stores a user's poll vote, or their "not-voted" status, in localStorage.
 */
export const storePollVote = (
    postId: number,
    optionId: number | null
): void => {
    if (typeof window === 'undefined') return;

    try {
        const votes = getStoredPollVotes(); // This also triggers a cleanup
        // Store the vote or the explicit "not voted" (null) state
        votes[postId] = {
            optionId,
            timestamp: Date.now(),
        };
        window.localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(votes));
    } catch (error) {
        logger.error('Failed to store poll vote in localStorage', error);
    }
};
