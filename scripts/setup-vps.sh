#!/bin/bash
# Run this ONCE on the VPS to set up DulceChat for the first time
# Usage: ssh root@31.97.173.157 'bash -s' < scripts/setup-vps.sh
set -e

APP_DIR="/var/www/dulcechat"

echo "=== DulceChat VPS Setup ==="

# Create app directory
mkdir -p $APP_DIR/logs $APP_DIR/data

# Create .env (edit these values!)
cat > $APP_DIR/.env << 'EOF'
TELEGRAM_TOKEN=
ANTHROPIC_API_KEY=
DULCEGESTION_API_URL=http://localhost:3001/api
SESSION_TTL_MINUTES=30
SESSION_MAX_HISTORY=20
WIDGET_ALLOWED_ORIGIN=http://localhost:3002
LLM_ADAPTER=claude
PORT=3002
VOYAGE_API_KEY=
EOF

# Install tsx globally if not present
which tsx >/dev/null 2>&1 || npm install -g tsx

echo "=== Setup complete ==="
echo "Now run the deploy script: bash scripts/deploy.sh"
echo "After deploy, index the docs: ssh root@31.97.173.157 'cd /var/www/dulcechat && npx tsx src/rag/embeddings.ts'"
