// sucecho/src/app/components/PageThemeProvider.tsx
"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function PageThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useLayoutEffect(() => {
        const feedType = searchParams.get('feedType');
        const rootElement = document.documentElement;

        rootElement.classList.remove("ephemeral-bg", "jobs-bg", "permanent-bg");

        if ((pathname === '/' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'EPHEMERAL')) {
            rootElement.classList.add("ephemeral-bg");
        } else if ((pathname === '/jobs' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'JOB')) {
            rootElement.classList.add("jobs-bg");
        } else if ((pathname === '/permanent' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'PERMANENT')) {
            rootElement.classList.add("permanent-bg");
        }
    }, [pathname, searchParams]);

    return <>{children}</>;
}