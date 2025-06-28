// sucecho/src/app/components/FramerWrapper.tsx
"use client";

import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';

export default function FramerWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const variants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 50,
            filter: 'blur(10px)'
        },
        enter: {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)'
        },
    };

    return (
        <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => window.scrollTo(0, 0)}
        >
            <motion.div
                key={pathname}
                initial="hidden"
                animate="enter"
                variants={variants}
                transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    duration: 0.8
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}