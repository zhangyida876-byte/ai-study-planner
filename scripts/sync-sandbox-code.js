#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const { isSandboxRuntime } = require('./sandbox-detect');

const root = path.resolve(__dirname, '..');
const branch = process.env.MIAODA_GIT_BRANCH || 'sprint/default';

function run(cmd, inherit = false) {
  return execSync(cmd, {
    cwd: root,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function syncSandboxCode() {
  if (!isSandboxRuntime(root)) return;

  try {
    run(`git fetch origin ${branch}`);
    const local = run('git rev-parse HEAD');
    const remote = run(`git rev-parse origin/${branch}`);
    console.log('[sandbox-boot] git local=%s remote=%s branch=%s', local.slice(0, 7), remote.slice(0, 7), branch);

    if (local === remote) {
      console.log('[sandbox-boot] code already up to date');
      return;
    }

    console.log('[sandbox-boot] syncing workspace to origin/%s ...', branch);
    run(`git reset --hard origin/${branch}`, true);
    console.log('[sandbox-boot] sync done at %s', run('git rev-parse --short HEAD'));
  } catch (err) {
    console.warn('[sandbox-boot] git sync skipped:', err.message || err);
  }
}

syncSandboxCode();
