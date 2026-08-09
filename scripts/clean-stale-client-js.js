#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/** Remove stray compiled *.js under client/src that shadow matching TS/TSX sources. */
function cleanStaleClientJs(root) {
  const projectRoot = root || path.resolve(__dirname, '..');
  const srcRoot = path.join(projectRoot, 'client', 'src');
  if (!fs.existsSync(srcRoot)) return [];

  const removed = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.js')) continue;
      const tsxPath = fullPath.slice(0, -3) + '.tsx';
      const tsPath = fullPath.slice(0, -3) + '.ts';
      if (fs.existsSync(tsxPath) || fs.existsSync(tsPath)) {
        fs.rmSync(fullPath, { force: true });
        removed.push(path.relative(projectRoot, fullPath));
      }
    }
  };

  walk(srcRoot);
  return removed;
}

if (require.main === module) {
  const removed = cleanStaleClientJs();
  if (removed.length > 0) {
    console.log('[clean-stale-client-js] removed:', removed.join(', '));
  }
}

module.exports = { cleanStaleClientJs };
