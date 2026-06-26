'use strict';

const http = require('http');
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
        backendReady = await probeBackend(serverPort, basePath);
        if (backendReady) {
          clearInterval(pollTimer);
          console.log('[sandbox-boot] NestJS HTML ready — preview safe to open');
        }
      }, 800);

      server.middlewares.use('/dev/health', (req, res, next) => {
        if (req.method && req.method !== 'GET') return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        res.end(JSON.stringify({ ready: viteListening && backendReady }));
      });
    },
  };
}

module.exports = { sandboxHealthGatePlugin };
