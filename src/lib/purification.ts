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

export function checkPurificationStatus(
    input: PurificationInput
): PurificationStatus {
    const { upvotes, downvotes } = input;
    const totalVotes = upvotes + downvotes;
    const minVotes = parseInt(
        process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '10',
        10
    );
    const purificationRatio = parseFloat(
        process.env.NEXT_PUBLIC_PURIFICATION_DOWNVOTE_RATIO || '0.6'
    );
    const meterThresholdRatio = parseFloat(
        process.env.NEXT_PUBLIC_PURIFICATION_METER_THRESHOLD || '0.4'
    );
    const currentDownvoteRatio = totalVotes > 0 ? downvotes / totalVotes : 0;
    const shouldPurify =
        totalVotes >= minVotes && currentDownvoteRatio >= purificationRatio;
    const showMeter =
        totalVotes >= minVotes && currentDownvoteRatio >= meterThresholdRatio;
    let meterFillPercentage = 0;
    if (showMeter) {
        const range = purificationRatio - meterThresholdRatio;
        const progress = currentDownvoteRatio - meterThresholdRatio;
        if (range > 0) {
            meterFillPercentage = (progress / range) * 100;
        } else if (currentDownvoteRatio >= purificationRatio) {
            meterFillPercentage = 100;
        }
    }
    meterFillPercentage = Math.min(100, Math.max(0, meterFillPercentage));
    return {
        shouldPurify,
        showMeter,
        meterFillPercentage,
    };
}
