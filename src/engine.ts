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
    const relevantChunks = this.retriever.search(queryEmbedding, 3, msg.text);
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c) => c.text).join('\n\n---\n\n')
      : undefined;

    this.sessions.addMessage(msg.chatId, 'user', msg.text);
    let actionResults: string[] = [];
    const maxToolCalls = 5;

    for (let i = 0; i <= maxToolCalls; i++) {
      console.log(`[engine] ${msg.chatId}: calling ${this.llm.name}...`);
      const response = await this.llm.respond({
        message: msg.text,
        history: session.history.slice(0, -1),
        context,
        actionData: actionResults.length > 0 ? actionResults.join('\n\n---\n\n') : undefined,
      });

      // If no tool call, we have the final response
      if (!response.toolCall) {
        this.sessions.addMessage(msg.chatId, 'assistant', response.text);
        return response.text;
      }

      // Execute tool call
      const authToken = session.authToken ?? '';
      const action = this.actions.get(response.toolCall.name);

      if (!action) {
        const reply = `No conozco la accion "${response.toolCall.name}".`;
        this.sessions.addMessage(msg.chatId, 'assistant', reply);
        return reply;
      }

      console.log(`[engine] ${msg.chatId}: tool call -> ${response.toolCall.name}(${JSON.stringify(response.toolCall.params)})`);
      const actionResult = await action.execute(response.toolCall.params, authToken);

      if (actionResult.includes('autenticado')) {
        this.sessions.addMessage(msg.chatId, 'assistant', actionResult);
        return actionResult;
      }

      actionResults.push(actionResult);
    }

    // If we exhaust the loop, return what we have
    const fallback = 'No pude completar la consulta. Intenta con una pregunta mas especifica.';
    this.sessions.addMessage(msg.chatId, 'assistant', fallback);
    return fallback;
  }
}
