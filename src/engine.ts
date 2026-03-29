import { IncomingMessage } from './channels/channel.js';
import { LLM } from './llm/llm.js';
import { Retriever } from './rag/retriever.js';
import { getQueryEmbedding } from './rag/embeddings.js';
import { ToolRegistry } from './mcp/registry.js';
import { SessionStore } from './session/memory.js';

export class BotEngine {
  constructor(
    private llm: LLM,
    private retriever: Retriever,
    private tools: ToolRegistry,
    private sessions: SessionStore,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<string> {
    const session = this.sessions.get(msg.chatId);

    if (msg.authToken) {
      session.authToken = msg.authToken;
    }

    const queryEmbedding = await getQueryEmbedding(msg.text);
    const relevantChunks = this.retriever.search(queryEmbedding, 3, msg.text);
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c) => c.text).join('\n\n---\n\n')
      : undefined;

    this.sessions.addMessage(msg.chatId, 'user', msg.text);
    console.log(`[engine] ${msg.chatId}: calling ${this.llm.name}...`);
    let response = await this.llm.respond({
      message: msg.text,
      history: session.history.slice(0, -1),
      context,
    });

    if (response.toolCall) {
      const authToken = session.authToken ?? '';
      const tool = this.tools.get(response.toolCall.name);

      if (!tool) {
        const reply = `No conozco la accion "${response.toolCall.name}".`;
        this.sessions.addMessage(msg.chatId, 'assistant', reply);
        return reply;
      }

      console.log(`[engine] ${msg.chatId}: tool call -> ${response.toolCall.name}(${JSON.stringify(response.toolCall.params)})`);
      const toolResult = await tool.execute(response.toolCall.params, authToken);
      const resultStr = JSON.stringify(toolResult);

      if (typeof toolResult === 'object' && toolResult !== null && 'error' in toolResult) {
        const errorMsg = (toolResult as { error: string }).error;
        this.sessions.addMessage(msg.chatId, 'assistant', errorMsg);
        return errorMsg;
      }

      console.log(`[engine] ${msg.chatId}: calling ${this.llm.name} with tool data...`);
      response = await this.llm.respond({
        message: msg.text,
        history: session.history.slice(0, -1),
        context,
        actionData: resultStr,
      });
    }

    this.sessions.addMessage(msg.chatId, 'assistant', response.text);
    return response.text;
  }
}
