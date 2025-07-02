// sucecho/src/app/components/NewLogo.tsx
"use client";
import LogoSvg from '../assets/logo.svg';

export const Logo = ({ isGlowing = false, className = '' }: { isGlowing?: boolean; className?: string; }) => {
    return (
        <div
            style={{
                filter: isGlowing ? 'drop-shadow(0 0 8px var(--accent))' : 'none',
                transition: 'filter 0.5s ease-in-out',
            }}
            className={className}
        >
            <LogoSvg width="100%" height="100%" />
        </div>
    );
};