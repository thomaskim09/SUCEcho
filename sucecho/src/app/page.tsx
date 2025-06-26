// sucecho/src/app/page.tsx
import PostCard from "./components/PostCard";
import Link from "next/link";
import type { PostWithStats } from "@/lib/types";

// This function fetches posts from our API
async function getPosts(): Promise<PostWithStats[]> {
  // We use { cache: 'no-store' } to ensure we always get the latest posts
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, { cache: 'no-store' });
  if (!res.ok) {
    // This will be caught by the error page and should be handled gracefully
    throw new Error('Failed to fetch posts');
  }
  return res.json();
}


export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold font-mono">SUC Echo</h1>
        <Link href="/compose" className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
          Compose
        </Link>
      </header>
      <main className="mt-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <p className="text-center text-gray-400">No echoes yet. Be the first!</p>
        )}
      </main>
    </div>
  );
}