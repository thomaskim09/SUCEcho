// sucecho/src/app/components/PurificationParticle.tsx
"use client";

import { motion } from 'framer-motion';

// A single particle that animates outwards
export const Particle = () => {
    const x = (Math.random() - 0.5) * 250; // Horizontal spread
    const y = (Math.random() - 0.5) * 250; // Vertical spread
    const scale = Math.random() * 0.5 + 0.25;
    const duration = 0.5 + Math.random() * 0.5;

    return (
        <motion.div
            className="absolute rounded-full bg-red-500"
            style={{
                width: `${Math.random() * 5 + 2}px`,
                height: `${Math.random() * 5 + 2}px`,
                top: '50%',
                left: '50%',
            }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
                opacity: 0,
                x: x,
                y: y,
                scale: scale,
            }}
            transition={{ duration, ease: "easeOut" }}
        />
    );
};

// The container for all the particles
export const PurificationEffect = () => {
    return (
        <div className="absolute inset-0 z-10">
            {Array.from({ length: 50 }).map((_, i) => (
                <Particle key={i} />
            ))}
        </div>
    );
};