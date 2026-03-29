import { Telegraf } from 'telegraf';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

export class TelegramChannel implements Channel {
  name = 'telegram';
  private bot: Telegraf;
  private handler: MessageHandler | null = null;

  constructor(token: string) {
    this.bot = new Telegraf(token);
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    this.bot.on('text', async (ctx) => {
      if (!this.handler) return;
      if (ctx.chat.type !== 'private') return;

      const incoming: IncomingMessage = {
        chatId: ctx.chat.id.toString(),
        text: ctx.message.text,
        userId: ctx.from.id.toString(),
        meta: { from: ctx.from.first_name },
      };

      const reply = await this.handler(incoming);
      await ctx.reply(reply);
    });

    this.bot.launch();
    console.log('[telegram] bot started');
  }

  async stop(): Promise<void> {
    this.bot.stop();
  }
}
