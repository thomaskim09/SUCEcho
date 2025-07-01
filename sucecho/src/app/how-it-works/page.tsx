// sucecho/src/app/how-it-works/page.tsx
import Link from 'next/link';
import { Icon } from '../components/Icon'; // Make sure the path is correct

const FeatureCard = ({ iconName, title, children }: { iconName: React.ComponentProps<typeof Icon>['name'], title: string, children: React.ReactNode }) => (
    <div className="glass-card p-6 rounded-lg flex flex-col items-center text-center">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-accent/20 text-accent">
            <Icon name={iconName} className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-lg text-gray-300 leading-relaxed">
            {children}
        </p>
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
                    每一条回音及其所有回复将在创建24小时后自动、彻底地销毁。这种“残酷美学”保证了对话的新鲜感，让你无惧永久记录。
                </FeatureCard>
                <FeatureCard iconName="shield" title="绝对匿名">
                    无需注册，无需登录。我们仅用浏览器指纹防止刷屏和实现投票，但这个标识不会对其他用户可见，让你真正地畅所欲言。
                </FeatureCard>
                <FeatureCard iconName="users" title="社区主权">
                    你决定什么内容被保留。当一条回音的倒赞比例过高时，系统将自动“净化”并移除它。权力，掌握在社区手中。
                </FeatureCard>
            </main>
            <div className="text-center mt-12">
                <Link href="/" className="text-accent hover:underline text-lg">
                    ← 返回回音壁
                </Link>
            </div>
        </div>
    );
}