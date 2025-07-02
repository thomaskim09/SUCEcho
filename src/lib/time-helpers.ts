// sucecho/src/lib/time-helpers.ts

/**
 * Converts a Date object into a relative time string (e.g., "5分钟前").
 * @param {Date} date - The date to convert.
 * @returns {string} A relative time string.
 */
export const timeSince = (date: Date): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + '年前';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + '个月前';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + '天前';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + '小时前';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + '分钟前';

    return Math.floor(seconds) + '秒前';
};
