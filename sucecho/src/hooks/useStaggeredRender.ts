// sucecho/src/hooks/useStaggeredRender.ts
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

export function useStaggeredRender<T extends { id: string | number }>(
    items: T[],
    delay = 150
): [T[], boolean] {
    const [renderedItems, setRenderedItems] = useState<T[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const hasAnimated = useRef(false);
    const itemsKey = useMemo(() => items.map((i) => i.id).join(','), [items]);

    useEffect(() => {
        if (hasAnimated.current || items.length === 0) {
            setRenderedItems(items);
            if (!hasAnimated.current) {
                setIsComplete(true);
            }
            return;
        }

        hasAnimated.current = true;
        setIsComplete(false);
        const timeouts: NodeJS.Timeout[] = [];

        items.forEach((item, index) => {
            const timeout = setTimeout(() => {
                setRenderedItems((prevItems) => {
                    if (prevItems.some((p) => p.id === item.id)) {
                        return prevItems;
                    }
                    return [...prevItems, item];
                });
            }, index * delay);
            timeouts.push(timeout);
        });

        const completionTimeout = setTimeout(() => {
            setIsComplete(true);
        }, items.length * delay);
        timeouts.push(completionTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [itemsKey, delay]);

    return [renderedItems, isComplete];
}
