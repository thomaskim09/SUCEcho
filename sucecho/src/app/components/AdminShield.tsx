// sucecho/src/app/components/AdminShield.tsx
"use client";

import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";

export default function AdminShield() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return null;

  return (
    <Link href="/admin/dashboard" className="fixed bottom-24 right-4 z-50">
      <div className="p-3 bg-gray-800 rounded-full shadow-lg hover:bg-gray-700 transition-colors">
        <span className="text-2xl">🛡️</span>
      </div>
    </Link>
  );
}