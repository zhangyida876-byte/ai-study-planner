#!/usr/bin/env bash
# 妙搭编辑后台沙箱：清理环境 + 同步代码 + 前台启动 dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${MIAODA_GIT_BRANCH:-sprint/default}"

echo "[sandbox-restart] 停止手动 dev（避免与平台 dev 冲突）..."
pkill -f '[s]cripts/dev.js' 2>/dev/null || true
pkill -f 'vite --config vite.config.ts' 2>/dev/null || true
pkill -f 'dist/server/main.js' 2>/dev/null || true
pkill -f 'sandbox-stub-server.js' 2>/dev/null || true
pkill -f 'dev:server:sandbox:stub' 2>/dev/null || true
pkill -f 'dev:server:sandbox:dist' 2>/dev/null || true
pkill -f 'npm run dev:server' 2>/dev/null || true
pkill -f 'npm run dev$' 2>/dev/null || true
sleep 1

echo "[sandbox-restart] 释放 8001 / 3000 ..."
for port in 8001 3000; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "[sandbox-restart] kill port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 1

echo "[sandbox-restart] 同步 origin/$BRANCH ..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "[sandbox-restart] at $(git rev-parse --short HEAD)"

if [ ! -d node_modules/vite ]; then
  echo "[sandbox-restart] npm install ..."
  npm install --include=optional --no-audit --no-fund
fi

echo "[sandbox-restart] 前台启动应急预览服务（防 OOM）..."
echo "[sandbox-restart] 启动后可直接刷新编辑后台右侧预览"
export SANDBOX_SKIP_SERVER=1
export DISABLE_INSPECTOR=true
if [ -z "${CLIENT_DEV_HOST:-}" ]; then export CLIENT_DEV_HOST=0.0.0.0; fi
if [ -z "${CLIENT_DEV_PORT:-}" ]; then export CLIENT_DEV_PORT=8001; fi
exec npm run dev:sandbox:ultra-preview
