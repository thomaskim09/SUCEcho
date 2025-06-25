// sucecho/src/app/compose/page.tsx
import CreatePostForm from "../components/CreatePostForm";

export default function ComposePage() {
    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4">
                <h1 className="text-2xl font-bold font-mono">Compose a New Echo</h1>
            </header>
            <main className="mt-4">
                <CreatePostForm />
            </main>
        </div>
    );
}