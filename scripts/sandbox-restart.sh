#!/usr/bin/env bash
# 妙搭编辑后台沙箱：释放端口 → 同步最新代码 → 启动 dev（仅供 SANDBOX 终端使用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${MIAODA_GIT_BRANCH:-sprint/default}"

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

echo "[sandbox-restart] 启动 npm run dev（勿关此终端）..."
exec npm run dev
