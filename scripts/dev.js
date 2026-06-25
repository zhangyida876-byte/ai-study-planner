#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// ── Project root ──────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
process.chdir(PROJECT_ROOT);

require('./sandbox-env').bootstrap(PROJECT_ROOT);

// ── Load .env (sandbox-env 已加载 .env.local + .env) ─────────────────────────
function loadEnv() {}
loadEnv();

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
  if (!process.env.SANDBOX_ID) {
    // fuser -k 在沙箱里过于激进，易误杀刚启动的 Vite（exit 137）
    try {
      execSync(`fuser -k ${port}/tcp`, { timeout: 5000, stdio: 'ignore' });
    } catch {}
  }
  return [...killed];
}

function isPortInUse(port) {
  try {
    execSync(`lsof -ti :${port}`, { encoding: 'utf8', timeout: 3000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function ensurePortFree(port, label) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (!isPortInUse(port)) return;
    const orphans = killOrphansByPort(port);
    if (orphans.length > 0) {
      logEvent('WARN', label, `Freed port ${port}, killed: ${orphans.join(' ')}`);
    }
    await sleep(500 * attempt);
  }
  if (isPortInUse(port)) {
    logEvent('ERROR', label, `Port ${port} still in use after cleanup attempts`);
  }
}

// ── Process supervision ───────────────────────────────────────────────────────
let stopping = false;
const managedProcesses = []; // { name, pid, child }

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 沙箱 health check：等 Vite /dev/health ready 后再启 Nest，避免 OOM 杀 Vite(137) */
async function waitForClientHealth(port) {
  const http = require('http');
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline && !stopping) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/dev/health`, (res) => {
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => {
            try {
              if (JSON.parse(body).ready) resolve();
              else reject(new Error('not ready'));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(3000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      logEvent('INFO', 'main', `Client health OK on port ${port}`);
      return;
    } catch {
      await sleep(1000);
    }
  }
  logEvent('WARN', 'main', 'Client health wait timed out, starting server anyway');
}

function getMaxRestartCount() {
  if (process.env.SANDBOX_ID) return 30;
  return MAX_RESTART_COUNT;
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
      const skipPortClean = process.env.SANDBOX_ID && name === 'client' && restartCount > 0;
      if (cleanupPort && !skipPortClean) {
        await ensurePortFree(cleanupPort, name);
      }

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

      // Port cleanup fallback after crash (137=OOM/SIGKILL，沙箱跳过以免误杀)
      if (cleanupPort && !(process.env.SANDBOX_ID && exitCode === 137)) {
        await ensurePortFree(cleanupPort, name);
      }

      if (stopping) break;

      const runDuration = (Date.now() - startTime) / 1000;
      if (runDuration >= 60) {
        restartCount = 0;
        logEvent('INFO', name, `Ran for ${Math.round(runDuration)}s, resetting restart counter`);
      } else {
        restartCount++;
      }
      const maxRestarts = getMaxRestartCount();
      if (restartCount >= maxRestarts) {
        logEvent('ERROR', name, `Max restart count (${maxRestarts}) reached, giving up`);
        break;
      }

      const delay = Math.min(RESTART_DELAY * (1 << Math.max(0, restartCount - 1)), MAX_DELAY);
      if (exitCode === 137 && process.env.SANDBOX_ID) {
        logEvent('WARN', name, `Killed (137, likely OOM), restart ${restartCount}/${maxRestarts} in ${delay}s...`);
      } else {
        logEvent('WARN', name, `Process exited with code ${exitCode}, restarting (${restartCount}/${maxRestarts}) in ${delay}s...`);
      }
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
    logEvent('INFO', 'main', 'Sandbox: skip dist cleanup');
    return;
  }
  const distPath = path.join(PROJECT_ROOT, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    logEvent('INFO', 'main', 'Cleaned dist/ to force full rebuild');
  }
}

/** Remove stray compiled *.js under client/src that shadow matching TSX sources. */
function cleanStaleClientJs() {
  const srcRoot = path.join(PROJECT_ROOT, 'client', 'src');
  if (!fs.existsSync(srcRoot)) return;

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
        removed.push(path.relative(PROJECT_ROOT, fullPath));
      }
    }
  };

  walk(srcRoot);
  if (removed.length > 0) {
    logEvent('INFO', 'main', `Removed stale client JS emit: ${removed.join(', ')}`);
  }
}

function ensureActionPlugins() {
  const capDir = path.join(PROJECT_ROOT, 'server', 'capabilities');
  if (fs.existsSync(capDir) && fs.readdirSync(capDir).some((f) => f.endsWith('.json'))) {
    writeOutput('✅ Action plugins present, skip init\n\n');
    return;
  }
  writeOutput('\n🔌 Initializing action plugins...\n');
  try {
    execSync('node scripts/ensure-action-plugins.js', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env, CI: '1' },
      timeout: 60000,
    });
  } catch {
    writeOutput('⚠️  Action plugin init failed, continuing\n\n');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  logEvent('INFO', 'main', '========== Dev session started ==========');

  cleanStaleDist();
  cleanStaleClientJs();

  ensureActionPlugins();

  if (process.env.SANDBOX_ID) {
    try {
      execSync('node scripts/ensure-native-deps.js', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        env: { ...process.env, CI: '1' },
        timeout: 90000,
      });
    } catch {
      writeOutput('⚠️  Native deps check failed, continuing\n\n');
    }
  }

  await ensurePortFree(SERVER_PORT, 'main');
  await ensurePortFree(CLIENT_DEV_PORT, 'main');

  // Client 先启动；沙箱等 /dev/health ready 后再启 Nest（防 OOM 杀 Vite）
  const clientPromise = startProcess({
    name: 'client',
    command: 'npm',
    args: ['run', 'dev:client'],
    cleanupPort: CLIENT_DEV_PORT,
  });

  const serverPromise = process.env.SANDBOX_ID
    ? (async () => {
        await waitForClientHealth(CLIENT_DEV_PORT);
        await sleep(3000);
        return startProcess({
          name: 'server',
          command: 'npm',
          args: ['run', 'dev:server'],
          cleanupPort: SERVER_PORT,
        })();
      })()
    : startProcess({
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
