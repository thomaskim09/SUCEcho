import Link from 'next/link';

export default function HowItWorksPage() {
    return (
        <div className="container mx-auto max-w-2xl p-4 text-white">
            <header className="py-4">
                <h1 className="text-3xl font-bold font-mono text-accent mb-4">运作方式</h1>
            </header>
            <main className="space-y-8">
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">绝对匿名</h2>
                    <p className="text-lg">
                        无需注册，无需登录，无需姓名。你的身份信息从不被请求或存储。我们仅用浏览器指纹防止刷屏和实现投票，但这个标识不会对其他用户可见。
                    </p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">24小时生命周期</h2>
                    <p className="text-lg">
                        每一条回音及其所有回复将在创建后24小时自动彻底销毁。这种“残酷美学”保证了对话的新鲜感，让你可以无所顾忌地表达，无需担心永久记录。
                    </p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">社区主权</h2>
                    <p className="text-lg">
                        你决定什么内容被保留。喜欢的内容请点赞，不喜欢的请点倒赞。当一条回音的倒赞比例过高时，系统会自动“净化”并移除该内容，由社区而非管理员决定内容去留。
                    </p>
                </div>
                <div className="text-center mt-8">
                    <Link href="/" className="text-accent hover:underline">
                        ← 返回回音壁
                    </Link>
                </div>
            </main>
        </div>
    );
}