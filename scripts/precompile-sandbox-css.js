#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const tailwindPostcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'client/src/index.css');
const output = path.join(root, 'client/src/.sandbox-compiled.css');
const emptyInspectorCss = path.join(
  root,
  'node_modules/@lark-apaas/fullstack-vite-preset/src/empty.css',
);

async function main() {
  console.log('[sandbox-boot] pre-compiling CSS (keeps Tailwind out of Vite, avoids OOM)...');
  const css = fs.readFileSync(input, 'utf8');
  const result = await postcss([
    postcssImport({
      resolve(id) {
        if (id === '@/inspector.dev.css') return emptyInspectorCss;
        return id;
      },
    }),
    tailwindPostcss(),
    autoprefixer(),
  ]).process(css, { from: input, to: output });
  fs.writeFileSync(output, result.css);
  console.log('[sandbox-boot] pre-compiled CSS ok:', path.relative(root, output));
}

main().catch((err) => {
  console.error('[sandbox-boot] CSS precompile failed:', err.message);
  process.exit(1);
});
