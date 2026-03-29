# DulceChat - Chatbot multicanal para DulceGestion

## Objetivo

Chatbot de soporte y consulta para usuarios de DulceGestion (app de gestion para pastelerias). El bot responde preguntas sobre como usar la app y consulta datos reales del usuario (pedidos, stock, clientes, etc.) via la API de DulceGestion.

Objetivo secundario: aprender el patron de construccion de chatbots con arquitectura de adaptadores intercambiables, para replicarlo con clientes.

## Arquitectura

Enfoque de adaptadores con capas claras. El engine central conecta tres tipos de componentes intercambiables:

```
Canales (in/out)        Cerebro              Acciones
+--------------+      +----------------+     +--------------------+
| Telegram     |----->|                |---->| RAG (docs)         |
| Web Widget   |----->|   Bot Engine   |---->| DulceGestion API   |
| WhatsApp (*) |----->|                |---->| Claude LLM         |
+--------------+      +----------------+     +--------------------+

(*) WhatsApp en iteracion futura
```

## Estructura del proyecto

```
dulcechat/
  src/
    channels/              # Adaptadores de mensajeria
      channel.ts           # Interface base
      telegram.ts          # Adapter Telegram (telegraf)
      web.ts               # Adapter WebSocket para widget
      whatsapp.ts          # Adapter WhatsApp (futuro)
    llm/                   # Adaptadores de LLM
      llm.ts               # Interface base
      hardcoded.ts         # Respuestas fijas para testing
      claude.ts            # Anthropic API con tool calling
    rag/                   # Sistema de conocimiento
      embeddings.ts        # Generar/cargar embeddings
      chunker.ts           # Partir docs en fragmentos
      retriever.ts         # Buscar chunks relevantes
    actions/               # Integracion con DulceGestion API
      action.ts            # Interface base
      dulcegestion.ts      # Llamadas a la API real
    session/               # Contexto de conversacion
      memory.ts            # Map en memoria con TTL
    engine.ts              # Bot engine (conecta todo)
    config.ts              # Variables de entorno
    index.ts               # Entry point
  docs/
    flows/                 # Documentacion de DulceGestion para RAG
  widget/
    widget.ts              # JS embebible (iframe + UI)
  data/
    embeddings.json        # Vectores persistidos
  package.json
  tsconfig.json
  .env
```

## Interfaces

### Channel (adaptadores de mensajeria)

```typescript
interface IncomingMessage {
  chatId: string;
  text: string;
  userId?: string;
  authToken?: string;  // solo web widget, para consultar API
  meta?: Record<string, any>;
}

interface OutgoingMessage {
  chatId: string;
  text: string;
}

interface Channel {
  name: string;
  start(): Promise<void>;
  onMessage(handler: (msg: IncomingMessage) => Promise<string>): void;
  send(msg: OutgoingMessage): Promise<void>;
}
```

### LLM (adaptadores de respuesta)

```typescript
interface LLMRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: string;    // chunks de RAG
  actionData?: string; // datos de DulceGestion API
}

interface LLM {
  name: string;
  respond(req: LLMRequest): Promise<string>;
}
```

### Action (consultas a sistemas externos)

```typescript
interface Action {
  name: string;
  description: string;  // para que Claude sepa cuando usarla
  execute(params: Record<string, any>, authToken: string): Promise<any>;
}
```

## Flujo de un mensaje

1. Llega mensaje por un canal (Telegram/Web/WhatsApp)
2. El canal lo normaliza a `IncomingMessage`
3. El engine busca/crea la sesion del usuario
4. El engine pasa el texto al retriever -> obtiene chunks relevantes de documentacion
5. El engine envia a Claude: mensaje + historial + chunks + tools disponibles
6. Si Claude responde con tool_call -> engine ejecuta la accion contra la API de DulceGestion
7. Engine devuelve resultado de la accion a Claude para que arme la respuesta final
8. Devuelve la respuesta por el mismo canal

### Con adaptador hardcoded (sin Claude)

En modo hardcoded, el paso 5-6 se reemplaza por keyword matching simple. No hay tool calling. Solo respuestas predefinidas basadas en palabras clave del mensaje.

## Sesiones

- `Map<string, Session>` en memoria
- TTL: 30 minutos de inactividad (configurable via env)
- Limpieza automatica cada 5 minutos via `setInterval`
- Maximo 20 mensajes por sesion en el historial (FIFO)
- Estructura:

```typescript
interface Session {
  chatId: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  authToken?: string;
  lastActivity: number;
}
```

## RAG (Retrieval Augmented Generation)

### Indexacion

- Documentacion en `docs/flows/*.md` (un archivo por flujo de la app)
- El chunker parte por headers de Markdown, fragmentos de ~500 tokens
- Embeddings generados via API de Anthropic (Voyage embeddings)
- Vectores persistidos en `data/embeddings.json`
- Comando: `npm run index-docs` para regenerar

### Consulta

- Pregunta del usuario se convierte en embedding
- Similitud coseno contra embeddings almacenados
- Se devuelven los top 3 chunks mas relevantes
- Estos chunks se inyectan como contexto en el prompt a Claude

## Tool calling (acciones sobre DulceGestion)

Claude decide cuando ejecutar acciones via tool use nativo. El engine registra las acciones disponibles como tools de Claude:

Acciones iniciales:
- `ver_pedidos`: consulta pedidos por fecha/estado
- `ver_stock`: consulta stock de ingredientes
- `ver_clientes`: busca informacion de clientes

El engine ejecuta la accion llamando a la API de DulceGestion con el authToken del usuario, y devuelve el resultado a Claude para que formule la respuesta.

## Widget web

- Archivo JS servido por el bot en `/widget.js`
- DulceGestion lo carga con: `<script src="https://bot-url/widget.js" data-token="JWT_DEL_USUARIO"></script>`
- Inyecta boton flotante (burbuja de chat) en esquina inferior derecha
- Al clickear abre iframe apuntando a `/widget/chat`
- Comunicacion via WebSocket
- El JWT del usuario permite al bot consultar la API en su nombre

## Seguridad

- **Telegram**: Solo mensajes directos (no grupos). Sin token, solo responde preguntas de docs.
- **Web widget**: Valida JWT contra API de DulceGestion antes de ejecutar acciones. Token expirado -> pide recargar pagina.
- **CORS**: Endpoint del widget solo acepta requests del dominio de DulceGestion.
- **Rate limiting**: Maximo de mensajes por minuto por usuario.

## Stack tecnico

### Dependencias

- `telegraf` - Bot de Telegram
- `ws` - WebSocket server para widget
- `express` - Servir widget + health endpoint
- `@anthropic-ai/sdk` - API de Claude (LLM + embeddings)
- `typescript` + `tsx` - Desarrollo con TS
- `vitest` - Tests
- `dotenv` - Variables de entorno

### Variables de entorno

```
TELEGRAM_TOKEN=
ANTHROPIC_API_KEY=
DULCEGESTION_API_URL=http://localhost:3000/api
SESSION_TTL_MINUTES=30
WIDGET_ALLOWED_ORIGIN=https://dulcegestion.ar
LLM_ADAPTER=hardcoded
```

`LLM_ADAPTER` define que adaptador usa el engine (hardcoded | claude).

## Iteraciones futuras (fuera de scope)

- Adapter WhatsApp (Twilio)
- Login de DulceGestion desde Telegram (vincular cuenta)
- Persistencia de sesiones en base de datos
- Mas acciones sobre la API (crear pedidos, actualizar stock)
- Notificaciones proactivas (recordatorios de pedidos)
