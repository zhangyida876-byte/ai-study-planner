#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const PLATFORM_PACKAGES = {
  'darwin-arm64': [
    '@rollup/rollup-darwin-arm64',
    '@tailwindcss/oxide-darwin-arm64',
    'lightningcss-darwin-arm64',
  ],
  'darwin-x64': [
    '@rollup/rollup-darwin-x64',
    '@tailwindcss/oxide-darwin-x64',
    'lightningcss-darwin-x64',
  ],
  'linux-x64': [
    '@rollup/rollup-linux-x64-gnu',
    '@tailwindcss/oxide-linux-x64-gnu',
    'lightningcss-linux-x64-gnu',
  ],
};

function getTargetKey() {
  const { platform, arch } = process;
  if (platform === 'darwin') return `darwin-${arch}`;
  if (platform === 'linux' && arch === 'x64') return 'linux-x64';
  return null;
}

function isInstalled(pkg) {
  const pkgPath = path.join(ROOT, 'node_modules', pkg);
  return fs.existsSync(pkgPath);
}

function missingPackages() {
  const key = getTargetKey();
  if (!key) return [];
  const required = PLATFORM_PACKAGES[key] || [];
  return required.filter((pkg) => !isInstalled(pkg));
}

const missing = missingPackages();
if (missing.length === 0) {
  console.log('[native-deps] 原生依赖齐全，跳过安装');
  process.exit(0);
}

console.log(`[native-deps] 缺少 ${missing.join(', ')}，执行 npm install --include=optional ...`);
try {
  execSync('npm install --include=optional --no-audit --no-fund', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
    timeout: 300000,
  });
  const stillMissing = missingPackages();
  if (stillMissing.length > 0) {
    console.warn('[native-deps] 安装后仍缺少:', stillMissing.join(', '));
  } else {
    console.log('[native-deps] 原生依赖安装完成');
  }
} catch (err) {
  console.warn('[native-deps] 安装失败，不阻断启动:', err.message || err);
}
