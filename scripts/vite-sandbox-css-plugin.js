'use strict';

const path = require('path');
const pathSep = path.sep;

/** 沙箱用预编译 CSS，避免 Vite dev 内跑 Tailwind/PostCSS 触发 OOM */
function sandboxCssPlugin() {
  if (!process.env.SANDBOX_ID || process.env.SANDBOX_USE_PRECOMPILED_CSS !== '1') {
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
          .replace("import './index.css'", "import './.sandbox-compiled.css'")
          .replace('import "./index.css"', "import './.sandbox-compiled.css'"),
        map: null,
      };
    },
  };
}

module.exports = { sandboxCssPlugin };
