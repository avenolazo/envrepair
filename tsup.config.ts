import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  shims: true,
  clean: true,
  dts: true,
  sourcemap: false,
  minify: true,
  splitting: false,
  noExternal: ["@inquirer/prompts", "commander", "cross-spawn", "picocolors"],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);`,
  },
})
