#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');

// 沙箱 / CI 不配置 git hooks，避免无写权限导致 npm install 失败
if (process.env.SANDBOX_ID || process.env.CI) {
  process.exit(0);
}

try {
  execSync('chmod +x .githooks/pre-commit 2>/dev/null; git config core.hooksPath .githooks 2>/dev/null || true', {
    stdio: 'ignore',
    shell: true,
  });
} catch {
  // ignore
}
