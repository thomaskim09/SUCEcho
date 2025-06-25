// sucecho/src/app/page.tsx
import PostCard from "./components/PostCard";
import Link from "next/link";
import type { PostWithStats } from "@/lib/types";

export default function Home() {
  const samplePost: PostWithStats = {
    id: 1,
    content: "This is a sample echo to check the new component styling. The real feed is coming soon!",
    createdAt: new Date(),
    stats: { upvotes: 12, downvotes: 3, replyCount: 1 }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold font-mono">SUC Echo</h1>
        <Link href="/compose" className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
          Compose
        </Link>
      </header>
      <main className="mt-4">
        <PostCard post={samplePost} />
      </main>
    </div>
  );
}