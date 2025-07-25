// src/app/components/BottomNavBar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { motion } from 'framer-motion';

const navLinks = [
    { href: "/jobs", label: "谋生墙", iconName: "briefcase" as const, activeColor: 'var(--job-accent)' },
    { href: "/", label: "回音壁", iconName: "zap" as const, activeColor: 'var(--ephemeral-accent)' },
    { href: "/permanent", label: "时光档", iconName: "archive" as const, activeColor: 'var(--permanent-accent)' },
];

export default function BottomNavBar() {
    const pathname = usePathname();

    // Hide the nav bar on pages where it's not needed
    if (pathname.startsWith('/admin') || pathname.startsWith('/post/') || pathname === '/compose' || pathname === '/about' || pathname === '/disclaimer' || pathname === '/how-it-works' || pathname === '/my-echoes' || pathname.startsWith('/jobs/search')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur-lg border-t border-gray-700 flex justify-around items-center z-40">
            {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? '' : 'text-gray-400 hover:text-white'}`}
                        style={{ color: isActive ? link.activeColor : '' }}
                    >
                        <div className="relative">
                            <Icon name={link.iconName} className="w-6 h-6 mb-1" />
                            {isActive && (
                                <motion.div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                    style={{ backgroundColor: link.activeColor }}
                                    layoutId="active-indicator"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </div>
                        <span className="text-xs font-bold">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}