// sucecho/src/app/page.tsx
import PostFeed from "./components/PostFeed";
import FabContainer from "./components/FabContainer";

export default function Home() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <main className="mt-4">
        <PostFeed />
      </main>
    </div>
  );
}