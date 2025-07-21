// sucecho/src/app/components/Icon.tsx
"use client";

import React from 'react';
import { motion } from 'motion/react';

export const SvgGlowFilter = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="glow-white" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    </svg>
);


const icons = {
    'thumb-up': (
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    ),
    'thumb-down': (
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
    ),
    'comment': (
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    ),
    'plus': (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
    'timer': (
        <path d="M10 2h4M12 14v-4M4 14a8 8 0 1 1 16 0A8 8 0 0 1 4 14z" />
    ),
    'share': (
        <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </>
    ),
    'report-flag': (
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    ),
    'menu': (
        <>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </>
    ),
    'info': <><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></>,
    'heart': <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
    'edit': <><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></>,
    'zap': <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>,
    'shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
    'users': <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>,
    'coffee': <><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></>,
    'mail': <><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></>,
    'trash': <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
    'award': (
        <>
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88"></polyline>
        </>
    ),
    'bar-chart': <path d="M3 6h18M3 12h12M3 18h6" />,
    'briefcase': <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></>,
    'archive': <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h10" /></>,
    'star': <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>,
    'star-half': <path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>,
};

export interface IconProps {
    name: keyof typeof icons;
    className?: string;
    value?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, value }) => {
    const path = icons[name];

    return (
        <div className="flex items-center justify-center font-mono">
            <svg
                className={className}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {path}
            </svg>
            {typeof value !== 'undefined' && (
                <motion.span
                    key={value}
                    className="ml-2"
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.2 }}
                >
                    {value}
                </motion.span>
            )}
        </div>
    );
};