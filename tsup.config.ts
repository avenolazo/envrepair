import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: false,
  sourcemap: false,
  minify: true,
  splitting: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
})
