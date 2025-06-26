// sucecho/src/app/about/page.tsx
"use client"; // Needs to be a client component for hooks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AboutPage() {
    // --- Start of Admin Login Trigger Logic ---
    const [logoClicks, setLogoClicks] = useState(0);
    const router = useRouter();
    const requiredClicks = 10;

    useEffect(() => {
        if (logoClicks === requiredClicks) {
            console.log('Admin login triggered!');
            router.push('/admin-login');
            setLogoClicks(0); // Reset after triggering
        }
    }, [logoClicks, router]);

    useEffect(() => {
        if (logoClicks > 0) {
            const timer = setTimeout(() => {
                console.log('Resetting admin click counter.');
                setLogoClicks(0);
            }, 2000); // 2-second window

            return () => clearTimeout(timer);
        }
    }, [logoClicks]);

    const handleTitleClick = () => {
        setLogoClicks(prevClicks => prevClicks + 1);
    };
    // --- End of Admin Login Trigger Logic ---

    return (
        <div className="container mx-auto max-w-2xl p-4 text-white">
            <header className="py-4">
                {/* The h1 is now the secret trigger */}
                <div onClick={handleTitleClick} className="cursor-pointer select-none inline-block">
                    <h1 className="text-3xl font-bold font-mono text-accent mb-4">关于南方回音壁</h1>
                </div>
            </header>
            <main className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold mb-2">我们的愿景</h2>
                    <p>
                        南方回音壁致力于成为南方大学学院（SUC）最受信任、最具活力的匿名交流平台。这里是一个数字空间，专为分享转瞬即逝的想法、秘密和定义"校园瞬间"的故事而生，无需担心实名制平台带来的社交压力。
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold mb-2">守护者的故事</h2>
                    <p>
                        这个平台源于一个简单的想法：如果有一个空间，可以让我们毫无顾虑地自由发声，不必担心被评判或追责，会怎样？在这个数字足迹永久留存的世界里，我们想创造的不是雕像，而是一道回音。这里，你的声音因内容而被聆听，而非因身份而被定义，每一次发声都将随风而逝，为新的声音让路。
                    </p>
                    <p className="mt-4">
                        这是一个为社区而生、由社区成员打造的热情项目。最有意义的连接，往往也是最短暂的。
                    </p>
                </section>
                <section className="text-center p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">成为守护者</h2>
                    <p className="mb-4">
                        如果你认同这个空间的价值，欢迎支持我们，让回音持续。你的支持将帮助我们覆盖服务器成本，让项目尽可能长时间保持独立与无广告。
                    </p>
                    <Link
                        href="https://www.kofi.com" // Replace with your actual Ko-fi link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-xl"
                    >
                        ☕️ 请我们喝杯Milo冰
                    </Link>
                </section>
                <div className="text-center mt-8">
                    <Link href="/" className="text-accent hover:underline">
                        ← 返回回音墙
                    </Link>
                </div>
            </main>
        </div>
    );
}