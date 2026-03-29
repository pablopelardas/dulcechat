import Anthropic from '@anthropic-ai/sdk';
import { LLM, LLMRequest, LLMResponse } from './llm.js';

const SYSTEM_PROMPT = `Sos DulceChat, el asistente virtual de DulceGestion, una aplicacion de gestion para pastelerias y emprendimientos de reposteria.

Tu rol es:
- Responder preguntas sobre como usar la aplicacion
- Consultar datos del negocio (pedidos, stock, clientes) cuando el usuario lo pida
- Ser amable, conciso y hablar en espanol rioplatense

Si el usuario pregunta algo sobre la app y tenes contexto de documentacion, usa esa informacion para responder.
Si el usuario pide datos del negocio, usa las herramientas disponibles.
Si no sabes algo, decilo honestamente.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'ver_pedidos',
    description: 'Consultar pedidos del negocio. Puede filtrar por fecha y estado.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Estado: pending, delivered, cancelled' },
        startDate: { type: 'string', description: 'Fecha inicio ISO (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Fecha fin ISO (YYYY-MM-DD)' },
      },
    },
  },
  {
    name: 'ver_stock',
    description: 'Ver stock actual de ingredientes y detectar faltantes.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'ver_clientes',
    description: 'Buscar y listar clientes del negocio.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

export class ClaudeLLM implements LLM {
  name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async respond(req: LLMRequest): Promise<LLMResponse> {
    const today = new Date().toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const todayISO = new Date().toISOString().split('T')[0];

    const systemParts: string[] = [
      SYSTEM_PROMPT,
      `\nFecha actual: ${today} (${todayISO}). Usa esta fecha para interpretar "hoy", "mañana", "la semana que viene", etc.`,
    ];

    if (req.context) {
      systemParts.push(`\nDocumentacion relevante:\n${req.context}`);
    }

    if (req.actionData) {
      systemParts.push(`\nResultado de consulta al sistema:\n${req.actionData}`);
    }

    const messages: Anthropic.MessageParam[] = req.history.map((h) => ({
      role: h.role,
      content: h.content,
    }));
    messages.push({ role: 'user', content: req.message });

    // Don't offer tools when we already have action data (prevents tool call loops)
    const useTools = !req.actionData;

    const start = Date.now();
    try {
      var response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemParts.join('\n'),
        ...(useTools ? { tools: TOOLS } : {}),
        messages,
      });
      console.log(`[claude] response in ${Date.now() - start}ms, stop: ${response.stop_reason}`);
    } catch (err: any) {
      console.error(`[claude] error after ${Date.now() - start}ms:`, err.message);
      return { text: 'Hubo un error consultando al asistente. Intenta de nuevo.' };
    }

    // Check if Claude wants to use a tool
    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (toolUse && toolUse.type === 'tool_use') {
      return {
        text: '',
        toolCall: {
          name: toolUse.name,
          params: toolUse.input as Record<string, unknown>,
        },
      };
    }

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    return {
      text: textBlock && textBlock.type === 'text' ? textBlock.text : 'No pude generar una respuesta.',
    };
  }
}
