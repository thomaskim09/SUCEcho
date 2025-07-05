// src/app/components/LoadingSpinner.tsx
"use client";

interface LoadingSpinnerProps {
    label: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="w-32 h-32" role="status" aria-label={label}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#9F70FD"
                >
                    <path className="spinner_Uvk8" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" transform="translate(12, 12) scale(0)" />
                    <path className="spinner_Uvk8 spinner_ypeD" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" transform="translate(12, 12) scale(0)" />
                    <path className="spinner_Uvk8 spinner_y0Rj" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z" transform="translate(12, 12) scale(0)" />
                </svg>
            </div>
            <p className="text-gray-400 mt-2 font-mono tracking-wider">{label}</p>
        </div>
    );
};

export default LoadingSpinner;