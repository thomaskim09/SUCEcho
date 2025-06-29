// sucecho/src/hooks/useCountdown.ts
import { useState, useEffect } from 'react';

/**
 * A custom hook to manage a countdown timer for a post.
 * @param {Date} createdAt - The creation date of the post.
 * @returns {{countdownText: string, colorClass: string, isExpired: boolean, isVanishing: boolean}} - The display text, color class, and expiration status.
 */
export const useCountdown = (createdAt: Date) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(createdAt).getTime() + twentyFourHours;
    const vanishTime = expiresAt + 4500; // Vanish 4.5 seconds after expiration (3s delay + 1.5s glitch)

    const [timeLeft, setTimeLeft] = useState(expiresAt - new Date().getTime());
    const [isVanishing, setIsVanishing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const newTimeLeft = expiresAt - now;
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0 && now >= vanishTime) {
                setIsVanishing(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, vanishTime]);

    const isExpired = timeLeft <= 0;

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    let countdownText = '心间回音，限定消散。'; // Updated text
    let colorClass = 'expired-text-glow'; // New class for glowing text

    const isCritical = !isExpired && timeLeft <= 10000; // Last 10 seconds

    if (!isExpired) {
        if (hours > 0) {
            countdownText = `余 ${hours} 时`;
        } else if (minutes > 0) {
            countdownText = `余 ${minutes} 分`;
        } else {
            countdownText = `${seconds}s`;
        }

        // Reset colorClass if not expired
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
