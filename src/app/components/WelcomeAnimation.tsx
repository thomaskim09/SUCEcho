// sucecho/src/app/components/WelcomeAnimation.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

export default function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const [lineFadeOut, setLineFadeOut] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sequence = [
            () => setStep(1),
            () => setStep(2),
            () => setStep(3),
            () => setStep(4),
            () => setFadeOut(true),
        ];

        const delays = [500, 2000, 2500, 2500, 2500];
        let timeout = 0;
        const timers = delays.map((delay, i) => {
            timeout += delay;
            return setTimeout(sequence[i], timeout);
        });

        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (step === 4) {
            const timer = setTimeout(() => {
                setLineFadeOut(true);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setLineFadeOut(false);
        }
    }, [step]);

    useEffect(() => {
        if (fadeOut) {
            const timer = setTimeout(() => {
                onComplete();
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [fadeOut, onComplete]);

    // Helper to render splash content
    const SplashContent = (
        <div className="flex flex-col items-center justify-center">
            <Logo isGlowing={step >= 1} className="w-30 h-30" />
            <h2 className="text-2xl font-bold text-gray-100 tracking-wide font-mono mt-2" style={{ letterSpacing: '0.08em' }}>
                SUC Echo
            </h2>
            <div className="mt-6 text-center font-mono text-xl text-gray-200 h-12">
                <AnimatePresence mode="wait">
                    {step >= 3 && (
                        <motion.h1
                            key="line2-splash"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: lineFadeOut ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                        >
                            谋生 • 短暂 • 永恒
                        </motion.h1>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: fadeOut ? 0 : 1 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999] overflow-hidden"
        >
            {step < 4 && (
                <motion.div
                    ref={contentRef}
                    className="flex flex-col items-center justify-center"
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.8 }} transition={{ duration: 1 }}>
                        <Logo isGlowing={step >= 1} className="w-30 h-30" />
                        <h2 className="text-2xl font-bold text-gray-100 tracking-wide font-mono mt-2" style={{ letterSpacing: '0.08em' }}>
                            SUC Echo
                        </h2>
                    </motion.div>
                    <div className="mt-6 text-center font-mono text-xl text-gray-200 h-12">
                        <AnimatePresence mode="wait">
                            {step === 2 && (
                                <motion.h1 key="line1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    完全匿名，自由发声
                                </motion.h1>
                            )}
                            {step === 3 && (
                                <motion.h1
                                    key="line2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: fadeOut ? 0 : 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1 }}
                                >
                                    谋生 • 短暂 • 永恒
                                </motion.h1>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
            {step === 4 && (
                <div className="vanish-container flex flex-col items-center justify-center w-full h-full">
                    {SplashContent}
                </div>
            )}
        </motion.div>
    );
}