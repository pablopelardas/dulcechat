export interface IncomingMessage {
  chatId: string;
  text: string;
  userId?: string;
  authToken?: string;
  meta?: Record<string, unknown>;
}

export interface OutgoingMessage {
  chatId: string;
  text: string;
}

export type MessageHandler = (msg: IncomingMessage) => Promise<string>;

export interface Channel {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(handler: MessageHandler): void;
}
