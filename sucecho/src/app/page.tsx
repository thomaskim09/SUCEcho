// sucecho/src/app/page.tsx
import PostFeed from "./components/PostFeed";
import Link from "next/link";
import type { PostWithStats } from "@/lib/types";

// The function to get initial posts remains the same
async function getPosts(): Promise<PostWithStats[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to fetch initial posts:', await res.text());
      return []; // Return an empty array on failure
    }
    return res.json();
  } catch (error) {
    console.error('Error in getPosts:', error);
    return []; // Return an empty array on network or other errors
  }
}

export default async function Home() {
  const initialPosts = await getPosts();

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold font-mono">SUC Echo</h1>
        <Link href="/compose" className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
          Compose
        </Link>
      </header>
      <main className="mt-4">
        {/* We now render the PostFeed component and pass the initial posts as a prop */}
        <PostFeed initialPosts={initialPosts} />
      </main>
    </div>
  );
}