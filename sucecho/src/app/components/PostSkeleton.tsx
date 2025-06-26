export default function PostSkeleton() {
    return (
        <div className="p-4 rounded-lg my-2 animate-pulse" style={{ backgroundColor: 'var(--card-background)' }}>
            <div className="h-20 bg-gray-700 rounded w-full mb-4"></div>
            <div className="flex items-center justify-between text-sm">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-700 rounded w-8"></div>
                    <div className="h-4 bg-gray-700 rounded w-8"></div>
                    <div className="h-4 bg-gray-700 rounded w-8"></div>
                </div>
            </div>
        </div>
    );
}