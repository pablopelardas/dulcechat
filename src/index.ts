import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { config } from './config.js';
import { SessionStore } from './session/memory.js';
import { TelegramChannel } from './channels/telegram.js';
import { WhatsAppChannel } from './channels/whatsapp.js';
import { WebChannel } from './channels/web.js';
import { HardcodedLLM } from './llm/hardcoded.js';
import { Retriever, IndexedChunk } from './rag/retriever.js';
import { loadEmbeddings } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { BotEngine } from './engine.js';
import { Channel } from './channels/channel.js';

async function main() {
  console.log('Starting DulceChat...');

  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);
  const actions = new DulceGestionActions(config.dulceGestionApiUrl);

  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM()
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, actions, sessions);

  const channels: Channel[] = [];

  // Express server for widget and health
  const app = express();
  const server = createServer(app);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Serve widget files
  const widgetDir = path.resolve('widget');
  app.use('/widget', express.static(widgetDir));
  app.get('/widget/chat', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'index.html'));
  });
  app.get('/widget.js', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'widget.js'));
  });

  // Web channel (WebSocket)
  const web = new WebChannel(config.port, config.widgetAllowedOrigin);
  web.onMessage((msg) => engine.handleMessage(msg));
  web.attachToServer(server);
  channels.push(web);

  // Telegram channel
  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
  }

  // WhatsApp channel (via Twilio)
  if (config.whatsappAccountSid) {
    const whatsapp = new WhatsAppChannel(
      config.whatsappAccountSid,
      config.whatsappAuthToken,
      config.whatsappPhoneNumber,
      app,
    );
    whatsapp.onMessage((msg) => engine.handleMessage(msg));
    await whatsapp.start();
    channels.push(whatsapp);
  }

  server.listen(config.port, () => {
    console.log(`[express] server on http://localhost:${config.port}`);
    console.log(`[widget] http://localhost:${config.port}/widget/chat`);
    console.log(`DulceChat running with ${channels.length} channel(s)`);
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    for (const ch of channels) {
      await ch.stop();
    }
    sessions.destroy();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function createClaudeLLM() {
  const modulePath = './llm/claude.js';
  const { ClaudeLLM } = await import(modulePath);
  return new ClaudeLLM(config.anthropicApiKey);
}

main().catch(console.error);
