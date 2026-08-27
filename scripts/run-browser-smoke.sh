#!/bin/sh
# Run Playwright from an ephemeral npx package without adding package
# metadata to this pure-CSS repository. CommonJS resolution sees NODE_PATH;
# createRequire() in the ESM config and tests uses that same resolver.
set -eu

playwright_bin="$(command -v playwright)"
playwright_root="$(node -e 'const fs = require("fs"); const path = require("path"); console.log(path.dirname(fs.realpathSync(process.argv[1])))' "$playwright_bin")"
NODE_PATH="$(dirname "$playwright_root")" node "$playwright_root/cli.js" test "$@"
