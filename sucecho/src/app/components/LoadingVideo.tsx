// sucecho/src/app/components/LoadingVideo.tsx
"use client";

interface LoadingVideoProps {
    label: string;
}

const LoadingVideo: React.FC<LoadingVideoProps> = ({ label }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <video
                src="/loading.webm"
                autoPlay
                loop
                muted
                playsInline
                className="w-40 h-40"
            />
            <p className="text-gray-400 mt-0 font-mono">{label}</p>
        </div>
    );
};

export default LoadingVideo;