#!/usr/bin/env node
'use strict';

const path = require('path');
const { ensureSandboxFlags, logSandboxBoot } = require('./sandbox-detect');

function sanitizeEnvValue(key, value) {
  if (!value) return value;
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (key === 'CLIENT_BASE_PATH' && value && !value.startsWith('/')) {
    value = `/${value}`;
  }
  return value;
}

function loadEnvFile(root, filename) {
  const fs = require('fs');
  const envPath = path.join(root, filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = sanitizeEnvValue(key, trimmed.slice(eqIdx + 1).trim());
    if (!(key in process.env)) process.env[key] = value;
  }
}

function normalizeSandboxEnv(root) {
  ensureSandboxFlags(root);
  if (!process.env.SANDBOX_ID) return;

  const keys = ['CLIENT_BASE_PATH', 'CLIENT_DEV_PORT', 'CLIENT_DEV_HOST', 'SERVER_HOST', 'SERVER_PORT'];
  for (const key of keys) {
    if (process.env[key] != null && process.env[key] !== '') {
      process.env[key] = sanitizeEnvValue(key, String(process.env[key]).trim());
    }
  }
  process.env.CLIENT_DEV_HOST = '0.0.0.0';
  process.env.SERVER_HOST = '0.0.0.0';
  process.env.DISABLE_INSPECTOR = 'true';
  process.env.SANDBOX_USE_PRECOMPILED_CSS = '1';
  if (!process.env.CLIENT_DEV_PORT) process.env.CLIENT_DEV_PORT = '8080';
  logSandboxBoot(root);
  console.log(
    '[sandbox-boot] base=%s health=http://127.0.0.1:%s/dev/health',
    process.env.CLIENT_BASE_PATH || '/',
    process.env.CLIENT_DEV_PORT,
  );
}

function bootstrap(root) {
  loadEnvFile(root, '.env.local');
  loadEnvFile(root, '.env');
  normalizeSandboxEnv(root);
}

module.exports = { bootstrap };
