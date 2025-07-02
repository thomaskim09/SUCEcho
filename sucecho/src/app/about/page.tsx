// sucecho/src/app/about/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import logger from '@/lib/logger';
import { Icon } from '../components/Icon';

export default function AboutPage() {
    const [logoClicks, setLogoClicks] = useState(0);
    const router = useRouter();
    const requiredClicks = 10;

    // Read the environment variable to control the donation section
    const showDonationSection = process.env.NEXT_PUBLIC_ENABLE_DONATIONS === 'true';

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
        <div className="container mx-auto max-w-3xl p-4 text-white">
            <header className="py-4 text-center">
                <div onClick={handleTitleClick} className="cursor-pointer select-none inline-block">
                    <h1 className="text-4xl font-bold font-mono text-accent mb-2">关于SUC Echo</h1>
                </div>
                <p className="text-xl text-gray-400">一个为爱发电的数字空间。</p>
            </header>

            <main className="mt-12 space-y-8">
                {/* Story Section */}
                <section className="glass-card p-8 rounded-lg text-lg leading-relaxed">
                    <h2 className="text-2xl font-bold mb-4 text-center">守护者的故事</h2>
                    <p>
                        大家好，我是SUC Echo的创建者。和许多人一样，我曾在主流社交网络上分享生活，但渐渐地，我发现每一个点赞、每一句评论、每一份永久存档的记录，都变成了一种无形的负担。我们开始在意人设，害怕说错话，慢慢地，我们变得越来越不像真实的自己。
                    </p>
                    <p className="mt-4">
                        这个回音壁的诞生，源于一个简单的想法：“我们能不能有一个地方，可以只为‘表达’本身而存在？”。在这里，没有身份，只有思想；没有永恒，只有瞬间。每一个声音都拥有平等的24小时生命，然后就会像风中的尘埃一样，干净利落地消散。
                    </p>
                    <p className="mt-4">
                        我希望在这种绝对的短暂面前，我们能找回最彻底的自由。祝你，玩得愉快。
                    </p>
                </section>

                {/* Actions Section */}
                <section className={`grid ${showDonationSection ? 'md:grid-cols-2' : 'grid-cols-1'} gap-8 mt-10`}>
                    {showDonationSection && (
                        <div className="glass-card p-6 rounded-lg text-center flex flex-col items-center">
                            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-accent/20 text-accent">
                                <Icon name="coffee" className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">成为守护者</h3>
                            <p className="text-gray-300 mb-4 flex-grow">如果认同这个空间的价值，欢迎支持我们，让回音持续。你的支持将帮助我们覆盖服务器成本。</p>
                            <Link
                                href="https://www.kofi.com" // Replace with your actual Ko-fi link
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors text-lg"
                            >
                                请我们喝杯Milo冰
                            </Link>
                        </div>
                    )}
                    <div className="glass-card p-6 rounded-lg text-center flex flex-col items-center">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-accent/20 text-accent">
                            <Icon name="mail" className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">联系与合作</h3>
                        <p className="text-gray-300 mb-4 flex-grow">如果您有任何商业合作、功能建议,技术报错或媒体问询，请通过邮件与我们取得联系。</p>
                        <a
                            href="mailto:sucecho.info@gmail.com?subject=SUC 回音壁 Inquiry"
                            className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors text-lg"
                        >
                            发送邮件
                        </a>
                    </div>
                </section>

                <div className="text-center mt-12">
                    <Link href="/" className="text-accent hover:underline text-lg">
                        ← 返回回音壁
                    </Link>
                </div>
            </main>
        </div>
    );
}