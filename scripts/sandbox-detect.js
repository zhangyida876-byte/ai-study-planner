'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** 妙搭沙箱：优先 SANDBOX_ID，兜底 /home/gem/workspace（用户日志中的路径） */
function isSandboxRuntime(root) {
  if (process.env.SANDBOX_ID) return true;
  if (process.env.MIAODA_SANDBOX === '1') return true;
  const dir = root || process.cwd();
  return /\/home\/gem\/workspace\b/.test(dir);
}

function ensureSandboxFlags(root) {
  if (!isSandboxRuntime(root)) return false;
  if (!process.env.SANDBOX_ID) {
    process.env.SANDBOX_ID = 'miaoda-workspace';
  }
  process.env.MIAODA_SANDBOX = '1';
  return true;
}

function logSandboxBoot(root) {
  if (!isSandboxRuntime(root)) return;
  let rev = 'unknown';
  try {
    rev = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {}
  const styles = path.join(root, 'client/src/sandbox-styles.css');
  const hasStyles = fs.existsSync(styles);
  console.log(
    '[sandbox-boot] code=%s prebuilt-css=%s port=%s',
    rev,
    hasStyles ? 'yes' : 'no',
    process.env.CLIENT_DEV_PORT || '8080',
  );
}

module.exports = { isSandboxRuntime, ensureSandboxFlags, logSandboxBoot };
