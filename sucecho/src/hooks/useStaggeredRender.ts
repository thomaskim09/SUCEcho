// sucecho/src/hooks/useStaggeredRender.ts
'use client';

import { useState, useEffect, useRef } from 'react';

export function useStaggeredRender<T extends { id: string | number }>(
    items: T[],
    delay = 150 // A slightly faster delay for a snappy feel
): [T[], boolean] {
    const [renderedItems, setRenderedItems] = useState<T[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const hasAnimated = useRef(false); // Tracks if the initial animation has run

    // This effect handles the initial stagger animation and runs ONLY ONCE.
    useEffect(() => {
        // If animation has already run or there are no items, do nothing.
        if (hasAnimated.current || items.length === 0) {
            return;
        }

        // Mark that the animation is about to start
        hasAnimated.current = true;
        setIsComplete(false);
        const timeouts: NodeJS.Timeout[] = [];

        // Animate each item in with a delay
        items.forEach((item, index) => {
            const timeout = setTimeout(() => {
                setRenderedItems((prevItems) => [...prevItems, item]);
            }, index * delay);
            timeouts.push(timeout);
        });

        // Set the completion flag after the last item has animated in
        const completionTimeout = setTimeout(() => {
            setIsComplete(true);
        }, items.length * delay);
        timeouts.push(completionTimeout);

        // Cleanup function to clear timeouts if the component unmounts
        return () => {
            timeouts.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, delay]); // We depend on `items` here to trigger the initial render

    // This effect handles all subsequent updates (add/remove) AFTER the initial animation.
    useEffect(() => {
        // If the initial animation is done, we can safely update the rendered items
        // to reflect any changes from the parent component (like new posts or removals).
        if (hasAnimated.current && isComplete) {
            setRenderedItems(items);
        }
    }, [items, isComplete]);

    return [renderedItems, isComplete];
}
