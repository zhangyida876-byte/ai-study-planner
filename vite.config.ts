import path from 'path';
import { defineConfig } from '@lark-apaas/fullstack-vite-preset';
import { sandboxHealthGatePlugin } from './scripts/vite-sandbox-health-gate.js';
import { sandboxCssPlugin } from './scripts/vite-sandbox-css-plugin.js';

const isSandbox = Boolean(process.env.SANDBOX_ID);

export default defineConfig({
  plugins: [sandboxHealthGatePlugin(), sandboxCssPlugin()],
  ...(isSandbox
    ? {
        css: { devSourcemap: false },
        server: {
          watch: {
            usePolling: false,
            ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          },
        },
        optimizeDeps: {
          noDiscovery: true,
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
