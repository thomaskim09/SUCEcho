import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="container mx-auto max-w-2xl p-4 text-white">
            <header className="py-4">
                <h1 className="text-3xl font-bold font-mono text-accent mb-4">About SUC Echo</h1>
            </header>
            <main className="space-y-6 text-lg leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold mb-2">Our Vision</h2>
                    <p>
                        SUC Echo aims to be the premier, trusted, and most vibrant anonymous communication platform for the Southern University College (SUC) community. It is a digital space for sharing fleeting thoughts, secrets, and moments that define the "campus moment," free from the social pressures of permanent, real-name platforms.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-bold mb-2">The Guardian's Story</h2>
                    <p>
                        This platform was born from a simple idea: what if we had a space to speak freely, without fear of judgment or consequence? In a world of permanent digital footprints, we wanted to create an echo, not a statue. A place where your voice matters for what it says, not who says it, and where every sound fades to allow new ones to be heard.
                    </p>
                    <p className="mt-4">
                        This is a passion project, built for the community, by a member of the community. It's a testament to the idea that some of the most meaningful connections are the most fleeting.
                    </p>
                </section>
                <section className="text-center p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-2xl font-bold mb-2">Become a Guardian</h2>
                    <p className="mb-4">
                        If you believe in this space, consider helping us keep the echo alive. Your support helps cover server costs and allows this project to remain independent and ad-free for as long as possible.
                    </p>
                    <Link
                        href="https://www.kofi.com" // Replace with your actual Ko-fi link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-xl"
                    >
                        ☕️ Buy us a Coffee
                    </Link>
                </section>
                <div className="text-center mt-8">
                    <Link href="/" className="text-accent hover:underline">
                        &larr; Back to the Echoes
                    </Link>
                </div>
            </main>
        </div>
    );
}