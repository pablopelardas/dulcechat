import { LLM, LLMRequest, LLMResponse } from './llm.js';

const GREETINGS = ['hola', 'buenas', 'hey', 'hi', 'buenos dias', 'buenas tardes', 'buenas noches'];
const ORDER_KEYWORDS = ['pedido', 'pedidos', 'orden', 'ordenes', 'entrega', 'entregas'];
const STOCK_KEYWORDS = ['stock', 'ingrediente', 'ingredientes', 'inventario', 'despensa'];
const CUSTOMER_KEYWORDS = ['cliente', 'clientes', 'deudor', 'deudores'];

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export class HardcodedLLM implements LLM {
  name = 'hardcoded';

  async respond(req: LLMRequest): Promise<LLMResponse> {
    const { message, context } = req;

    if (matchesAny(message, GREETINGS)) {
      return { text: '¡Hola! Soy Caramelo, tu asistente de DulceGestion. ¿En qué puedo ayudarte?' };
    }

    if (matchesAny(message, ORDER_KEYWORDS)) {
      return {
        text: 'Buscando tus pedidos...',
        toolCall: { name: 'ver_pedidos', params: {} },
      };
    }

    if (matchesAny(message, STOCK_KEYWORDS)) {
      return {
        text: 'Revisando tu inventario...',
        toolCall: { name: 'ver_stock', params: {} },
      };
    }

    if (matchesAny(message, CUSTOMER_KEYWORDS)) {
      return {
        text: 'Buscando clientes...',
        toolCall: { name: 'ver_clientes', params: {} },
      };
    }

    if (context) {
      return { text: `Segun la documentacion:\n\n${context}` };
    }

    return {
      text: 'No estoy seguro de como ayudarte con eso. Podes preguntarme sobre pedidos, stock, clientes, o como usar DulceGestion.',
    };
  }
}
