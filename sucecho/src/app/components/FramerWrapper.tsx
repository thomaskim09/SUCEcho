// sucecho/src/app/components/FramerWrapper.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function FramerWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const variants = {
        hidden: { opacity: 0, y: 50 },    // Start 50px below and fully transparent
        enter: { opacity: 1, y: 0 },       // Animate to original position and fully opaque
        exit: { opacity: 0, y: -50 },   // Animate 50px upwards and fade out
    };

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="hidden"
                animate="enter"
                exit="exit"
                transition={{ type: "tween", ease: "easeInOut", duration: 1 }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}