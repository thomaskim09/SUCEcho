// src/app/components/PageThemeProvider.tsx
"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function PageThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useLayoutEffect(() => {
        const feedType = searchParams.get('feedType');
        document.body.classList.remove("ephemeral-bg", "jobs-bg", "permanent-bg");
        if ((pathname === '/' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'EPHEMERAL')) {
            document.body.classList.add("ephemeral-bg");
        } else if ((pathname === '/jobs' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'JOB')) {
            document.body.classList.add("jobs-bg");
        } else if ((pathname === '/permanent' || (pathname.startsWith('/post/') || pathname.startsWith('/compose')) && feedType === 'PERMANENT')) {
            document.body.classList.add("permanent-bg");
        }
    }, [pathname, searchParams]);

    return <>{children}</>;
}