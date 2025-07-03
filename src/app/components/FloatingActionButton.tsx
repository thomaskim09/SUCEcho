// sucecho/src/app/components/FloatingActionButton.tsx
"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { useRef } from 'react';

export default function FloatingActionButton() {
    const buttonRef = useRef<HTMLAnchorElement>(null);

    function createRipple(event: React.MouseEvent) {
        const button = buttonRef.current;
        if (!button) return;
        const rippleContainer = button.querySelector('.ripple-container');
        if (!rippleContainer) return;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        circle.classList.add('ripple');
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        rippleContainer.appendChild(circle);
        circle.addEventListener('animationend', () => {
            circle.remove();
        });
    }

    return (
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.08 }}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
            <Link
                href="/compose"
                ref={buttonRef}
                className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full p-4 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 flex items-center justify-center w-16 h-16 press-animation relative overflow-hidden"
                aria-label="发布新回音"
                onClick={createRipple}
            >
                <span className="ripple-container absolute inset-0 pointer-events-none" />
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            </Link>
        </motion.div>
    );
}