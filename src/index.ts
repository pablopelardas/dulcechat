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
import { ToolRegistry } from './mcp/registry.js';
import { ApiClient } from './mcp/api-client.js';
import { ordersTool } from './mcp/tools/orders.js';
import { stockTool } from './mcp/tools/stock.js';
import { customersTool } from './mcp/tools/customers.js';
import { searchItemsTool } from './mcp/tools/search-items.js';
import { BotEngine } from './engine.js';
import { Channel } from './channels/channel.js';

async function main() {
  console.log('Starting Caramelo...');

  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);

  // MCP Tool Registry
  const api = new ApiClient(config.dulceGestionApiUrl);
  const tools = new ToolRegistry();
  tools.register(ordersTool(api));
  tools.register(stockTool(api));
  tools.register(customersTool(api));
  tools.register(searchItemsTool(api));
  console.log(`Registered ${tools.getAll().length} MCP tools`);

  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM(tools)
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, tools, sessions);

  const channels: Channel[] = [];

  const app = express();
  const server = createServer(app);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Docs endpoint for help page
  const docsDir = path.resolve('docs/flows');
  app.use('/docs', (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.get('/docs', async (_req, res) => {
    try {
      const { readdir, readFile } = await import('fs/promises');
      const files = await readdir(docsDir);
      const docOrder = [
        'stock', 'recetas', 'productos', 'catalogo', 'clientes',
        'pedidos', 'venta-rapida', 'produccion', 'descuentos', 'finanzas', 'configuracion',
      ];
      const mdFiles = files.filter((f: string) => f.endsWith('.md'));
      const docs = await Promise.all(
        mdFiles.map(async (f: string) => {
          const content = await readFile(path.join(docsDir, f), 'utf-8');
          const title = content.match(/^#\s+(.+)/m)?.[1] ?? f.replace('.md', '');
          const sections = [...content.matchAll(/^##\s+(.+)/gm)].map((m) => m[1]);
          const slug = f.replace('.md', '');
          const order = docOrder.indexOf(slug);
          return { slug, title, sections, order: order >= 0 ? order : 999 };
        }),
      );
      docs.sort((a, b) => a.order - b.order);
      res.json(docs.map(({ order: _, ...d }) => d));
    } catch {
      res.json([]);
    }
  });

  app.get('/docs/:slug', async (req, res) => {
    try {
      const { readFile } = await import('fs/promises');
      const filePath = path.join(docsDir, `${req.params.slug}.md`);
      const content = await readFile(filePath, 'utf-8');
      const title = content.match(/^#\s+(.+)/m)?.[1] ?? req.params.slug;
      res.json({ slug: req.params.slug, title, content });
    } catch {
      res.status(404).json({ error: 'Doc not found' });
    }
  });

  const widgetDir = path.resolve('widget');
  app.use('/widget', express.static(widgetDir));
  app.get('/widget/chat', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'index.html'));
  });
  app.get('/widget.js', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'widget.js'));
  });

  const web = new WebChannel(config.port, config.widgetAllowedOrigin);
  web.onMessage((msg) => engine.handleMessage(msg));
  web.attachToServer(server);
  channels.push(web);

  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
  }

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
    console.log(`Caramelo running with ${channels.length} channel(s)`);
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

async function createClaudeLLM(tools: ToolRegistry) {
  const { ClaudeLLM } = await import('./llm/claude.js');
  return new ClaudeLLM(config.anthropicApiKey, tools);
}

main().catch(console.error);
