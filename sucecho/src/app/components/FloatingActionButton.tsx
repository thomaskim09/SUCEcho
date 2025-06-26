"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FloatingActionButton() {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            className="fixed bottom-6 right-6"
        >
            <Link
                href="/compose"
                className="bg-accent text-white rounded-full p-4 shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center w-16 h-16 press-animation"
                aria-label="发布新回音"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            </Link>
        </motion.div>
    );
}