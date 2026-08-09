#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { isSandboxRuntime } = require('./sandbox-detect');
const { cleanStaleClientJs } = require('./clean-stale-client-js');

const root = path.resolve(__dirname, '..');
const branch = process.env.MIAODA_GIT_BRANCH || 'sprint/default';
const nativeMarker = path.join(root, 'node_modules', '.sandbox-native-deps-ok');

function run(cmd, inherit = false) {
  return execSync(cmd, {
    cwd: root,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1' },
  }).trim();
}

function removeNativeMarker() {
  try {
    fs.rmSync(nativeMarker, { force: true });
  } catch {}
}

function installDeps(reason) {
  console.log('[sandbox-boot] npm install (%s)...', reason);
  try {
    execSync('npm install --prefer-offline --include=optional --no-audit --no-fund', {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
      timeout: 300000,
    });
    removeNativeMarker();
    console.log('[sandbox-boot] npm install done');
  } catch (err) {
    console.warn('[sandbox-boot] npm install failed:', err.message || err);
  }
}

function syncSandboxCode() {
  if (!isSandboxRuntime(root)) return;

  let didReset = false;

  try {
    run(`git fetch origin ${branch}`);
    const local = run('git rev-parse HEAD');
    const remote = run(`git rev-parse origin/${branch}`);
    console.log('[sandbox-boot] git local=%s remote=%s branch=%s', local.slice(0, 7), remote.slice(0, 7), branch);

    if (local !== remote) {
      console.log('[sandbox-boot] syncing workspace to origin/%s ...', branch);
      run(`git reset --hard origin/${branch}`, true);
      didReset = true;
      console.log('[sandbox-boot] sync done at %s', run('git rev-parse --short HEAD'));
    } else {
      console.log('[sandbox-boot] code already up to date');
    }
  } catch (err) {
    console.warn('[sandbox-boot] git sync skipped:', err.message || err);
  }

  const removed = cleanStaleClientJs(root);
  if (removed.length > 0) {
    console.log('[sandbox-boot] removed stale client JS:', removed.join(', '));
  }

  if (didReset || !fs.existsSync(path.join(root, 'node_modules', 'vite'))) {
    installDeps(didReset ? 'after git reset' : 'missing vite');
  }
}

syncSandboxCode();
