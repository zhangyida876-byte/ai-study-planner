#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MARKER = path.join(ROOT, 'node_modules', '.sandbox-native-deps-ok');

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
  'linux-x64-gnu': [
    '@rollup/rollup-linux-x64-gnu',
    '@tailwindcss/oxide-linux-x64-gnu',
    'lightningcss-linux-x64-gnu',
  ],
  'linux-x64-musl': [
    '@rollup/rollup-linux-x64-musl',
    '@tailwindcss/oxide-linux-x64-musl',
    'lightningcss-linux-x64-musl',
  ],
};

function isMuslLinux() {
  if (process.platform !== 'linux') return false;
  return (
    fs.existsSync('/lib/ld-musl-x86_64.so.1')
    || fs.existsSync('/lib/libc.musl-x86_64.so.1')
  );
}

function getTargetKey() {
  const { platform, arch } = process;
  if (platform === 'darwin') return `darwin-${arch}`;
  if (platform === 'linux' && arch === 'x64') {
    return isMuslLinux() ? 'linux-x64-musl' : 'linux-x64-gnu';
  }
  return null;
}

function isInstalled(pkg) {
  return fs.existsSync(path.join(ROOT, 'node_modules', pkg));
}

function missingPackages() {
  const key = getTargetKey();
  if (!key) return [];
  return (PLATFORM_PACKAGES[key] || []).filter((pkg) => !isInstalled(pkg));
}

function installPackage(pkg) {
  console.log(`[native-deps] 安装 ${pkg} ...`);
  execSync(`npm install --no-save --include=optional --no-audit --no-fund "${pkg}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
    timeout: 180000,
  });
}

function markOk() {
  try {
    fs.mkdirSync(path.dirname(MARKER), { recursive: true });
    fs.writeFileSync(MARKER, String(Date.now()));
  } catch {}
}

const missing = missingPackages();
if (missing.length === 0) {
  console.log('[native-deps] 原生依赖齐全');
  markOk();
  process.exit(0);
}

// 沙箱冷启动：逐包安装比全量 npm install 快得多
console.log(`[native-deps] 缺少: ${missing.join(', ')}`);
for (const pkg of missing) {
  try {
    installPackage(pkg);
  } catch (err) {
    console.warn(`[native-deps] ${pkg} 安装失败:`, err.message || err);
  }
}

const stillMissing = missingPackages();
if (stillMissing.length > 0) {
  console.warn('[native-deps] 仍缺少:', stillMissing.join(', '));
  process.exit(0);
}

console.log('[native-deps] 原生依赖安装完成');
markOk();
