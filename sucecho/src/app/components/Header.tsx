// sucecho/src/app/components/Header.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    // We won't show the header on the compose page for a more focused writing experience
    if (pathname === '/compose') {
        return null;
    }

    // A simple SVG logo. You can replace this with a more complex one later.
    const Logo = () => (
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
            <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="5 15" />
            <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 10" />
        </svg>
    );


    return (
        <header className="container mx-auto max-w-2xl p-4">
            <div className="flex justify-between items-center py-4">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo />
                </Link>
                <nav className="flex items-center gap-6 font-mono text-lg">
                    <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                        How It Works
                    </Link>
                    <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                        About
                    </Link>
                </nav>
            </div>
        </header>
    );
}