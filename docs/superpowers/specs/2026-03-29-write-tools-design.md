# DulceChat Write Tools - Design Spec

## Overview

Add write capabilities to Caramelo (crear pedidos, clientes, descuentos) with confirmation-based UX and disambiguation for ambiguous matches. Also add missing RAG documentation for discounts.

## API Changes (DulceGestion)

### New: `GET /api/bot/search-items?q=<query>`

Dedicated endpoint for the bot. Searches recipes and products by name, returns calculated prices.

- Uses `shared/costCalculations.js` server-side for price calculation
- Partial match, case-insensitive on name
- Max ~15 results
- Includes organization's `priceRounding`

**Response:**
```json
{
  "items": [
    { "id": 5, "type": "product", "name": "Torta Brownie 20p", "price": 15000 },
    { "id": 3, "type": "recipe", "name": "Torta Brownie 10p", "price": 8500 }
  ],
  "priceRounding": 50
}
```

### Modified: `GET /api/customers`

Add `?q=<query>` parameter for name search (partial, case-insensitive). Existing behavior unchanged when `q` is not provided.

### Unchanged

- `POST /api/orders` — used as-is
- `POST /api/customers` — used as-is
- `POST /api/discount-codes` — used as-is

## New MCP Tools (DulceChat)

All write tools return only essential fields to minimize token usage.

### `buscar_items`

- **Purpose:** Search recipes and products by name
- **Input:** `{ query: string }`
- **Calls:** `GET /api/bot/search-items?q=...`
- **Returns:** `{ items: [{ id, type, name, price }], priceRounding }`

### `crear_pedido`

- **Purpose:** Create an order
- **Input:** `{ customerId: number, delivery_date: string, items: [{ recipeId?: number, productId?: number, quantity: number, price: number }], notes?: string, discount_code?: string }`
- **Calls:** `POST /api/orders`
- **Returns:** `{ id, orderNumber, customer, total, status }` (trimmed)
- **Note:** The `type` field from `buscar_items` determines whether to send `recipeId` or `productId` for each item. The LLM maps this in the confirmation step.

### `crear_cliente`

- **Purpose:** Create a customer
- **Input:** `{ name: string, phone?: string, address?: string, notes?: string }`
- **Calls:** `POST /api/customers`
- **Returns:** `{ id, name, phone }` (trimmed)

### `crear_descuento`

- **Purpose:** Create a discount code
- **Input:** `{ code: string, type: string, value: number, min_order?: number, max_uses?: number, expires_at?: string }`
- **Calls:** `POST /api/discount-codes`
- **Returns:** `{ id, code, type, value }` (trimmed)

## Modified MCP Tool

### `ver_clientes`

- Add optional `query` parameter to input schema
- When provided, pass as `?q=...` to the API

## Conversation Flows

### Confirmation Rule

All write tools require confirmation. Caramelo MUST present a summary and wait for explicit "si" before executing any write tool. This is enforced via system prompt.

### Disambiguation Rule

When searching for clients or items, if multiple matches are found, Caramelo presents numbered options. The user picks by number.

### Create Order Flow

1. User: "Creame un pedido para Maria, 2 tortas brownie para el viernes"
2. Caramelo calls `ver_clientes` with query "Maria"
   - 1 match: uses it
   - Multiple: numbered options, user picks
   - 0 matches: offers to create new client
3. Caramelo calls `buscar_items` with query "torta brownie"
   - 1 match: uses it
   - Multiple: numbered options, user picks
   - 0 matches: tells user item not found
4. Caramelo presents summary: "Pedido para Maria Lopez, 2x Torta Brownie 20p a $15000 c/u, total $30000, entrega viernes 04/04. Confirmo?"
5. User: "Si"
6. Caramelo calls `crear_pedido`
7. Confirms with order number

### Create Customer Flow

1. User: "Agrega a Maria Lopez, tel 1155443322"
2. Caramelo calls `ver_clientes` with query "Maria Lopez"
   - Exists: "Ya existe Maria Lopez (tel: 1155...). Es esta persona o creo uno nuevo?"
   - Doesn't exist: "Voy a crear el cliente Maria Lopez con telefono 1155443322. Confirmo?"
3. User: "Si"
4. Caramelo calls `crear_cliente`

### Create Discount Flow

1. User: "Crea un descuento PROMO10 del 10%"
2. Caramelo: "Voy a crear el codigo PROMO10 con 10% de descuento, sin limite de usos ni vencimiento. Confirmo?"
3. User: "Si"
4. Caramelo calls `crear_descuento`

## System Prompt Changes

Add to Caramelo's system prompt:

- Confirmation rule: always show summary before write operations, wait for explicit confirmation
- Disambiguation rule: present numbered options when multiple matches found
- Write tools are available: crear_pedido, crear_cliente, crear_descuento, buscar_items

## RAG Documentation

### New: `docs/flows/descuentos.md`

Documentation about the discount codes feature in DulceGestion for RAG retrieval. Covers:

- What discount codes are
- How to create them (code, type percentage/fixed, value, min_order, max_uses, expiration)
- How to apply them to orders
- How to manage them (edit, deactivate, delete)

## Engine

No changes needed. The confirmation flow naturally splits across conversation turns, so the single-tool-per-turn limitation is not a problem.

## ApiClient

### Modified: add POST support

Currently `ApiClient.fetch()` only does GET requests. Need to add a method for POST requests (or extend `fetch` to accept method + body).

## File Changes Summary

### DulceGestion (GestionPasteleria)

| File | Change |
|------|--------|
| `server/routes/bot.js` (new) | `GET /api/bot/search-items` endpoint |
| `server/app.js` | Register bot routes |
| `server/routes/customers.js` | Add `?q=` filter to GET endpoint |

### DulceChat

| File | Change |
|------|--------|
| `src/mcp/api-client.ts` | Add POST method |
| `src/mcp/tools/search-items.ts` (new) | `buscar_items` tool |
| `src/mcp/tools/create-order.ts` (new) | `crear_pedido` tool |
| `src/mcp/tools/create-customer.ts` (new) | `crear_cliente` tool |
| `src/mcp/tools/create-discount.ts` (new) | `crear_descuento` tool |
| `src/mcp/tools/customers.ts` | Add query param to `ver_clientes` |
| `src/mcp/tools/index.ts` | Register new tools |
| `src/llm/claude.ts` | Update system prompt |
| `docs/flows/descuentos.md` (new) | RAG doc for discounts |
