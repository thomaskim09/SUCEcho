// src/app/components/FabContainer.tsx
"use client"

import { useAdmin } from "@/context/AdminContext"
import FloatingActionButton from "./FloatingActionButton"
import dynamic from 'next/dynamic';
const AdminShield = dynamic(() => import('./AdminShield'), {
    ssr: false
});
import { usePathname, useSearchParams } from "next/navigation"
import Tooltip from './Tooltip';
import { useEffect, useState, useCallback } from 'react';

export default function FabContainer() {
    const { isAdmin } = useAdmin();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isHomePage = pathname === '/';
    const isPostPage = pathname.startsWith('/post/');
    const isJobsPage = pathname.startsWith('/jobs');
    const isPermanentPage = pathname.startsWith('/permanent');

    // Tooltip state and localStorage keys
    const [showFabTip, setShowFabTip] = useState(false);
    const [showReplyTip, setShowReplyTip] = useState(false);
    const FAB_TIP_KEY = 'hasSeenFabTip';
    const REPLY_TIP_KEY = 'hasSeenReplyFabTip';

    const handleFabTipClose = useCallback(() => {
        setShowFabTip(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem(FAB_TIP_KEY, 'true');
        }
    }, []);
    const handleReplyTipClose = useCallback(() => {
        setShowReplyTip(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem(REPLY_TIP_KEY, 'true');
        }
    }, []);

    // Show tooltip only if not seen before, with 3s delay for FAB, and auto-dismiss after 5s
    useEffect(() => {
        let showTimer: NodeJS.Timeout | null = null;
        const hideTimer: NodeJS.Timeout | null = null;
        if (isHomePage && typeof window !== 'undefined') {
            if (localStorage.getItem(FAB_TIP_KEY) !== 'true') {
                showTimer = setTimeout(() => setShowFabTip(true), 3000);
            }
        } else if (isPostPage && typeof window !== 'undefined') {
            if (localStorage.getItem(REPLY_TIP_KEY) !== 'true') {
                showTimer = setTimeout(() => setShowReplyTip(true), 3000);
            }
        }
        return () => {
            if (showTimer) clearTimeout(showTimer);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [isHomePage, isPostPage, pathname]);

    useEffect(() => {
        let hideTimer: NodeJS.Timeout | null = null;
        if (showFabTip) {
            hideTimer = setTimeout(() => handleFabTipClose(), 5000);
        }
        return () => { if (hideTimer) clearTimeout(hideTimer); };
    }, [showFabTip, handleFabTipClose]);
    useEffect(() => {
        let hideTimer: NodeJS.Timeout | null = null;
        if (showReplyTip) {
            hideTimer = setTimeout(() => handleReplyTipClose(), 5000);
        }
        return () => { if (hideTimer) clearTimeout(hideTimer); };
    }, [showReplyTip, handleReplyTipClose]);

    if (pathname.startsWith('/admin') || pathname === '/compose') {
        return null;
    }

    const FabToShow = () => {
        if (isHomePage) {
            return (
                <div className="relative flex items-center">
                    <FloatingActionButton
                        href="/compose"
                        iconName="plus"
                        ariaLabel="发布新回音"
                    />
                    <Tooltip
                        content={"点击这里可以发布新的回音"}
                        isVisible={showFabTip}
                        onClose={handleFabTipClose}
                        position="left"
                    />
                </div>
            );
        }
        if (isPostPage) {
            const postId = pathname.split('/')[2];
            const feedType = searchParams.get('feedType') || 'EPHEMERAL';

            return (
                <div className="relative flex items-center">
                    <FloatingActionButton
                        href={`/compose?parentPostId=${postId}&feedType=${feedType}`}
                        iconName="comment"
                        ariaLabel="回复此回音"
                    />
                    <Tooltip
                        content={"点击这里可以回复此回音"}
                        isVisible={showReplyTip}
                        onClose={handleReplyTipClose}
                        position="left"
                    />
                </div>
            );
        }
        if (isJobsPage) {
            return (
                <FloatingActionButton
                    href="/compose?feedType=JOB"
                    iconName="plus"
                    ariaLabel="发布新职位"
                />
            );
        }
        if (isPermanentPage) {
            return (
                <FloatingActionButton
                    href="/compose?feedType=PERMANENT"
                    iconName="plus"
                    ariaLabel="发布新档案"
                />
            );
        }
        return null;
    };

    const fab = FabToShow();
    const hasBottomNav = isHomePage || isJobsPage || isPermanentPage || pathname === "/my-echoes";
    const fabContainerClass = `fixed right-6 z-50 flex flex-col-reverse items-center gap-4 ${hasBottomNav ? "bottom-20" : "bottom-6"}`;

    if (fab || isAdmin) {
        return (
            <div className={fabContainerClass}>
                {fab}
                {isAdmin && <AdminShield />}
            </div>
        )
    }

    return null;
}