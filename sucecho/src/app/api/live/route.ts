// sucecho/src/app/api/live/route.ts
import eventEmitter from '@/lib/event-emitter';
import { NextResponse } from 'next/server';

/**
 * Handles GET requests to establish a Server-Sent Events (SSE) connection.
 * This keeps the connection open to stream real-time updates to the client.
 */
export async function GET(req: Request) {
  // We need a TransformStream to pipe data to the client as it becomes available.
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  /**
   * Writes a formatted SSE message to the client.
   * @param event The name of the event (e.g., 'new_post').
   * @param data The JSON data to send.
   */
  const writeSseMessage = (event: string, data: object) => {
    try {
      writer.write(encoder.encode(`event: ${event}\n`));
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      // This error usually happens when the client has already disconnected.
      // It's safe to ignore in this context.
      console.warn('Write to SSE failed, client likely disconnected.');
    }
  };

  // Define the handlers that will be called by our eventEmitter
  const onNewPost = (post: any) => writeSseMessage('new_post', post);
  const onUpdateVote = (voteData: any) => writeSseMessage('update_vote', voteData);

  // Attach the handlers to our central event emitter
  eventEmitter.on('new_post', onNewPost);
  eventEmitter.on('update_vote', onUpdateVote);

  // This is the crucial cleanup logic. When the client navigates away or
  // closes the tab, the 'abort' signal is fired.
  req.signal.addEventListener('abort', () => {
    console.log('Client disconnected, cleaning up SSE listeners.');
    // We remove the listeners to prevent memory leaks on the server.
    eventEmitter.off('new_post', onNewPost);
    eventEmitter.off('update_vote', onUpdateVote);
    writer.close();
  }, { once: true });


  // Return a streaming response
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}