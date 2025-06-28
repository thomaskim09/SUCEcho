// sucecho/src/app/components/FabContainer.tsx
"use client"

import { useAdmin } from "@/context/AdminContext"
import FloatingActionButton from "./FloatingActionButton"
import AdminShield from "./AdminShield"

export default function FabContainer() {
    const { isAdmin } = useAdmin();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-4">
            <FloatingActionButton />
            {isAdmin && <AdminShield />}
        </div>
    )
}