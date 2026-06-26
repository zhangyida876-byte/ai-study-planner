import path from 'path';
import { defineConfig } from '@lark-apaas/fullstack-vite-preset';
import { sandboxHealthGatePlugin } from './scripts/vite-sandbox-health-gate.js';
import { sandboxCssPlugin, shouldUsePrebuiltCss } from './scripts/vite-sandbox-css-plugin.js';
import { isSandboxRuntime } from './scripts/sandbox-detect.js';

const root = process.cwd();
const isSandbox = isSandboxRuntime(root);
const usePrebuiltCss = shouldUsePrebuiltCss(root);

export default defineConfig({
  plugins: [sandboxHealthGatePlugin(), sandboxCssPlugin()],
  ...(isSandbox
    ? {
        css: {
          devSourcemap: false,
          // 沙箱用仓库内 sandbox-styles.css，禁止 Vite 再跑 PostCSS/Tailwind（防 OOM）
          ...(usePrebuiltCss ? { postcss: false } : {}),
        },
        server: {
          watch: {
            usePolling: false,
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          },
        },
        optimizeDeps: {
          noDiscovery: true,
          hold: true,
          include: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
          ],
        },
      }
    : {}),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
    // Prefer TS/TSX over .js so stale transpiled *.js alongside sources won't win resolution.
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
});
