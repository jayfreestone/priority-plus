import { defineConfig } from "tsdown";

export default defineConfig({
  clean: false,
  entry: {
    "internal/runtime": "src/internal/runtime.ts",
  },
  format: "esm",
  minify: true,
  noExternal: [/^@priority-plus\/core(?:\/dom)?$/],
  platform: "browser",
  target: "esnext",
  sourcemap: true,
  dts: {
    resolve: [/^@priority-plus\/core(?:\/dom)?$/],
  },
});
