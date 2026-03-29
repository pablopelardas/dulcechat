#!/bin/bash
set -e

VPS_HOST="31.97.173.157"
VPS_USER="root"
APP_DIR="/var/www/dulcechat"

echo "=== DulceChat Deploy ==="

# 1. Package the app (excluding dev files)
echo "[1/4] Packaging..."
cd "$(dirname "$0")/.."
tar czf /tmp/dulcechat.tar.gz \
  --exclude=node_modules \
  --exclude=.env \
  --exclude=.git \
  --exclude=data/embeddings.json \
  --exclude=tests \
  --exclude=docs/superpowers \
  .

# 2. Upload
echo "[2/4] Uploading to VPS..."
scp /tmp/dulcechat.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

# 3. Deploy on VPS
echo "[3/4] Deploying on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'REMOTE'
set -e
APP_DIR="/var/www/dulcechat"

# Create dir if first deploy
mkdir -p $APP_DIR/logs $APP_DIR/data

# Backup .env and embeddings if they exist
[ -f $APP_DIR/.env ] && cp $APP_DIR/.env /tmp/dulcechat-env-backup
[ -f $APP_DIR/data/embeddings.json ] && cp $APP_DIR/data/embeddings.json /tmp/dulcechat-embeddings-backup

# Stop if running
pm2 stop dulcechat 2>/dev/null || true

# Extract new code
cd $APP_DIR
rm -rf src widget docs package.json tsconfig.json ecosystem.config.cjs
tar xzf /tmp/dulcechat.tar.gz

# Restore .env and embeddings
[ -f /tmp/dulcechat-env-backup ] && mv /tmp/dulcechat-env-backup $APP_DIR/.env
[ -f /tmp/dulcechat-embeddings-backup ] && mv /tmp/dulcechat-embeddings-backup $APP_DIR/data/embeddings.json

# Install production deps
npm install --production

# Start/restart with PM2
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "=== Deploy complete ==="
pm2 list | grep dulcechat
REMOTE

echo "[4/4] Done!"
rm /tmp/dulcechat.tar.gz
