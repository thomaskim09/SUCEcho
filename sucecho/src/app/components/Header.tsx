// sucecho/src/app/components/Header.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { useTabLeaderContext } from './TabLeaderProvider';
import MultiTabAlert from './MultiTabAlert';
import { useRealtimeStatus } from '@/context/RealtimeStatusContext';

const LiveIndicator = () => (
    <div className="flex items-center gap-2 font-mono text-sm text-red-500">
        <motion.div
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{
                scale: [1, 1.4, 1, 1.2, 1],
                boxShadow: [
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                    "0 0 15px rgba(239, 68, 68, 0.9)",
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                    "0 0 10px rgba(239, 68, 68, 0.8)",
                    "0 0 5px rgba(239, 68, 68, 0.7)",
                ]
            }}
            transition={{
                duration: 1.5,
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
    const { isTabLeader, multiTabAllowed, tabLeaderChecked } = useTabLeaderContext();
    const { isSubscribed } = useRealtimeStatus();

    if (!tabLeaderChecked) {
        return null;
    }

    if (pathname === '/compose' || pathname.startsWith('/admin-login')) {
        return null;
    }

    const showMultitabAlert = tabLeaderChecked && !multiTabAllowed && !isTabLeader;

    const navLinks = [
        { href: "/how-it-works", label: "运作方式", iconName: "info" as const },
        { href: "/about", label: "关于我们", iconName: "heart" as const },
        { href: "/my-echoes", label: "我的回音", iconName: "edit" as const },
        { href: "/disclaimer", label: "免责声明", iconName: "shield" as const },
    ];

    return (
        <>
            {tabLeaderChecked && <MultiTabAlert visible={showMultitabAlert} />}
            <header className="container mx-auto max-w-2xl py-2 px-4 relative">
                <div className="flex justify-between items-center py-2">
                    <Link href="/" className="hover:opacity-80 transition-opacity" onClick={() => setIsMenuOpen(false)}>
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 120, ease: "linear", repeat: Infinity }}
                                className="w-8 h-8"
                            >
                                <Logo className="w-8 h-8" />
                            </motion.div>
                            <span className="text-xl font-bold text-gray-200">南方回音壁</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <AnimatePresence>
                            {isSubscribed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <LiveIndicator />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <nav className="flex items-center gap-6 font-mono text-lg">
                            {navLinks.map(link => (
                                <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 md:hidden">
                        <AnimatePresence>
                            {isSubscribed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <LiveIndicator />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent">
                            <Icon name="menu" />
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
                            className="md:hidden absolute top-full left-0 right-0 p-4 z-20 rounded-b-lg glass-card"
                        >
                            <nav className="flex flex-col items-center gap-4 font-mono text-xl">
                                {navLinks.map(link => (
                                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-gray-200 hover:text-accent transition-colors w-full text-center py-2 flex items-center justify-center gap-3">
                                        <Icon name={link.iconName} />
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}