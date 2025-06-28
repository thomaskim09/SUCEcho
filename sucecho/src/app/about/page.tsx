// sucecho/src/app/about/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import logger from '@/lib/logger';

export default function AboutPage() {
    const [logoClicks, setLogoClicks] = useState(0);
    const router = useRouter();
    const requiredClicks = 10;

    useEffect(() => {
        if (logoClicks === requiredClicks) {
            logger.log('Admin login triggered!');
            router.push('/admin-login');
            setLogoClicks(0);
        }
    }, [logoClicks, router]);

    useEffect(() => {
        if (logoClicks > 0) {
            const timer = setTimeout(() => {
                logger.log('Resetting admin click counter.');
                setLogoClicks(0);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [logoClicks]);

    const handleTitleClick = () => {
        setLogoClicks(prevClicks => prevClicks + 1);
    };

    return (
        <div className="container mx-auto max-w-2xl p-4 text-white">
            <header className="py-4">
                <div onClick={handleTitleClick} className="cursor-pointer select-none inline-block">
                    <h1 className="text-3xl font-bold font-mono text-accent mb-4">关于南方回音壁</h1>
                </div>
            </header>
            <main className="space-y-8 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold mb-2">守护者的故事</h2>
                    <p className="mt-4">
                        大家好，我是SUC Echo的创建者，和许多人一样，我曾在主流的社交网络上分享生活，也曾试过用声音与世界连接。但渐渐地，我发现每一个点赞、
                        每一句评论、每一份永久存档的记录，都变成了一种无形的负担。我们开始在意人设，害怕说错话，慢慢地，我们变得越来越不像真实的自己。
                    </p>
                    <p className="mt-4">
                        这个回音壁的诞生，源于一个简单的想法：&quot;我们能不能有一个地方，可以只为“表达”本身而存在？&quot;。在这里，没有身份，只有思想。
                        没有永恒，只有瞬间。每一个声音都拥有平等的24小时生命，然后就会像风中的尘埃一样，干净利落地消散。
                        在这种绝对的短暂面前，去获得最彻底的自由。
                    </p>
                    <p className="mt-4">
                        这是一个能由屏幕前的你和其他社区成员共同维护的地方。最有意义的连接，往往也是最短暂的。最后祝你，玩的愉快
                    </p>
                </section>

                {/* MODIFICATION START: Sections are now separate */}
                <section className="text-center p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">成为守护者</h2>
                    <p className="mb-4">
                        如果认同这个空间的价值，欢迎支持我们，让回音持续。你的支持将帮助我们覆盖服务器成本。
                    </p>
                    <Link
                        href="https://www.kofi.com" // Replace with your actual Ko-fi link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors text-lg"
                    >
                        ☕️ 请我们喝杯Milo冰
                    </Link>
                </section>

                {/* NEW SECTION for cooperation */}
                <section className="text-center p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">联系与合作</h2>
                    <p className="mb-4">
                        如果您有任何商业合作、功能建议或媒体问询，请通过邮件联系我们。
                    </p>
                    <a
                        href="mailto:your.email@example.com?subject=SUC Echo Inquiry"
                        className="inline-block bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors text-lg"
                    >
                        📧 联系我们
                    </a>
                </section>
                {/* MODIFICATION END */}

                <div className="text-center mt-8">
                    <Link href="/" className="text-accent hover:underline">
                        ← 返回回音墙
                    </Link>
                </div>
            </main>
        </div>
    );
}