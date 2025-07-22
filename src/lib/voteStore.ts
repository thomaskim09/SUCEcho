// src/lib/voteStore.ts

const VOTES_KEY = 'user_votes';
const MAX_VOTE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type VoteEntry = {
    postId: number;
    voteType: 1 | -1;
    timestamp: number;
};

/**
 * Retrieves votes from the last 24 hours from localStorage.
 * @returns {Record<number, 1 | -1>} A map of post IDs to vote types.
 */
export const getStoredVotes = (): Record<number, 1 | -1> => {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const item = window.localStorage.getItem(VOTES_KEY);
        if (!item) return {};

        const allEntries: VoteEntry[] = JSON.parse(item);
        const now = Date.now();

        const recentEntries = allEntries.filter(
            (entry) => now - entry.timestamp < MAX_VOTE_AGE_MS
        );

        if (recentEntries.length < allEntries.length) {
            window.localStorage.setItem(
                VOTES_KEY,
                JSON.stringify(recentEntries)
            );
        }

        const votes: Record<number, 1 | -1> = {};
        for (const entry of recentEntries) {
            votes[entry.postId] = entry.voteType;
        }
        return votes;
    } catch (error) {
        console.error('Failed to parse votes from localStorage', error);
        window.localStorage.removeItem(VOTES_KEY);
        return {};
    }
};

/**
 * Stores a user's vote in localStorage.
 * @param {number} postId The ID of the post.
 * @param {1 | -1 | undefined} voteType The type of vote (1 for upvote, -1 for downvote, undefined to remove).
 */
export const storeVote = (
    postId: number,
    voteType: 1 | -1 | undefined
): void => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const votes = getStoredVotes();
        if (voteType) {
            votes[postId] = voteType;
        } else {
            delete votes[postId];
        }

        const newEntries: VoteEntry[] = Object.entries(votes).map(
            ([id, type]) => ({
                postId: Number(id),
                voteType: type as 1 | -1,
                timestamp: Date.now(),
            })
        );

        window.localStorage.setItem(VOTES_KEY, JSON.stringify(newEntries));
    } catch (error) {
        console.error('Failed to store vote in localStorage', error);
    }
};
