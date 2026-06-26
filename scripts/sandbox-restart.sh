#!/usr/bin/env bash
# 妙搭编辑后台沙箱：清理环境 + 同步代码 + 预编译 Nest
# ⚠️ 不要在此脚本里启动 dev —— 预览 UI 只认平台自动拉起的 dev 进程
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${MIAODA_GIT_BRANCH:-sprint/default}"

echo "[sandbox-restart] 停止手动 dev（避免与平台 dev 冲突）..."
pkill -f '[s]cripts/dev.js' 2>/dev/null || true
pkill -f 'vite --config vite.config.ts' 2>/dev/null || true
pkill -f 'dist/server/main.js' 2>/dev/null || true
rm -f /tmp/miaoda-dev.lock
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

echo ""
echo "============================================"
echo "✅ 沙箱环境已就绪"
echo ""
echo "接下来请："
echo "  1. 不要在此终端运行 npm run dev"
echo "  2. 回到妙搭编辑页，按 Cmd+Shift+R 强制刷新整页"
echo "  3. 等 2–3 分钟，让平台自动启动 dev"
echo "  4. 预览区应自动加载（无需手动起服务）"
echo ""
echo "若仍显示「启动失败」，把平台「启动日志」最后 30 行发我"
echo "============================================"
