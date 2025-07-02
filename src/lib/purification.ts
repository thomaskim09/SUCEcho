// sucecho/src/lib/purification.ts

interface PurificationInput {
    upvotes: number;
    downvotes: number;
}

interface PurificationStatus {
    shouldPurify: boolean;
    showMeter: boolean;
    meterFillPercentage: number;
}

/**
 * Checks if a post should be purified based on votes and calculates UI display values.
 * This new logic is based on downvote ratios and is configurable via environment variables.
 */
export function checkPurificationStatus(
    input: PurificationInput
): PurificationStatus {
    const { upvotes, downvotes } = input;
    const totalVotes = upvotes + downvotes;

    // Configurable values from environment variables, with sensible defaults.
    const minVotes = parseInt(process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '10', 10);
    const purificationRatio = parseFloat(process.env.NEXT_PUBLIC_PURIFICATION_DOWNVOTE_RATIO || '0.6');
    const meterThresholdRatio = parseFloat(process.env.NEXT_PUBLIC_PURIFICATION_METER_THRESHOLD || '0.4');

    const currentDownvoteRatio = totalVotes > 0 ? downvotes / totalVotes : 0;

    // A post must meet the minimum vote count AND the downvote ratio to be purified.
    const shouldPurify = totalVotes >= minVotes && currentDownvoteRatio >= purificationRatio;

    // The meter should appear if the minimum vote count is met and the downvote ratio exceeds the meter threshold.
    // The UI component will decide whether to show the meter or trigger purification animation based on `shouldPurify` flag.
    const showMeter = totalVotes >= minVotes && currentDownvoteRatio >= meterThresholdRatio;

    let meterFillPercentage = 0;
    if (showMeter) {
        // Calculate how "full" the meter should be. It represents the progress
        // from the meter's appearance threshold to the final purification threshold.
        const range = purificationRatio - meterThresholdRatio;
        const progress = currentDownvoteRatio - meterThresholdRatio;

        if (range > 0) {
            meterFillPercentage = (progress / range) * 100;
        } else if (currentDownvoteRatio >= purificationRatio) {
            // If threshold is gte purification ratio, fill meter completely if it's past the mark.
            meterFillPercentage = 100;
        }
    }
    
    // Ensure percentage is within bounds.
    meterFillPercentage = Math.min(100, Math.max(0, meterFillPercentage));

    return {
        shouldPurify,
        showMeter,
        meterFillPercentage,
    };
}
