// src/app/components/Icon.tsx
import React from 'react';
import { motion } from 'framer-motion'; //

// SvgGlowFilter component (no changes needed here)
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
        <path d="M7 14V3h3v11M10 13.5a4.5 4.5 0 0 0 9 0V8a2 2 0 0 0-2-2h-1.5a2 2 0 0 0-2 2v1.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 .5-.5H18a.5.5 0 0 1 .5.5v5.5a3 3 0 0 1-6 0v-1.5" />
    ),
    'thumb-down': (
        <path d="M7 10v11h3v-11M10 10.5a4.5 4.5 0 0 1 9 0V16a2 2 0 0 1-2 2h-1.5a2 2 0 0 1-2-2v-1.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 0 .5.5H18a.5.5 0 0 0 .5-.5v-5.5a3 3 0 0 0-6 0v1.5" />
    ),
    'comment': (
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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
};

export interface IconProps {
    name: keyof typeof icons;
    className?: string;
    value?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, value }) => {
    const path = icons[name];

    return (
        <div className={`flex items-center gap-2 font-mono ${className}`}>
            <svg
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
                <motion.span key={value} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.2 }}>
                    {value}
                </motion.span>
            )}
        </div>
    );
};