import { config } from './config.js';
import { SessionStore } from './session/memory.js';
import { TelegramChannel } from './channels/telegram.js';
import { Channel } from './channels/channel.js';
import { HardcodedLLM } from './llm/hardcoded.js';
import { Retriever, IndexedChunk } from './rag/retriever.js';
import { loadEmbeddings } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { BotEngine } from './engine.js';

async function main() {
  console.log('Starting DulceChat...');

  // Load embeddings (empty array if not yet indexed)
  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  // Initialize components
  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);
  const actions = new DulceGestionActions(config.dulceGestionApiUrl);

  // Select LLM adapter
  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM()
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, actions, sessions);

  // Start channels
  const channels: Channel[] = [];

  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
  }

  console.log(`DulceChat running with ${channels.length} channel(s)`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    for (const ch of channels) {
      await ch.stop();
    }
    sessions.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function createClaudeLLM() {
  // Dynamic import so the Claude SDK is only loaded when needed.
  // The module is implemented in Task 11; use a runtime path string so
  // TypeScript does not try to resolve the module at compile time.
  const modulePath = './llm/claude.js';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import(/* @vite-ignore */ modulePath) as any;
  return mod.ClaudeLLM(config.anthropicApiKey) as import('./llm/llm.js').LLM;
}

main().catch(console.error);
