// sucecho/src/app/components/AdminShield.tsx
"use client";

import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { usePathname } from "next/navigation";
import { motion } from 'framer-motion';

export default function AdminShield() {
  const { isAdmin } = useAdmin();
  const pathname = usePathname();

  if (!isAdmin) return null;

  // Don't show the shield on the dashboard itself
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Use a different style when it's not on the home page (where the main FAB is)
  const isHomePage = pathname === '/';
  const wrapperClass = isHomePage
    ? "relative" // Stacked on the home page
    : "fixed bottom-6 right-6 z-50"; // FAB position on other pages

  return (
    <motion.div
      className={wrapperClass}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href="/admin/dashboard" >
        <div className="p-3 bg-gray-800 border border-gray-600 rounded-full shadow-lg hover:bg-gray-700 transition-colors w-16 h-16 flex items-center justify-center">
          <span className="text-3xl">🛡️</span>
        </div>
      </Link>
    </motion.div>
  );
}