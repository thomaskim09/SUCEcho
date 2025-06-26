import PostFeed from "./components/PostFeed";
import FloatingActionButton from "./components/FloatingActionButton";

// We no longer need getPosts() here, simplifying the page significantly.

export default function Home() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <main className="mt-4">
        {/* The PostFeed component will now handle all of its own data needs. */}
        <PostFeed />
      </main>
      <FloatingActionButton />
    </div>
  );
}