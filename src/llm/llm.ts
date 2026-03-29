export interface LLMRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
  actionData?: string;
}

export interface LLMResponse {
  text: string;
  toolCall?: {
    name: string;
    params: Record<string, unknown>;
  };
}

export interface LLM {
  name: string;
  respond(req: LLMRequest): Promise<LLMResponse>;
}
