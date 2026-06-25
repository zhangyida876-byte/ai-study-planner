#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// ── Project root ──────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

// ── Load .env ─────────────────────────────────────────────────────────────────
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

function loadEnvFile(filename) {
  const envPath = path.join(PROJECT_ROOT, filename);
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = sanitizeEnvValue(key, trimmed.slice(eqIdx + 1).trim());
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

/** 平台可能在 dev.js 之前注入带引号的 env，必须强制规范化 */
function normalizeSandboxEnv() {
  const keys = [
    'CLIENT_BASE_PATH',
    'CLIENT_DEV_PORT',
    'CLIENT_DEV_HOST',
    'SERVER_HOST',
    'SERVER_PORT',
    'FORCE_DB_BRANCH',
  ];
  for (const key of keys) {
    if (process.env[key] != null && process.env[key] !== '') {
      process.env[key] = sanitizeEnvValue(key, String(process.env[key]).trim());
    }
  }
  if (process.env.SANDBOX_ID) {
    process.env.CLIENT_DEV_HOST = '0.0.0.0';
    process.env.SERVER_HOST = '0.0.0.0';
    // 妙搭沙箱 nginx 固定反代 8001
    process.env.CLIENT_DEV_PORT = '8001';
  }
}

normalizeSandboxEnv();

// 启动诊断信息（写入 stdout，沙箱 UI 可直接看到）
if (process.env.SANDBOX_ID) {
  console.log('[sandbox-boot] SANDBOX_ID=%s', process.env.SANDBOX_ID);
  console.log('[sandbox-boot] CLIENT_DEV_PORT=%s CLIENT_BASE_PATH=%s', process.env.CLIENT_DEV_PORT, process.env.CLIENT_BASE_PATH);
  console.log('[sandbox-boot] CLIENT_DEV_HOST=%s SERVER_HOST=%s', process.env.CLIENT_DEV_HOST, process.env.SERVER_HOST);
}

// ── Configuration ─────────────────────────────────────────────────────────────
const LOG_DIR = process.env.LOG_DIR || 'logs';
const MAX_RESTART_COUNT = process.env.MAX_RESTART_COUNT != null && process.env.MAX_RESTART_COUNT !== ''
  ? parseInt(process.env.MAX_RESTART_COUNT, 10)
  : Infinity;
const RESTART_DELAY = parseInt(process.env.RESTART_DELAY, 10) || 2;
const MAX_DELAY = 8;
const SERVER_PORT = process.env.SERVER_PORT || '3000';
const CLIENT_DEV_PORT = process.env.CLIENT_DEV_PORT || '8080';

fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Logging infrastructure ────────────────────────────────────────────────────
const devStdLogPath = path.join(LOG_DIR, 'dev.std.log');
const devLogPath = path.join(LOG_DIR, 'dev.log');
const devStdLogFd = fs.openSync(devStdLogPath, 'a');
const devLogFd = fs.openSync(devLogPath, 'a');

function timestamp() {
  const now = new Date();
  return (
    now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0')
  );
}

// Cap pending async stdout writes so a stalled pty consumer can't grow memory unbounded.
// Each pending fs.write retains ~1.5 KB (msg + libuv/V8 wrappers); 1000 ≈ ~1.5 MB ceiling.
let _stdoutInFlight = 0;
const STDOUT_MAX_INFLIGHT = 1000;

/** Write to dev.std.log (sync, guaranteed) + mirror to terminal (async, non-blocking) */
function writeOutput(msg) {
  // File first and synchronously — read-logs reads this file; it must never be gated
  // by the terminal consumer.
  try { fs.writeSync(devStdLogFd, msg); } catch {}
  // stdout mirror via async fs.write: if process.stdout is a pty/pipe whose consumer
  // stalls, the block happens on the libuv threadpool, NOT the event loop — so the
  // synchronous log-FILE writes above (and subsequent readline callbacks) keep running.
  // Drop overflow when too many writes are already pending (best-effort mirror).
  if (_stdoutInFlight >= STDOUT_MAX_INFLIGHT) { return; }
  _stdoutInFlight++;
  try { fs.write(1, msg, () => { _stdoutInFlight--; }); } catch { _stdoutInFlight--; }
}

/** Structured event log → terminal + dev.std.log + dev.log */
function logEvent(level, name, message) {
  const msg = `[${timestamp()}] [${level}] [${name}] ${message}\n`;
  writeOutput(msg);
  try { fs.writeSync(devLogFd, msg); } catch {}
}

// ── Process group management ──────────────────────────────────────────────────
function killProcessGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch {}
}

function killOrphansByPort(port) {
  const killed = new Set();
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8', timeout: 5000 }).trim();
    if (pids) {
      for (const p of pids.split('\n').filter(Boolean)) {
        try {
          process.kill(parseInt(p, 10), 'SIGKILL');
          killed.add(p);
        } catch {}
      }
    }
  } catch {}
  // Linux 沙箱 fallback：lsof 可能漏掉仍占用端口的 node 子进程
  try {
    execSync(`fuser -k ${port}/tcp`, { timeout: 5000, stdio: 'ignore' });
  } catch {}
  return [...killed];
}

function isPortInUse(port) {
  try {
    execSync(`lsof -ti :${port}`, { encoding: 'utf8', timeout: 3000, stdio: 'pipe' });
    return true;
  } catch {
    try {
      execSync(`fuser -n tcp ${port}`, { encoding: 'utf8', timeout: 3000, stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

async function ensurePortFree(port, label) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (!isPortInUse(port)) return;
    logEvent('WARN', 'main', `${label} port ${port} in use, cleaning (attempt ${attempt}/5)`);
    killOrphansByPort(port);
    await sleep(1000);
  }
  if (isPortInUse(port)) {
    logEvent('ERROR', 'main', `${label} port ${port} still in use after cleanup`);
  }
}

// ── Process supervision ───────────────────────────────────────────────────────
let stopping = false;
const managedProcesses = []; // { name, pid, child }

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start and supervise a process with auto-restart and log piping.
 * Returns a promise that resolves when the process loop ends.
 */
function startProcess({ name, command, args, cleanupPort }) {
  const logFilePath = path.join(LOG_DIR, `${name}.std.log`);
  const logFd = fs.openSync(logFilePath, 'a');

  const entry = { name, pid: null, child: null };
  managedProcesses.push(entry);

  const run = async () => {
    let restartCount = 0;

    while (!stopping) {
      const child = spawn(command, args, {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        cwd: PROJECT_ROOT,
        env: { ...process.env },
      });

      entry.pid = child.pid;
      entry.child = child;

      const startTime = Date.now();
      logEvent('INFO', name, `Process started (PGID: ${child.pid}): ${command} ${args.join(' ')}`);

      // Pipe stdout and stderr through readline for timestamped logging
      const pipeLines = (stream) => {
        const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
        rl.on('line', (line) => {
          const msg = `[${timestamp()}] [${name}] ${line}\n`;
          try { fs.writeSync(logFd, msg); } catch {}
          writeOutput(msg);
        });
      };
      if (child.stdout) pipeLines(child.stdout);
      if (child.stderr) pipeLines(child.stderr);

      // Wait for the direct child to exit.
      // NOTE: must use 'exit', not 'close'. With shell:true, grandchild processes
      // (e.g. nest's server) inherit stdout pipes. 'close' won't fire until ALL
      // pipe holders exit, causing dev.js to hang when npm/nest dies but server survives.
      const exitCode = await new Promise((resolve) => {
        child.on('exit', (code) => resolve(code ?? 1));
        child.on('error', () => resolve(1));
      });

      // Kill the entire process group
      if (entry.pid) {
        killProcessGroup(entry.pid, 'SIGTERM');
        await sleep(2000);
        killProcessGroup(entry.pid, 'SIGKILL');
      }
      entry.pid = null;
      entry.child = null;

      // Port cleanup fallback
      if (cleanupPort) {
        const orphans = killOrphansByPort(cleanupPort);
        if (orphans.length > 0) {
          logEvent('WARN', name, `Killed orphan processes on port ${cleanupPort}: ${orphans.join(' ')}`);
          await sleep(500);
        }
      }

      if (stopping) break;

      const runDuration = (Date.now() - startTime) / 1000;
      if (runDuration >= 60) {
        restartCount = 0;
        logEvent('INFO', name, `Ran for ${Math.round(runDuration)}s, resetting restart counter`);
      } else {
        restartCount++;
      }
      if (restartCount >= MAX_RESTART_COUNT) {
        logEvent('ERROR', name, `Max restart count (${MAX_RESTART_COUNT}) reached, giving up`);
        break;
      }

      const delay = Math.min(RESTART_DELAY * (1 << Math.max(0, restartCount - 1)), MAX_DELAY);
      logEvent('WARN', name, `Process exited with code ${exitCode}, restarting (${restartCount}/${MAX_RESTART_COUNT}) in ${delay}s...`);
      await sleep(delay * 1000);
    }

    try { fs.closeSync(logFd); } catch {}
  };

  return run();
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
let cleanupDone = false;

async function cleanup() {
  if (cleanupDone) return;
  cleanupDone = true;
  stopping = true;

  logEvent('INFO', 'main', 'Shutting down all processes...');

  // Kill all managed process groups
  for (const entry of managedProcesses) {
    if (entry.pid) {
      logEvent('INFO', 'main', `Stopping process group (PGID: ${entry.pid})`);
      killProcessGroup(entry.pid, 'SIGTERM');
    }
  }

  // Wait for graceful shutdown
  await sleep(2000);

  // Force kill any remaining
  for (const entry of managedProcesses) {
    if (entry.pid) {
      logEvent('WARN', 'main', `Force killing process group (PGID: ${entry.pid})`);
      killProcessGroup(entry.pid, 'SIGKILL');
    }
  }

  // Port cleanup fallback
  killOrphansByPort(SERVER_PORT);
  killOrphansByPort(CLIENT_DEV_PORT);

  logEvent('INFO', 'main', 'All processes stopped');

  try { fs.closeSync(devStdLogFd); } catch {}
  try { fs.closeSync(devLogFd); } catch {}

  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGHUP', cleanup);

// Stale dist makes nest --watch skip missing files; watcher won't self-heal.
function cleanStaleDist() {
  if (process.env.SANDBOX_ID) {
    logEvent('INFO', 'main', 'Sandbox mode: skip dist cleanup for faster cold start');
    return;
  }
  const distPath = path.join(PROJECT_ROOT, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    logEvent('INFO', 'main', 'Cleaned dist/ to force full rebuild');
  }
}

function ensureActionPlugins() {
  if (fs.existsSync(path.join(PROJECT_ROOT, 'server', 'capabilities'))
    && fs.readdirSync(path.join(PROJECT_ROOT, 'server', 'capabilities')).some((f) => f.endsWith('.json'))) {
    writeOutput('✅ Action plugins already present, skip init\n\n');
    return;
  }
  writeOutput('\n🔌 Initializing action plugins...\n');
  try {
    execSync('node scripts/ensure-action-plugins.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
    });
    writeOutput('✅ Action plugins initialized\n\n');
  } catch {
    writeOutput('⚠️  Action plugin initialization failed, continuing anyway...\n\n');
  }
}

function ensureNativeDeps() {
  writeOutput('[native-deps] 检查原生依赖...\n');
  try {
    execSync('node scripts/ensure-native-deps.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
      timeout: 180000,
    });
  } catch {
    writeOutput('⚠️  Native deps install failed, continuing anyway...\n\n');
  }
}

function logGitRevision() {
  try {
    const commit = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 5000,
    }).trim();
    logEvent('INFO', 'main', `Git commit: ${commit}`);
  } catch {}
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  logEvent('INFO', 'main', '========== Dev session started ==========');
  logGitRevision();

  cleanStaleDist();

  await ensurePortFree(SERVER_PORT, 'server');
  await ensurePortFree(CLIENT_DEV_PORT, 'client');

  ensureActionPlugins();
  if (process.env.SANDBOX_ID) {
    ensureNativeDeps();
  }

  logEvent('INFO', 'main', `Listening client=${CLIENT_DEV_PORT} server=${SERVER_PORT} base=${process.env.CLIENT_BASE_PATH || '/'}`);

  // Vite 先起：沙箱 nginx 健康检查反代 client 端口
  const clientPromise = startProcess({
    name: 'client',
    command: 'npm',
    args: ['run', 'dev:client'],
    cleanupPort: CLIENT_DEV_PORT,
  });

  const serverPromise = startProcess({
    name: 'server',
    command: 'npm',
    args: ['run', 'dev:server'],
    cleanupPort: SERVER_PORT,
  });

  writeOutput(`📋 Dev processes running. Press Ctrl+C to stop.\n`);
  writeOutput(`📄 Logs: ${devStdLogPath}\n\n`);

  // Wait for both (they loop until stopping or max restarts)
  await Promise.all([serverPromise, clientPromise]);

  if (!cleanupDone) {
    await cleanup();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
