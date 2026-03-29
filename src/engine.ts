import { IncomingMessage } from './channels/channel.js';
import { LLM } from './llm/llm.js';
import { Retriever } from './rag/retriever.js';
import { simpleEmbedding } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { SessionStore } from './session/memory.js';

export class BotEngine {
  constructor(
    private llm: LLM,
    private retriever: Retriever,
    private actions: DulceGestionActions,
    private sessions: SessionStore,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<string> {
    const session = this.sessions.get(msg.chatId);

    if (msg.authToken) {
      session.authToken = msg.authToken;
    }

    // Search for relevant documentation
    const queryEmbedding = simpleEmbedding(msg.text);
    const relevantChunks = this.retriever.search(queryEmbedding, 2, msg.text);
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c) => c.text).join('\n\n---\n\n')
      : undefined;

    // First LLM call
    this.sessions.addMessage(msg.chatId, 'user', msg.text);
    let response = await this.llm.respond({
      message: msg.text,
      history: session.history.slice(0, -1),
      context,
    });

    // If LLM wants to call a tool, execute it
    if (response.toolCall) {
      const authToken = session.authToken ?? '';
      const action = this.actions.get(response.toolCall.name);

      if (!action) {
        const reply = `No conozco la accion "${response.toolCall.name}".`;
        this.sessions.addMessage(msg.chatId, 'assistant', reply);
        return reply;
      }

      const actionResult = await action.execute(response.toolCall.params, authToken);

      // If no auth token and action needs one
      if (actionResult.includes('autenticado')) {
        this.sessions.addMessage(msg.chatId, 'assistant', actionResult);
        return actionResult;
      }

      // Second LLM call with action data
      response = await this.llm.respond({
        message: msg.text,
        history: session.history.slice(0, -1),
        context,
        actionData: actionResult,
      });
    }

    this.sessions.addMessage(msg.chatId, 'assistant', response.text);
    return response.text;
  }
}
