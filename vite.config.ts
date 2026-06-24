import path from 'path';
import { defineConfig } from '@lark-apaas/fullstack-vite-preset';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
    // Prefer TS/TSX over .js so stale transpiled *.js alongside sources won't win resolution.
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
});
