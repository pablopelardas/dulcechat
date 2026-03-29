import Anthropic from '@anthropic-ai/sdk';
import { LLM, LLMRequest, LLMResponse } from './llm.js';
import { ToolRegistry } from '../mcp/registry.js';

const SYSTEM_PROMPT = `Sos Caramelo, el asistente virtual de DulceGestion, una aplicacion de gestion para pastelerias y emprendimientos de reposteria.

Tu rol es:
- Responder preguntas sobre como usar la aplicacion
- Consultar datos del negocio (pedidos, stock, clientes) cuando el usuario lo pida
- Crear pedidos, clientes y codigos de descuento cuando el usuario lo pida
- Ser amable, conciso y hablar en espanol rioplatense

Reglas:
- Si el usuario pregunta algo sobre la app y tenes contexto de documentacion, usa esa informacion para responder.
- Si el usuario pide datos del negocio, usa las herramientas disponibles.
- Si no sabes algo, decilo honestamente. No inventes pasos ni funcionalidades que no esten en la documentacion.
- Cuando presentes datos (pedidos, stock, etc.), organiza la informacion cronologicamente y de forma clara. No reagrupes ni reordenes los datos de formas confusas.
- Se conciso. No repitas informacion ni agregues explicaciones innecesarias.

Reglas para acciones de escritura (crear pedidos, clientes, descuentos):
- SIEMPRE mostra un resumen de lo que vas a crear y espera a que el usuario confirme con "si" antes de ejecutar la herramienta.
- NUNCA crees nada sin confirmacion explicita del usuario.
- Si al buscar un cliente o item hay multiples resultados, presenta opciones numeradas y pedile al usuario que elija por numero.
- Si al buscar un cliente no hay resultados, pregunta si quiere crear uno nuevo.
- Para pedidos: primero busca el cliente (ver_clientes), luego busca los items (buscar_items), confirma todo y recien ahi crea el pedido (crear_pedido).
- Para crear cliente: primero busca si ya existe (ver_clientes). Si existe, pregunta si es esa persona o si quiere crear uno nuevo.
- Cuando busques items, usa el campo "type" para saber si es receta (recipeId) o producto (productId) al armar el pedido.`;

export class ClaudeLLM implements LLM {
  name = 'claude';
  private client: Anthropic;
  private claudeTools: Anthropic.Tool[];

  constructor(apiKey: string, registry?: ToolRegistry) {
    this.client = new Anthropic({ apiKey });
    this.claudeTools = (registry?.toClaudeTools() ?? []) as Anthropic.Tool[];
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

    const useTools = !req.actionData && this.claudeTools.length > 0;

    const start = Date.now();
    try {
      var response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemParts.join('\n'),
        ...(useTools ? { tools: this.claudeTools } : {}),
        messages,
      });
      console.log(`[claude] response in ${Date.now() - start}ms, stop: ${response.stop_reason}`);
    } catch (err: any) {
      console.error(`[claude] error after ${Date.now() - start}ms:`, err.message);
      return { text: 'Hubo un error consultando al asistente. Intenta de nuevo.' };
    }

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

    const textBlock = response.content.find((block) => block.type === 'text');
    return {
      text: textBlock && textBlock.type === 'text' ? textBlock.text : 'No pude generar una respuesta.',
    };
  }
}
