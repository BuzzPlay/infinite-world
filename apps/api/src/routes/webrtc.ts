import type { FastifyInstance } from 'fastify';

export function registerWebRtcRoutes(app: FastifyInstance) {
  app.get<{ Params: { worldId: string } }>('/api/worlds/:worldId/run/webrtc', { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: 'ready' }));
    socket.on('message', () => {
      socket.send(JSON.stringify({ type: 'error', message: 'browser output signaling is not configured' }));
    });
    socket.on('close', () => undefined);
  });
}
