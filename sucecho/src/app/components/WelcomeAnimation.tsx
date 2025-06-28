// sucecho/src/app/components/WelcomeAnimation.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo'; // Import the new logo

// Particle sub-component with "wind" physics
const Particle = ({ bounds }: { bounds: DOMRect | null }) => {
    // Originate from a random spot within the content's area
    const originX = bounds ? bounds.left + Math.random() * bounds.width : window.innerWidth / 2;
    const originY = bounds ? bounds.top + Math.random() * bounds.height : window.innerHeight / 2;

    // "Wind" effect: A strong horizontal push with some vertical variance
    const windX = 200 + Math.random() * 300; // Drifts strongly to the right
    const windY = (Math.random() - 0.5) * 200; // Drifts slightly up or down

    // Particles are now slower and last longer
    const duration = 1.5 + Math.random() * 1.0;

    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                background: 'var(--accent)',
                width: `${Math.random() * 3 + 1}px`,
                height: 'auto',
                aspectRatio: '1 / 1',
                top: originY,
                left: originX,
            }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
                opacity: 0,
                x: windX,
                y: windY,
                scale: 0,
            }}
            transition={{ duration, ease: "easeOut" }}
        />
    );
};


export default function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [contentBounds, setContentBounds] = useState<DOMRect | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sequence = [
            () => setStep(1),
            () => setStep(2),
            () => setStep(3),
            () => {
                if (contentRef.current) {
                    setContentBounds(contentRef.current.getBoundingClientRect());
                }
                setStep(4);
            },
            () => onComplete(),
        ];

        const delays = [500, 2000, 2500, 2500, 2500]; // Increased final delay for slower particles
        let timeout = 0;
        const timers = delays.map((delay, i) => {
            timeout += delay;
            return setTimeout(sequence[i], timeout);
        });

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999] overflow-hidden">
            <AnimatePresence>
                {step < 4 && (
                    <motion.div
                        ref={contentRef}
                        className="flex flex-col items-center justify-center"
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.8 }} transition={{ duration: 1 }}>
                            <Logo />
                            <h2 className="text-center text-2xl font-bold text-gray-200 mt-2">
                                南方回音壁
                            </h2>
                        </motion.div>
                        <div className="mt-6 text-center font-mono text-xl text-gray-200 h-12">
                            <AnimatePresence mode="wait">
                                {step === 2 && (
                                    <motion.h1 key="line1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        完全匿名，自由发声。
                                    </motion.h1>
                                )}
                                {step === 3 && (
                                    <motion.h1 key="line2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        声音只存在一天。
                                    </motion.h1>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {step === 4 && contentBounds && (
                <>
                    {Array.from({ length: 200 }).map((_, i) => <Particle key={i} bounds={contentBounds} />)}
                </>
            )}
        </div>
    );
}