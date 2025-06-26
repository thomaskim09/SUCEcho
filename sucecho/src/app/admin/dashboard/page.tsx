// sucecho/src/app/admin/dashboard/page.tsx
import Link from 'next/link';

export default function AdminDashboardPage() {
    return (
        <div className="container mx-auto max-w-4xl p-4 text-white">
            <header className="py-4">
                <h1 className="text-3xl font-bold font-mono text-accent mb-4">Admin Dashboard</h1>
                <p>Welcome, Guardian. This is your command center.</p>
            </header>

            <nav className="mt-8">
                <ul className="space-y-4">
                    <li>
                        <Link href="/admin/reports" className="text-lg text-accent hover:underline">
                            View Reports
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/users" className="text-lg text-accent hover:underline">
                            Manage Users
                        </Link>
                    </li>
                    {/* We will add more links here as we build features */}
                </ul>
            </nav>

            <div className="mt-12">
                <form action="/api/admin/logout" method="post">
                    <button
                        type="submit"
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </form>
            </div>
        </div>
    );
}