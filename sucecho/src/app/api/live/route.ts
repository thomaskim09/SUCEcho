// sucecho/src/app/api/live/route.ts
import eventEmitter from '@/lib/event-emitter';
import logger from '@/lib/logger';

export async function GET(req: Request) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeSseMessage = (event: string, data: object) => {
        try {
            writer.write(encoder.encode(`event: ${event}\n`));
            writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
            logger.warn('Write to SSE failed, client likely disconnected.');
        }
    };

    const onNewPost = (post: Record<string, unknown>) =>
        writeSseMessage('new_post', post);
    const onUpdateVote = (voteData: Record<string, unknown>) =>
        writeSseMessage('update_vote', voteData);
    const onDeletePost = (deleteData: Record<string, unknown>) =>
        writeSseMessage('delete_post', deleteData); // Handler for deletion

    eventEmitter.on('new_post', onNewPost);
    eventEmitter.on('update_vote', onUpdateVote);
    eventEmitter.on('delete_post', onDeletePost); // Attach the deletion handler

    req.signal.addEventListener(
        'abort',
        () => {
            logger.log('Client disconnected, cleaning up SSE listeners.');
            eventEmitter.off('new_post', onNewPost);
            eventEmitter.off('update_vote', onUpdateVote);
            eventEmitter.off('delete_post', onDeletePost); // Clean up the deletion handler
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
