// sucecho/src/app/how-it-works/page.tsx
"use client";

import Link from 'next/link';
import { Icon } from '../components/Icon'; // Make sure the path is correct
import { useState, useRef, useLayoutEffect } from 'react';

const FeatureCard = ({ iconName, title, children }: { iconName: React.ComponentProps<typeof Icon>['name'], title: string, children: React.ReactNode }) => (
    <div className="glass-card p-6 rounded-lg flex flex-col items-center text-center">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-accent/20 text-accent">
            <Icon name={iconName} />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <div className="text-lg text-gray-300 leading-relaxed">
            {children}
        </div>
    </div>
);

export default function HowItWorksPage() {
    return (
        <div className="container mx-auto max-w-4xl p-4 text-white">
            <header className="py-4 text-center">
                <h1 className="text-4xl font-bold font-mono text-accent mb-2">运作方式</h1>
                <p className="text-xl text-gray-400">了解SUC Echo的核心法则。</p>
            </header>
            <main className="mt-12 space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
                <FeatureCard iconName="zap" title="短暂存在">
                    在「回音壁」中，每一条声音都拥有24小时的生命。时限一到，它将连同所有回复，被彻底销毁。这种“阅后即焚”的设定，是为你卸下包袱，让你能在这里畅所欲言。
                </FeatureCard>
                <FeatureCard iconName="shield" title="绝对匿名">
                    无需注册，无需登录。系统仅用浏览器指纹防止刷屏和实现投票，但这个标识不会对其他用户可见，让你真正地畅所欲言。
                </FeatureCard>
                <FeatureCard iconName="users" title="社区主权">
                    你决定什么内容被保留。当一条回音的倒赞比例过高时，系统将自动&quot;净化&quot;并移除它。权力，掌握在社区手中。
                    <div className="mt-4">
                        <PurificationLogicAccordion />
                    </div>
                </FeatureCard>
            </main>
            <div className="text-center mt-12 pb-12">
                <Link href="/" className="text-accent hover:underline text-lg inline-flex items-center gap-2">
                    <Icon name="arrow-left" />
                    <span>返回回音壁</span>
                </Link>
            </div>
        </div>
    );
}

function PurificationLogicAccordion() {
    const [open, setOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState(0);

    // Update maxHeight dynamically for smooth open/close
    useLayoutEffect(() => {
        if (open && contentRef.current) {
            setMaxHeight(contentRef.current.scrollHeight);
        } else {
            setMaxHeight(0);
        }
    }, [open]);

    // Read env vars (Next.js exposes NEXT_PUBLIC_ vars to the browser)
    const minVotes = parseInt(process.env.NEXT_PUBLIC_PURIFICATION_MIN_VOTES || '10', 10);
    const downvoteRatio = parseFloat(process.env.NEXT_PUBLIC_PURIFICATION_DOWNVOTE_RATIO || '0.6');
    const ratioPercent = Math.round(downvoteRatio * 100);

    return (
        <div>
            <button
                className="w-full flex justify-center items-center text-accent hover:underline underline focus:outline-none text-base font-semibold mb-1 transition-colors duration-200"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                type="button"
                style={{ textAlign: 'center' }}
            >
                <span className="flex items-center justify-center w-full block text-center underline">
                    <span
                        className="inline-block transition-transform duration-300"
                        style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                        <Icon name="info" className="w-5 h-5" />
                    </span>
                    <span className="ml-1">最新净化机制</span>
                </span>
            </button>
            <div
                className="overflow-hidden transition-all"
                style={{
                    maxHeight: maxHeight,
                    opacity: open ? 1 : 0,
                    transition: 'max-height 1.2s cubic-bezier(0.4,0,0.2,1), opacity 1.2s',
                }}
            >
                <div ref={contentRef} className="mt-2 p-4 rounded bg-accent/10 text-gray-200 text-sm text-left">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <span className="text-accent font-bold">总赞数</span> ≥ <span className="text-accent font-bold">{minVotes}</span>
                        </li>
                        <li>
                            <span className="text-accent font-bold">倒赞比例</span> ≥ <span className="text-accent font-bold">{ratioPercent}%</span>
                        </li>
                        <li>
                            满足以上条件即自动<span className="text-accent font-bold">净化</span>，回音与回复会被移除
                        </li>
                    </ul>
                    <p className="mt-2 text-accent">社区共同决定内容，防止恶意信息。</p>
                </div>
            </div>
        </div>
    );
}