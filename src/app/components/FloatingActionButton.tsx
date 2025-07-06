// src/app/components/FloatingActionButton.tsx
"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { useRef } from 'react';
import { Icon, IconProps } from './Icon';

interface FabProps {
    href: string;
    iconName: IconProps['name'];
    ariaLabel: string;
}

export default function FloatingActionButton({ href, iconName, ariaLabel }: FabProps) {
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
            initial={{ scale: 0, y: 50 }}
            animate={{
                scale: [1, 1.07, 1],
                y: [0, 0, 0],
            }}
            transition={{
                type: "tween",
                ease: "easeInOut",
                duration: 3,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.5
            }}
        >
            <Link
                href={href}
                ref={buttonRef}
                className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full p-4 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 flex items-center justify-center w-16 h-16 press-animation relative overflow-hidden"
                aria-label={ariaLabel}
                onClick={createRipple}
            >
                <span className="ripple-container absolute inset-0 pointer-events-none" />
                <div className="flex items-center justify-center w-full h-full">
                    <Icon name={iconName} className="fab-icon w-8 h-8" />
                </div>
            </Link>
        </motion.div>
    );
}