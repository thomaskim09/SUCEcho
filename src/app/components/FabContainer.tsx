// src/app/components/FabContainer.tsx
"use client"

import { useAdmin } from "@/context/AdminContext"
import FloatingActionButton from "./FloatingActionButton"
import dynamic from 'next/dynamic';
const AdminShield = dynamic(() => import('./AdminShield'), {
    ssr: false
});
import { usePathname } from "next/navigation"

export default function FabContainer() {
    const { isAdmin } = useAdmin();
    const pathname = usePathname();

    const isHomePage = pathname === '/';
    const isPostPage = pathname.startsWith('/post/');

    if (pathname.startsWith('/admin') || pathname === '/compose') {
        return null;
    }

    const FabToShow = () => {
        if (isHomePage) {
            return (
                <FloatingActionButton
                    href="/compose"
                    iconName="plus"
                    ariaLabel="发布新回音"
                />
            );
        }
        if (isPostPage) {
            const postId = pathname.split('/')[2];
            return (
                <FloatingActionButton
                    href={`/compose?parentPostId=${postId}`}
                    iconName="comment"
                    ariaLabel="回复此回音"
                />
            );
        }
        return null;
    };

    const fab = FabToShow();

    if (fab || isAdmin) {
        return (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-4">
                {fab}
                {isAdmin && <AdminShield />}
            </div>
        )
    }

    return null;
}   