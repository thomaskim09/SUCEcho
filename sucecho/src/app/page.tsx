// sucecho/src/app/page.tsx
import PostFeed from "./components/PostFeed";
import Link from "next/link";
import type { PostWithStats } from "@/lib/types";

async function getPosts(): Promise<PostWithStats[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to fetch initial posts:', await res.text());
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error in getPosts:', error);
    return [];
  }
}

export default async function Home() {
  const initialPosts = await getPosts();

  return (
    <div className="container mx-auto max-w-2xl p-4">
      {/* The old header is removed, as the new Header component in layout.tsx handles it. */}
      <main className="mt-4">
        <PostFeed initialPosts={initialPosts} />
      </main>
      {/* Add a Floating Action Button for composing new posts */}
      <div className="fixed bottom-6 right-6">
        <Link
          href="/compose"
          className="bg-accent text-white rounded-full p-4 shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center w-16 h-16"
          aria-label="Compose a new echo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        </Link>
      </div>
    </div>
  );
}