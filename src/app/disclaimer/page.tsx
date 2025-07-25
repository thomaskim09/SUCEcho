// sucecho/src/app/disclaimer/page.tsx
import Link from 'next/link';
import { Icon } from '../components/Icon';

export default function DisclaimerPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 text-white">
            <header className="py-4 text-center">
                <h1 className="text-4xl font-bold font-mono text-accent mb-2">免责声明</h1>
                <p className="text-xl text-gray-400">使用本网站前，请仔细阅读以下条款。</p>
            </header>

            <main className="mt-12 space-y-8 text-lg leading-relaxed">
                <section className="glass-card p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Icon name="users" /> 1. 用户内容与责任
                    </h2>
                    <p>
                        SUC Echo（以下简称“本平台”）是一个提供匿名信息分享的空间。所有发布于本平台的内容，包括文字、链接等，均由用户自行发布，并由其独立承担全部法律责任。本平台作为信息存储空间服务提供者，不对任何用户发布的内容的真实性、合法性、准确性或有效性负责，也不代表本平台的观点或立场。
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
                        <Icon name="shield" /> 2. 平台权利与义务
                    </h2>
                    <p>
                        本平台尊重并保护所有用户的言论自由，但此自由不应侵犯他人合法权益。根据本平台的“社区主权”原则，用户可以通过投票系统对内容进行管理。同时，本平台保留对违反国家法律法规、侵犯他人隐私、含有恶意攻击或人身骚扰、以及其他不适宜内容的帖子进行删除或处理的权利，但并无义务对所有内容进行主动审查。所有帖子将在发布24小时后被系统自动永久删除。
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
                        <Icon name="zap" /> 3. 责任限制
                    </h2>
                    <p>
                        本平台按“现状”和“现有”基础提供服务，不提供任何形式的明示或默示的担保。在任何情况下，对于因使用或无法使用本平台服务而导致的任何直接、间接、偶然、特殊或后果性的损害，本平台及其创建者均不承担任何责任。
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
                        <Icon name="info" /> 4. 条款接受
                    </h2>
                    <p>
                        您继续使用本平台，即表示您已阅读、理解并同意接受本免责声明的全部内容。如果您不同意，请立即停止使用本平台。
                    </p>
                </section>

                <div className="text-center mt-12 pb-12">
                    <Link href="/" className="text-accent hover:underline text-lg inline-flex items-center gap-2">
                        <Icon name="arrow-left" />
                        <span>返回回音壁</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}