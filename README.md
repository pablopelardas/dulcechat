# DulceChat

Multi-channel chatbot for [DulceGestion](https://dulcegestion.ar) - a pastry shop management SaaS.

## What it does

- Answers user questions about how to use the app (RAG-powered from documentation)
- Queries live business data (orders, stock, customers) via tool calling
- Works on **Telegram**, **Web Widget** (embeddable), and **WhatsApp** (Twilio)
- Exposes an **MCP server** for use with Claude Desktop/Code

## Architecture

```
Channels (in/out)        Brain                  Data
+----------------+    +----------------+    +------------------+
| Telegram       |--->|                |--->| RAG (docs)       |
| Web Widget     |--->|   Bot Engine   |--->| MCP Tools        |
| WhatsApp       |--->|                |--->| Claude LLM       |
+----------------+    +----------------+    +------------------+
```

**Adapter pattern** - each layer has swappable implementations:
- **Channels**: Telegram (telegraf), WebSocket (widget), WhatsApp (Twilio)
- **LLM**: Claude (Anthropic API) or hardcoded (keyword matching for testing)
- **Tools**: MCP registry with DulceGestion API client

## Tech Stack

TypeScript, Express, telegraf, ws, @anthropic-ai/sdk, @modelcontextprotocol/sdk, Voyage AI (embeddings), vitest

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your keys

# Index documentation for RAG
npm run index-docs

# Run
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_TOKEN` | Bot token from @BotFather |
| `ANTHROPIC_API_KEY` | Claude API key |
| `VOYAGE_API_KEY` | Voyage AI key (for embeddings) |
| `DULCEGESTION_API_URL` | DulceGestion API endpoint |
| `LLM_ADAPTER` | `claude` or `hardcoded` |
| `PORT` | HTTP server port (default: 3002) |
| `SESSION_TTL_MINUTES` | Chat session timeout |
| `WIDGET_ALLOWED_ORIGIN` | CORS origin for widget |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload |
| `npm start` | Start in production |
| `npm test` | Run tests |
| `npm run index-docs` | Generate RAG embeddings from docs/flows/ |
| `npm run mcp` | Start MCP stdio server (for Claude Desktop/Code) |

## MCP Server

Use with Claude Desktop or Claude Code:

```json
{
  "mcpServers": {
    "dulcegestion": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"],
      "cwd": "/path/to/dulcechat",
      "env": {
        "DULCEGESTION_API_URL": "http://localhost:3001/api",
        "DULCEGESTION_AUTH_TOKEN": "your-jwt-token"
      }
    }
  }
}
```

## Embeddable Widget

Add to any page:

```html
<script src="https://your-server/dulcechat/widget.js" data-token="USER_JWT"></script>
```

## Project Structure

```
src/
  channels/        # Messaging adapters (Telegram, Web, WhatsApp)
  llm/             # LLM adapters (Claude, hardcoded)
  mcp/             # MCP tools and server
    tools/         # Individual tool implementations
  rag/             # RAG system (chunker, embeddings, retriever)
  session/         # In-memory session store with TTL
  engine.ts        # Core orchestrator
  index.ts         # Entry point
docs/flows/        # User documentation for RAG indexing
widget/            # Embeddable chat widget (HTML + JS)
```

## Adding New Tools

1. Create `src/mcp/tools/your-tool.ts` implementing `McpTool`
2. Register it in `src/index.ts`
3. Automatically available in DulceChat, Claude Desktop, and Claude Code
