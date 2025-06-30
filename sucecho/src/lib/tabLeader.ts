import { useEffect, useRef, useState } from 'react';
import logger from './logger';

const CHANNEL_NAME = 'SUCECHO_REALTIME_CHANNEL';

export function useTabLeader(): boolean {
    const allowMultiTab =
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_ALLOW_MULTI_TAB === 'true';
    // Always call hooks at the top level
    const [isLeader, setIsLeader] = useState(false);
    const isTabLeader = useRef(false);

    useEffect(() => {
        if (allowMultiTab) {
            setIsLeader(true);
            isTabLeader.current = true;
            return;
        }
        if (typeof BroadcastChannel === 'undefined') {
            setIsLeader(true);
            isTabLeader.current = true;
            return;
        }
        const channel = new BroadcastChannel(CHANNEL_NAME);
        const tabId = Math.random();
        let electionTimeout: NodeJS.Timeout | null = null;

        function electLeader() {
            setIsLeader(true);
            isTabLeader.current = true;
            logger.log(`Tab ${tabId.toFixed(2)} elected as leader.`);
            channel.postMessage({ type: 'leader_elected' });
        }

        const onMessage = (event: MessageEvent) => {
            const { type } = event.data;
            if (type === 'request_leader_status' && isTabLeader.current) {
                channel.postMessage({ type: 'leader_elected' });
            } else if (type === 'leader_closing') {
                setIsLeader(false);
                isTabLeader.current = false;
                setTimeout(electLeader, 100);
            } else if (type === 'leader_elected') {
                setIsLeader(false);
                isTabLeader.current = false;
                if (electionTimeout) {
                    clearTimeout(electionTimeout);
                }
            }
        };

        channel.addEventListener('message', onMessage);
        electionTimeout = setTimeout(electLeader, 250);
        channel.postMessage({ type: 'request_leader_status' });

        const handleBeforeUnload = () => {
            if (isTabLeader.current) {
                channel.postMessage({ type: 'leader_closing' });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (electionTimeout) clearTimeout(electionTimeout);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            channel.removeEventListener('message', onMessage);
            channel.close();
        };
    }, [allowMultiTab]);

    if (allowMultiTab) return true;
    return isLeader;
}
