// src/app/components/Portal.tsx
"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) {
        return null;
    }

    const portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
        console.error("The element #modal-root was not found in the DOM. Please ensure it's in your layout.tsx.");
        return null;
    }

    return createPortal(children, portalRoot);
};

export default Portal;