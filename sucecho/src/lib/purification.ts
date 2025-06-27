// sucecho/src/lib/purification.ts

interface PurificationInput {
    upvotes: number;
    downvotes: number;
}

interface PurificationStatus {
    shouldPurify: boolean;
    showMeter: boolean;
    downvotesNeeded: number;
    meterFillPercentage: number;
}

export function checkPurificationStatus(
    input: PurificationInput
): PurificationStatus {
    const { upvotes, downvotes } = input;
    const totalVotes = upvotes + downvotes;

    // --- RULE DEFINITIONS ---
    const minVotesForPurification = parseInt(
        process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '20',
        10
    );
    const downvoteToUpvoteRatio = 2; // Rule: downvotes > upvotes * 2

    // --- CALCULATIONS ---
    const isPastMinVotes = totalVotes >= minVotesForPurification;
    const isRatioMet = downvotes > upvotes * downvoteToUpvoteRatio;

    const shouldPurify = isPastMinVotes && isRatioMet;
    const showMeter = downvotes > upvotes;

    let downvotesNeeded = 0;
    let meterFillPercentage = 0;

    if (showMeter) {
        // Calculate "Downvotes Needed"
        const requiredByRatio = Math.floor(upvotes * downvoteToUpvoteRatio) + 1;
        const neededForRatio = requiredByRatio - downvotes;
        const neededForMinTotal = minVotesForPurification - totalVotes;
        downvotesNeeded = Math.max(0, neededForRatio, neededForMinTotal);

        // Calculate Meter Fill Percentage
        const meterStart = upvotes + 1;
        const meterEnd = requiredByRatio;
        const meterRange = meterEnd - meterStart;
        const currentProgress = downvotes - meterStart;

        if (meterRange > 0) {
            meterFillPercentage = Math.max(
                0,
                Math.min(100, (currentProgress / meterRange) * 100)
            );
        } else if (downvotes >= meterEnd) {
            meterFillPercentage = 100;
        }
    }

    return {
        shouldPurify,
        showMeter,
        downvotesNeeded,
        meterFillPercentage,
    };
}
