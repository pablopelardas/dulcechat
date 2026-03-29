import { Express, Request, Response } from 'express';
import express from 'express';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

const WHATSAPP_MAX_LENGTH = 1600;
const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01/Accounts';

export class WhatsAppChannel implements Channel {
  name = 'whatsapp';
  private handler: MessageHandler | null = null;
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;

  constructor(
    accountSid: string,
    authToken: string,
    phoneNumber: string,
    app: Express,
  ) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;

    app.post(
      '/webhook/whatsapp',
      express.urlencoded({ extended: false }),
      (req: Request, res: Response) => this.handleWebhook(req, res),
    );
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    console.log('[whatsapp] webhook registered at POST /webhook/whatsapp');
  }

  async stop(): Promise<void> {
    // No persistent connection to tear down
  }

  private async handleWebhook(req: Request, res: Response): Promise<void> {
    // Acknowledge receipt immediately with empty TwiML
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

    if (!this.handler) return;

    const from: string = req.body?.From ?? '';
    const body: string = req.body?.Body ?? '';
    const messageSid: string = req.body?.MessageSid ?? '';

    if (!from || !body) return;

    const incoming: IncomingMessage = {
      chatId: from, // e.g. whatsapp:+1234567890
      text: body,
      userId: from,
      meta: { messageSid },
    };

    try {
      const reply = await this.handler(incoming);
      // Split long messages to respect WhatsApp's character limit
      for (let i = 0; i < reply.length; i += WHATSAPP_MAX_LENGTH) {
        await this.sendMessage(from, reply.slice(i, i + WHATSAPP_MAX_LENGTH));
      }
    } catch (err) {
      console.error('[whatsapp] error handling message:', err);
      await this.sendMessage(from, 'Hubo un error procesando tu mensaje. Intenta de nuevo.');
    }
  }

  private async sendMessage(to: string, text: string): Promise<void> {
    const url = `${TWILIO_API_BASE}/${this.accountSid}/Messages.json`;

    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const body = new URLSearchParams({
      To: to,
      From: `whatsapp:${this.phoneNumber}`,
      Body: text,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[whatsapp] Twilio API error ${response.status}: ${error}`);
    }
  }
}
