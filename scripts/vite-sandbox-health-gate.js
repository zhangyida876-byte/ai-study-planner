'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { isSandboxRuntime } = require('./sandbox-detect');

function sanitizeBasePath(value) {
  if (!value) return '/';
  let path = String(value).trim();
  if (
    (path.startsWith('"') && path.endsWith('"'))
    || (path.startsWith("'") && path.endsWith("'"))
  ) {
    path = path.slice(1, -1);
  }
  if (!path.startsWith('/')) path = `/${path}`;
  return path.replace(/\/+$/, '') || '/';
}

function probeBackend(port, basePath) {
  const path = basePath === '/' ? '/' : `${basePath}/`;
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path,
        timeout: 3000,
        headers: { Accept: 'text/html' },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode != null && res.statusCode < 500);
      },
    );
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** 沙箱预览依赖 Nest 渲染 HTML；仅 Vite listening 时 ready 会导致预览空白 */
function sandboxHealthGatePlugin() {
  if (!isSandboxRuntime(process.cwd())) {
    return { name: 'sandbox-health-gate-noop' };
  }

  const serverPort = Number(process.env.SERVER_PORT || 3000);
  const basePath = sanitizeBasePath(process.env.CLIENT_BASE_PATH);
  const skipServer = process.env.SANDBOX_SKIP_SERVER === '1';
  let viteListening = false;
  let backendReady = false;
  let pollTimer;

  return {
    name: 'sandbox-health-gate',
    enforce: 'pre',
    configureServer(server) {
      const httpServer = server.httpServer;
      if (!httpServer || httpServer.listening) {
        viteListening = true;
      } else {
        httpServer.once('listening', () => {
          viteListening = true;
          console.log('[sandbox-boot] vite listening, waiting for NestJS HTML...');
        });
      }

      pollTimer = setInterval(async () => {
        if (backendReady) return;
        if (skipServer) {
          backendReady = true;
          clearInterval(pollTimer);
          console.log('[sandbox-boot] skip server mode: backend probe bypassed');
          return;
        }
        backendReady = await probeBackend(serverPort, basePath);
        if (backendReady) {
          clearInterval(pollTimer);
          console.log('[sandbox-boot] NestJS HTML ready — preview safe to open');
        }
      }, 800);

      if (skipServer) {
        // 轻量模式下无 Nest，直接由 Vite 返回“开发态”入口 HTML，避免 /app/... 502。
        server.middlewares.use(async (req, res, next) => {
          const url = (req.url || '').split('?')[0];
          const normalized = url.replace(/\/+$/, '') || '/';
          const baseNormalized = basePath.replace(/\/+$/, '') || '/';
          const shouldServeHtml = normalized === '/' || normalized === baseNormalized;
          if (!shouldServeHtml) return next();
          try {
            const htmlPath = path.join(process.cwd(), 'client', 'index.html');
            const html = fs.readFileSync(htmlPath, 'utf8');
            const transformed = await server.transformIndexHtml(req.url || basePath, html);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(transformed);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(`sandbox html fallback failed: ${err.message || err}`);
          }
        });
      }

      server.middlewares.use('/dev/health', (req, res, next) => {
        if (req.method && req.method !== 'GET') return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        // 妙搭外壳规范：Vite listening 即 ready:true（与 preset healthPlugin 一致）
        // Nest 仍在后台预热；预览 iframe 通过 Vite 反代，不必等 Nest 才报 ready
        res.end(JSON.stringify({ ready: viteListening }));
      });
    },
  };
}

module.exports = { sandboxHealthGatePlugin };
