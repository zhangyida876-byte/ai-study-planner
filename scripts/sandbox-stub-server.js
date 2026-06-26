#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const host = process.env.SERVER_HOST || '0.0.0.0';
const port = Number(process.env.SERVER_PORT || 3000);
const basePathRaw = String(process.env.CLIENT_BASE_PATH || '/').trim();
const basePath = (basePathRaw.replace(/\/+$/, '') || '/');
const distHtml = path.join(process.cwd(), 'dist', 'client', 'index.html');

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function sendHtml(res) {
  try {
    const html = fs.readFileSync(distHtml, 'utf8');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(html);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`stub html read failed: ${err.message || err}`);
  }
}

const server = http.createServer((req, res) => {
  const pathname = String((req.url || '').split('?')[0] || '/');
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const atBase = normalized === basePath || normalized === '/';

  if (atBase) return sendHtml(res);

  if (pathname.startsWith(`${basePath}/dev/logs`) || pathname.startsWith('/dev/logs')) {
    if (pathname.endsWith('/server-logs')) return sendJson(res, 200, { logs: [] });
    if (pathname.endsWith('/api-list')) return sendJson(res, 200, { groups: [] });
    return sendJson(res, 200, { items: [], total: 0, has_more: false });
  }

  if (pathname.startsWith(`${basePath}/dev/openapi`) || pathname.startsWith('/dev/openapi')) {
    return sendJson(res, 200, {});
  }

  if (pathname.startsWith(`${basePath}/api`) || pathname.startsWith('/api')) {
    return sendJson(res, 200, { ok: true, stub: true });
  }

  res.statusCode = 204;
  res.end();
});

server.listen(port, host, () => {
  console.log(`[sandbox-stub] listening on ${host}:${port} base=${basePath}`);
});
