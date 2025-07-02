// sucecho/src/app/components/PurificationParticle.tsx
"use client";

import { motion } from 'motion/react';

// A single particle that animates outwards
export const Particle = () => {
    const x = (Math.random() - 0.5) * 300; // Horizontal spread
    const y = (Math.random() - 0.5) * 300; // Vertical spread
    const scale = Math.random() * 0.7 + 0.1;
    const duration = 0.6 + Math.random() * 0.4;

    return (
        <motion.div
            className="absolute rounded-full bg-accent"
            style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
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
            {Array.from({ length: 70 }).map((_, i) => (
                <Particle key={i} />
            ))}
        </div>
    );
};