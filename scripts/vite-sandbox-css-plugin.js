'use strict';

const path = require('path');
const fs = require('fs');
const { isSandboxRuntime } = require('./sandbox-detect');

const pathSep = path.sep;
const SANDBOX_STYLES = 'sandbox-styles.css';

function shouldUsePrebuiltCss(root) {
  if (!isSandboxRuntime(root)) return false;
  if (process.env.SANDBOX_USE_PRECOMPILED_CSS === '0') return false;
  return fs.existsSync(path.join(root, 'client/src', SANDBOX_STYLES));
}

/** 沙箱用仓库内预编译 CSS，Vite 内不再跑 Tailwind/PostCSS */
function sandboxCssPlugin() {
  const root = process.cwd();
  if (!shouldUsePrebuiltCss(root)) {
    return { name: 'sandbox-css-noop' };
  }

  return {
    name: 'sandbox-css',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes(`${pathSep}client${pathSep}src${pathSep}index.tsx`)) return null;
      if (!code.includes("import './index.css'") && !code.includes('import "./index.css"')) return null;
      return {
        code: code
          .replace("import './index.css'", `import './${SANDBOX_STYLES}'`)
          .replace('import "./index.css"', `import './${SANDBOX_STYLES}'`),
        map: null,
      };
    },
  };
}

module.exports = { sandboxCssPlugin, shouldUsePrebuiltCss };
