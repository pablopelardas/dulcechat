import { Telegraf } from 'telegraf';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

const TELEGRAM_MAX_LENGTH = 4096;

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
    this.bot.command('start', async (ctx) => {
      await ctx.reply('¡Hola! Soy Caramelo, tu asistente de DulceGestion. Preguntame lo que necesites sobre la app o tu negocio.');
    });

    this.bot.on('text', async (ctx) => {
      if (!this.handler) return;
      if (ctx.chat.type !== 'private') return;

      const incoming: IncomingMessage = {
        chatId: ctx.chat.id.toString(),
        text: ctx.message.text,
        userId: ctx.from.id.toString(),
        meta: { from: ctx.from.first_name },
      };

      try {
        const reply = await this.handler(incoming);
        // Split long messages to respect Telegram's 4096 char limit
        for (let i = 0; i < reply.length; i += TELEGRAM_MAX_LENGTH) {
          await ctx.reply(reply.slice(i, i + TELEGRAM_MAX_LENGTH));
        }
      } catch (err) {
        console.error('[telegram] error handling message:', err);
        await ctx.reply('Hubo un error procesando tu mensaje. Intenta de nuevo.');
      }
    });

    this.bot.launch();
    console.log('[telegram] bot started');
  }

  async stop(): Promise<void> {
    this.bot.stop();
  }
}
