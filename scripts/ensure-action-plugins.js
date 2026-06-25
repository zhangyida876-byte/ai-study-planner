#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CAP_DIR = path.join(ROOT, 'server', 'capabilities');

function hasCapabilityFiles() {
  if (!fs.existsSync(CAP_DIR)) return false;
  return fs.readdirSync(CAP_DIR).some((f) => f.endsWith('.json'));
}

if (hasCapabilityFiles()) {
  console.log('[action-plugins] server/capabilities 已存在，跳过 fullstack-cli init');
  process.exit(0);
}

try {
  execSync('npx -y fullstack-cli action-plugin init', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
    timeout: 120000,
  });
} catch (err) {
  console.warn('[action-plugins] init 失败，不阻断安装/启动:', err.message || err);
  process.exit(0);
}
