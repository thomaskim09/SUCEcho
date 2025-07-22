// sucecho/src/hooks/useCountdown.ts
import { useState, useEffect } from 'react';

export const useCountdown = (
    createdAt: Date,
    feedType: 'EPHEMERAL' | 'PERMANENT' | 'JOB'
) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(createdAt).getTime() + twentyFourHours;
    const vanishTime = expiresAt + 4500;

    const [timeLeft, setTimeLeft] = useState(expiresAt - new Date().getTime());
    const [isVanishing, setIsVanishing] = useState(false);

    useEffect(() => {
        if (feedType !== 'EPHEMERAL') return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const newTimeLeft = expiresAt - now;
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0 && now >= vanishTime) {
                setIsVanishing(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, vanishTime, feedType]);

    if (feedType === 'PERMANENT' || feedType === 'JOB') {
        return {
            countdownText: '',
            colorClass: 'text-gray-400',
            isExpired: false,
            isVanishing: false,
            isCritical: false,
        };
    }

    const isExpired = timeLeft <= 0;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    let countdownText = '心间回音，限定消散。';
    let colorClass = 'expired-text-glow';

    const isCritical = !isExpired && timeLeft <= 10000;

    if (!isExpired) {
        if (hours > 0) {
            countdownText = `余 ${hours} 时`;
        } else if (minutes > 0) {
            countdownText = `余 ${minutes} 分`;
        } else {
            countdownText = `${seconds}秒`;
        }

        if (isCritical) {
            colorClass = 'text-countdown-critical';
        } else if (hours < 1 && minutes >= 15) {
            colorClass = 'text-countdown-hour';
        } else if (hours < 3) {
            colorClass = 'text-countdown-soon';
        } else {
            colorClass = 'text-gray-400';
        }
    }

    return { countdownText, colorClass, isExpired, isVanishing, isCritical };
};
