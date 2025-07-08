// sucecho/src/app/components/AdminShield.tsx
"use client";

import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { usePathname } from "next/navigation";
import { motion } from 'motion/react';
import { Icon } from "./Icon";
import { useRef } from 'react';

export default function AdminShield() {
  const { isAdmin, isVerifying } = useAdmin();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLAnchorElement>(null);

  if (isVerifying || !isAdmin) return null;

  // Don't show the shield on the dashboard itself
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const wrapperClass = "relative";

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
      className={wrapperClass}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 1.08 }}
    >
      <Link href="/admin/dashboard"
        ref={buttonRef}
        className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border border-blue-400 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-colors w-16 h-16 flex items-center justify-center press-animation relative overflow-hidden"
        onClick={createRipple}
        aria-label="Admin Dashboard"
      >
        <span className="ripple-container absolute inset-0 pointer-events-none" />
        <span className="text-3xl"> <Icon name="shield" /></span>
      </Link>
    </motion.div>
  );
}