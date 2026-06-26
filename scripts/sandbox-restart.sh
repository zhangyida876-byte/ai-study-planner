#!/usr/bin/env bash
# 妙搭编辑后台沙箱：停旧 dev → 释放端口 → 同步代码 → 预编译 Nest → 后台启动 dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${MIAODA_GIT_BRANCH:-sprint/default}"
LOG="/tmp/sandbox-dev.log"
LOCK="/tmp/miaoda-dev.lock"

echo "[sandbox-restart] 停止已有 dev 进程 ..."
pkill -f '[s]cripts/dev.js' 2>/dev/null || true
pkill -f 'vite --config vite.config.ts' 2>/dev/null || true
pkill -f 'dist/server/main.js' 2>/dev/null || true
rm -f "$LOCK"
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

if [ ! -f dist/server/main.js ]; then
  echo "[sandbox-restart] 预编译 Nest（首次约 1 分钟）..."
  npm run build:server
fi

echo "[sandbox-restart] 后台启动 dev，日志 → $LOG"
: > "$LOG"
nohup npm run dev >> "$LOG" 2>&1 &
DEV_PID=$!
echo "$DEV_PID" > "$LOCK"
echo "[sandbox-restart] dev PID=$DEV_PID"
echo "[sandbox-restart] 等待就绪（最多 3 分钟）..."
for i in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:8001/dev/health" 2>/dev/null | grep -q '"ready":true'; then
    echo "[sandbox-restart] ✅ health ready — 请刷新编辑后台预览"
    exit 0
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "[sandbox-restart] ❌ dev 进程已退出，最近日志："
    tail -30 "$LOG"
    exit 1
  fi
  sleep 2
done
echo "[sandbox-restart] ⏳ 超时，最近日志："
tail -30 "$LOG"
echo "[sandbox-restart] dev 可能仍在启动，可执行: tail -f $LOG"
