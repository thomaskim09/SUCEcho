// sucecho/src/app/api/live/route.ts
import supabase from '@/lib/supabase-realtime';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const stream = new ReadableStream({
        start(controller) {
            const channel = supabase.channel('posts');

            const handleBroadcast = (payload: {
                event: string;
                payload: unknown;
            }) => {
                if (req.signal.aborted) {
                    return;
                }
                try {
                    const message = `event: ${
                        payload.event
                    }\ndata: ${JSON.stringify(payload.payload)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(message));
                } catch (e) {
                    logger.error(`Live Route: Failed to send event`, e);
                    try {
                        controller.close();
                    } catch {}
                }
            };

            channel
                .on('broadcast', { event: '*' }, handleBroadcast)
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        logger.log(
                            `Live Route: Client successfully subscribed to Supabase channel 'posts'.`
                        );
                    }
                });

            req.signal.onabort = async () => {
                logger.log(
                    `Live Route: Client disconnected. Unsubscribing from 'posts' channel.`
                );
                await supabase.removeChannel(channel);
            };
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
        },
    });
}
