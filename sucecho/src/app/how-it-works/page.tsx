import Link from 'next/link';

export default function HowItWorksPage() {
    return (
        <div className="container mx-auto max-w-2xl p-4 text-white">
            <header className="py-4">
                <h1 className="text-3xl font-bold font-mono text-accent mb-4">How It Works</h1>
            </header>
            <main className="space-y-8">
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">1. Absolute Anonymity</h2>
                    <p className="text-lg">
                        No registration, no logins, no names. Your identity is never requested or stored. We use browser fingerprinting to prevent spam and enable voting, but this identifier is not visible to other users.
                    </p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">2. The 24-Hour Lifecycle</h2>
                    <p className="text-lg">
                        Every post—and all of its replies—is permanently and automatically destroyed 24 hours after it's created. This "cruel aesthetic" ensures that conversations are fresh and that you can speak freely without a permanent record.
                    </p>
                </div>
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">3. Community Sovereignty</h2>
                    <p className="text-lg">
                        You decide what thrives. Upvote content you resonate with and downvote what you don't. Posts that receive a high ratio of downvotes are automatically "purified" and removed by the community itself, not by admins.
                    </p>
                </div>
                <div className="text-center mt-8">
                    <Link href="/" className="text-accent hover:underline">
                        &larr; Back to the Echoes
                    </Link>
                </div>
            </main>
        </div>
    );
}