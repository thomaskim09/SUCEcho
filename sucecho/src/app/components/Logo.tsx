// sucecho/src/app/components/Logo.tsx
"use client";
import { motion } from 'motion/react';

export const Logo = () => (
    <motion.svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
            d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
            d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="5 15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
        />
        <motion.path
            d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="1 10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
        />
    </motion.svg>
);