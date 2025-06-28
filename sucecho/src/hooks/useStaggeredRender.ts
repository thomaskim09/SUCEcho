'use client';

import { useState, useEffect } from 'react';

export function useStaggeredRender<T extends { id: string | number }>(
    items: T[],
    delay = 200
): [T[], boolean] {
    const [renderedItems, setRenderedItems] = useState<T[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const itemIds = JSON.stringify(items.map((item) => item.id));

    useEffect(() => {
        setIsComplete(false);

        if (!items || items.length === 0) {
            setRenderedItems([]);
            setIsComplete(true);
            return;
        }

        const timeouts: NodeJS.Timeout[] = [];
        setRenderedItems(items);

        const startTimeout = setTimeout(() => {
            const currentItems = items;
            setRenderedItems([]);

            currentItems.forEach((item, index) => {
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
            }, currentItems.length * delay);
            timeouts.push(completionTimeout);
        }, 10);

        timeouts.push(startTimeout);

        return () => {
            timeouts.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemIds, delay]);

    useEffect(() => {
        const itemMap = new Map(items.map((item) => [item.id, item]));

        setRenderedItems((currentRenderedItems) => {
            const updatedItems = currentRenderedItems.map(
                (renderedItem) => itemMap.get(renderedItem.id) || renderedItem
            );

            if (
                JSON.stringify(updatedItems) !==
                JSON.stringify(currentRenderedItems)
            ) {
                return updatedItems as T[];
            }

            return currentRenderedItems;
        });
    }, [items]);

    return [renderedItems, isComplete];
}
