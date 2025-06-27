// sucecho/src/app/components/Header.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// NEW: Live Indicator Component with heartbeat and glow effect
const LiveIndicator = () => (
    <div className="flex items-center gap-2 font-mono text-sm text-red-500">
        <motion.div
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{
                scale: [1, 1.4, 1, 1.2, 1], // Heartbeat pulse
                boxShadow: [ // Glowing effect
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                    "0 0 15px rgba(239, 68, 68, 0.9)",
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                    "0 0 10px rgba(239, 68, 68, 0.8)",
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                ]
            }}
            transition={{
                duration: 1.5, // A bit faster for a heartbeat feel
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
        <motion.span
            animate={{
                opacity: [1, 0.8, 1, 1, 0.8]
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            LIVE
        </motion.span>
    </div>
);


export default function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (pathname === '/compose' || pathname.startsWith('/admin-login')) {
        return null;
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const Logo = () => (
        <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
                <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="5 15" />
                <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 10" />
            </svg>
            <span className="text-xl font-bold text-gray-200">南方回音壁</span>
        </div>
    );

    const navLinks = [
        { href: "/how-it-works", label: "运作方式" },
        { href: "/about", label: "关于我们" },
        { href: "/my-echoes", label: "我的回音" },
    ];

    return (
        <header className="container mx-auto max-w-2xl p-4 relative">
            <div className="flex justify-between items-center py-4">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo />
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {pathname === '/' && <LiveIndicator />}
                    <nav className="flex items-center gap-6 font-mono text-lg">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4 md:hidden">
                    {pathname === '/' && <LiveIndicator />}
                    <button onClick={toggleMenu} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-full left-0 right-0 p-4 z-20 rounded-b-lg"
                        style={{ backgroundColor: 'var(--card-background)' }}
                    >
                        <nav className="flex flex-col items-center gap-4 font-mono text-xl">
                            {navLinks.map(link => (
                                <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-gray-200 hover:text-accent transition-colors w-full text-center py-2">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}