"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function FramerWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const variants = {
        hidden: { opacity: 0, y: 15 },
        enter: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -15 },
    };

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="hidden"
                animate="enter"
                exit="exit"
                // This is the corrected transition property
                transition={{ type: "tween", ease: "linear", duration: 0.2 }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}