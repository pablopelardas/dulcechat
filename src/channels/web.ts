import { WebSocketServer } from 'ws';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

interface WebSocketMessage {
  text: string;
  authToken?: string;
}

export class WebChannel implements Channel {
  name = 'web';
  private wss: WebSocketServer | null = null;
  private handler: MessageHandler | null = null;

  private selfOrigin: string;

  constructor(private port: number, private allowedOrigin: string) {
    this.selfOrigin = `http://localhost:${port}`;
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    // WSS will be attached to the Express server via attachToServer
  }

  attachToServer(server: import('http').Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const origin = req.headers.origin ?? '';
      console.log(`[web] new connection from origin: "${origin}"`);

      const allowed = origin === this.selfOrigin
        || this.allowedOrigin === '*'
        || origin.includes(this.allowedOrigin)
        || !origin;

      if (!allowed) {
        console.log(`[web] rejected: origin "${origin}"`);
        ws.close(1008, 'Origin not allowed');
        return;
      }

      const chatId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let authToken: string | undefined;

      ws.on('message', async (data) => {
        console.log(`[web] message from ${chatId}:`, data.toString().slice(0, 100));
        if (!this.handler) return;

        try {
          const parsed: WebSocketMessage = JSON.parse(data.toString());

          if (parsed.authToken) {
            authToken = parsed.authToken;
          }

          const incoming: IncomingMessage = {
            chatId,
            text: parsed.text,
            authToken,
          };

          const reply = await this.handler(incoming);
          ws.send(JSON.stringify({ text: reply }));
        } catch {
          ws.send(JSON.stringify({ text: 'Error procesando tu mensaje.' }));
        }
      });
    });

    console.log('[web] websocket channel ready on /ws');
  }

  async stop(): Promise<void> {
    this.wss?.close();
  }
}
