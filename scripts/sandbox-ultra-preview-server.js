#!/usr/bin/env node
'use strict';

const http = require('http');

const host = process.env.CLIENT_DEV_HOST || '0.0.0.0';
const port = Number(process.env.CLIENT_DEV_PORT || 8001);
const basePathRaw = String(process.env.CLIENT_BASE_PATH || '/').trim();
const basePath = basePathRaw.replace(/\/+$/, '') || '/';
const onlineUrl = process.env.SANDBOX_ONLINE_URL || 'https://guanghe.aiforce.cloud/app/app_4ke0jqzqjy118';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function page() {
  return `<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>开发预览（应急模式）</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; line-height: 1.6; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; max-width: 860px; }
    .muted { color: #666; font-size: 14px; }
    a { color: #1677ff; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>开发预览已启动（应急模式）</h2>
    <p>当前沙箱内存不足，Vite 进程会被系统 OOM 杀死。已切换到应急预览，避免右侧持续 502。</p>
    <p>你可以先在此确认“服务已启动”，再通过线上地址继续验证功能：</p>
    <p><a href="${onlineUrl}" target="_blank" rel="noreferrer">${onlineUrl}</a></p>
    <p class="muted">basePath: <code>${basePath}/</code> · port: <code>${port}</code></p>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const pathname = String((req.url || '').split('?')[0] || '/');
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const atBase = normalized === '/' || normalized === basePath;

  if (pathname === '/dev/health' || pathname === `${basePath}/dev/health`) {
    return json(res, 200, { ready: true, mode: 'ultra-preview' });
  }

  if (pathname.startsWith(`${basePath}/dev/logs`) || pathname.startsWith('/dev/logs')) {
    if (pathname.endsWith('/server-logs')) return json(res, 200, { logs: [] });
    if (pathname.endsWith('/api-list')) return json(res, 200, { groups: [] });
    return json(res, 200, { items: [], total: 0, has_more: false });
  }

  if (atBase) return html(res, 200, page());

  return html(res, 404, 'Not Found');
});

server.listen(port, host, () => {
  console.log(`[sandbox-ultra] listening on ${host}:${port} base=${basePath}`);
});
