// sucecho/src/app/api/live/route.ts
import supabase from '@/lib/supabase-realtime';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid'; // Import a function to generate unique IDs

export async function GET(req: Request) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const channel = supabase.channel('posts');

    const writeSseMessage = (event: string, data: any) => {
        try {
            writer.write(encoder.encode(`event: ${event}\n`));
            writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
            logger.warn('Write to SSE failed, client likely disconnected.');
        }
    };

    // Generate a unique ID for this specific client connection
    const connectionId = uuidv4();

    channel
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
            logger.log(`Received broadcast event: ${event}`, payload);
            if (event) {
                writeSseMessage(event, payload);
            }
        })
        // --- NEW: Add Presence event listeners for debugging ---
        .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            logger.log('Presence state synced', presenceState);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                logger.log(
                    `Successfully subscribed to Supabase channel 'posts'.`
                );
                // --- NEW: Track this connection using the Presence feature ---
                const trackStatus = await channel.track({
                    connection_id: connectionId,
                    online_at: new Date().toISOString(),
                });
                if (trackStatus === 'ok') {
                    logger.log(
                        'Successfully tracking presence for this connection.'
                    );
                } else {
                    logger.error(
                        'Failed to track presence for this connection.'
                    );
                }
            }
        });

    // The keep-alive interval is no longer needed as the Supabase SDK handles it.

    req.signal.addEventListener(
        'abort',
        async () => {
            logger.log(
                'Client disconnected, unsubscribing from channel and cleaning up.'
            );
            // --- NEW: Untrack the user when they disconnect ---
            await channel.untrack();
            await supabase.removeChannel(channel);
            writer.close();
        },
        { once: true }
    );

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
        },
    });
}
