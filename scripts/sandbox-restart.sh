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
if [ "${SKIP_GIT_SYNC:-0}" = "1" ]; then
  echo "[sandbox-restart] 跳过 git 同步（SKIP_GIT_SYNC=1）"
else
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  echo "[sandbox-restart] at $(git rev-parse --short HEAD)"
fi

if [ ! -d node_modules/vite ]; then
  echo "[sandbox-restart] npm install ..."
  npm install --include=optional --no-audit --no-fund
fi

echo "[sandbox-restart] 后台启动应急预览服务（防 OOM + 自动拉起）..."
echo "[sandbox-restart] 启动后可直接刷新编辑后台右侧预览"
export SANDBOX_SKIP_SERVER=1
export DISABLE_INSPECTOR=true
if [ -z "${CLIENT_DEV_HOST:-}" ]; then export CLIENT_DEV_HOST=0.0.0.0; fi
if [ -z "${CLIENT_DEV_PORT:-}" ]; then export CLIENT_DEV_PORT=8001; fi
mkdir -p logs
ULTRA_LOG=logs/sandbox-ultra.log
ULTRA_PID_FILE=logs/sandbox-ultra.supervisor.pid

echo "[sandbox-restart] 启动 ultra supervisor（后台保活）..."
pkill -f '[s]andbox-ultra-preview-server.js' 2>/dev/null || true
pkill -f '[u]ltra-supervisor' 2>/dev/null || true
sleep 1

nohup bash -lc "
  set -euo pipefail
  cd '$ROOT'
  echo \$\$ > '$ULTRA_PID_FILE'
  while true; do
    pids=\$(lsof -ti :${CLIENT_DEV_PORT} 2>/dev/null || true)
    if [ -n \"\$pids\" ]; then
      echo \"[ultra-supervisor] clearing port ${CLIENT_DEV_PORT}: \$pids\"
      echo \"\$pids\" | xargs kill -9 2>/dev/null || true
      sleep 1
    fi

    echo \"[ultra-supervisor] starting ultra-preview ...\"
    set +e
    NODE_ENV=production NODE_OPTIONS='--max-old-space-size=64 --max-semi-space-size=4' node scripts/sandbox-ultra-preview-server.js
    code=\$?
    set -e
    echo \"[ultra-supervisor] ultra-preview exited code=\$code, restart in 1s\"
    sleep 1
  done
" >> "$ULTRA_LOG" 2>&1 &

echo "[sandbox-restart] supervisor pid: $(cat "$ULTRA_PID_FILE" 2>/dev/null || echo unknown)"
echo "[sandbox-restart] 健康检查中..."

ok_count=0
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${CLIENT_DEV_PORT}/dev/health" >/dev/null 2>&1; then
    ok_count=$((ok_count + 1))
    if [ "$ok_count" -ge 3 ]; then
      echo "[sandbox-restart] ✅ health ready — 请刷新编辑后台预览"
      echo "[sandbox-restart] 日志: $ULTRA_LOG"
      exit 0
    fi
  else
    ok_count=0
  fi
  sleep 1
done

echo "[sandbox-restart] ❌ health 未就绪，请查看日志: $ULTRA_LOG"
exit 1
