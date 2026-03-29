# MCP Server para DulceGestion

## Objetivo

Reemplazar el sistema de actions actual por un registry de tools MCP que sea:
- Usable internamente por DulceChat (imports directos)
- Usable externamente por Claude Desktop/Code (MCP server stdio)
- Optimizado en tokens (respuestas JSON compactas)
- Facil de extender con nuevos tools

## Arquitectura

```
src/mcp/
  tools/
    orders.ts         # Tool ver_pedidos
    stock.ts          # Tool ver_stock
    customers.ts      # Tool ver_clientes
  registry.ts         # Registry central de tools
  server.ts           # MCP server stdio (para Claude Desktop/Code)
  client.ts           # Helper para uso interno desde DulceChat
```

### Tools

Cada tool es un modulo que exporta:
- `name`: identificador unico
- `description`: para que Claude sepa cuando usarlo
- `inputSchema`: JSON Schema de los parametros
- `execute(params, authToken)`: funcion que llama a la API y devuelve datos estructurados

```typescript
interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>, authToken: string): Promise<unknown>;
}
```

### Tools iniciales

**ver_pedidos**
- Params: status?, startDate?, endDate?
- Llama a: GET /api/orders?startDate=...&endDate=...&status=...
- Devuelve: array de { id, customer, status, deliveryDate, total } (solo campos utiles)

**ver_stock**
- Params: (ninguno)
- Llama a: GET /api/ingredients
- Devuelve: { total, lowStock: [...], ingredients: [{ name, stock, unit }] } (top 15 + alertas)

**ver_clientes**
- Params: (ninguno)
- Llama a: GET /api/customers?_include=balance
- Devuelve: array de { name, phone, balance } (top 10)

### Formato de respuesta

Los tools devuelven objetos JS (no strings). El engine los serializa a JSON compacto para pasarle a Claude. Esto es mas eficiente que el formato texto actual.

Ejemplo actual (texto):
```
Encontre 3 pedidos:
- Pedido #44: pending | Camila guiñazu | Entrega: miercoles 2 de abril
- Pedido #48: pending | Claudia Perez | Entrega: viernes 4 de abril
```

Ejemplo nuevo (JSON compacto):
```json
[
  {"id":44,"customer":"Camila guiñazu","status":"pending","date":"mie 2/4"},
  {"id":48,"customer":"Claudia Perez","status":"pending","date":"vie 4/4"}
]
```

Claude interpreta JSON sin problemas y arma la respuesta en lenguaje natural.

### Registry

`registry.ts` mantiene un Map de tools registrados. Expone:
- `register(tool)`: registra un tool
- `get(name)`: obtiene un tool por nombre
- `getAll()`: devuelve todos los tools (para generar tools de Claude API y MCP)
- `toClaudeTools()`: genera el array de tools en formato Anthropic SDK

### Client (uso interno)

`client.ts` exporta una clase `McpClient` que:
- Recibe el apiUrl en el constructor
- Usa el registry para ejecutar tools
- Es el reemplazo directo de `DulceGestionActions`

### Server (uso externo)

`server.ts` es un MCP server stdio usando `@modelcontextprotocol/sdk`. Expone los mismos tools del registry como tools MCP. Se puede usar como:
```bash
npx tsx src/mcp/server.ts
```

Y se configura en Claude Desktop/Code apuntando a ese comando.

El authToken se pasa como variable de entorno `DULCEGESTION_AUTH_TOKEN` cuando se usa externamente.

## Cambios en codigo existente

- **Eliminar** `src/actions/action.ts` y `src/actions/dulcegestion.ts`
- **Eliminar** `tests/actions/dulcegestion.test.ts`
- **Modificar** `src/engine.ts`: usar McpClient en vez de DulceGestionActions
- **Modificar** `src/llm/claude.ts`: obtener tools del registry via `toClaudeTools()` en vez de array hardcodeado
- **Modificar** `src/llm/llm.ts`: no necesita cambios
- **Modificar** `src/index.ts`: instanciar McpClient en vez de DulceGestionActions
- **Agregar** dependencia: `@modelcontextprotocol/sdk`

## Extensibilidad

Para agregar un nuevo tool (ej: ver_recetas):
1. Crear `src/mcp/tools/recipes.ts` implementando McpTool
2. Registrarlo en `registry.ts`
3. Listo — automaticamente disponible en DulceChat, Claude Desktop, y en el array de tools de Claude API
