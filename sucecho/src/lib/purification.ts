// sucecho/src/lib/purification.ts

interface PurificationInput {
    upvotes: number;
    downvotes: number;
}

// REMOVED: `downvotesNeededText` is no longer part of the return signature.
interface PurificationStatus {
    shouldPurify: boolean;
    showMeter: boolean;
    meterFillPercentage: number;
}

/**
 * Checks if a post should be purified based on votes and calculates UI display values.
 */
export function checkPurificationStatus(
    input: PurificationInput
): PurificationStatus {
    const { upvotes, downvotes } = input;
    const totalVotes = upvotes + downvotes;

    const minVotesForPurification = parseInt(
        process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '20',
        10
    );
    const downvoteToUpvoteRatio = 2;

    const isRatioMet = downvotes > upvotes * downvoteToUpvoteRatio;
    const isTotalVotesMet = totalVotes >= minVotesForPurification;
    const shouldPurify = isRatioMet && isTotalVotesMet;

    const showMeter = downvotes > upvotes && !shouldPurify && isTotalVotesMet;

    let meterFillPercentage = 0;

    if (showMeter) {
        const progressToMinVotes = (totalVotes / minVotesForPurification) * 100;
        const targetDownvotesForRatio =
            Math.floor(upvotes * downvoteToUpvoteRatio) + 1;
        const currentDownvotesProgress = Math.max(0, downvotes - upvotes);
        const requiredDownvoteRange = targetDownvotesForRatio - upvotes;

        const progressToRatio =
            requiredDownvoteRange > 0
                ? (currentDownvotesProgress / requiredDownvoteRange) * 100
                : 100;

        meterFillPercentage = Math.min(progressToMinVotes, progressToRatio);
    }

    return {
        shouldPurify,
        showMeter,
        meterFillPercentage,
    };
}
