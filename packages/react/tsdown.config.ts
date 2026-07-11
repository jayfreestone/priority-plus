import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  // The whole package is client-side (hooks, refs, ResizeObserver); the
  // directive lets RSC consumers import it without wrapping it themselves.
  banner: { js: '"use client";' },
  external: ["react", "react-dom"],
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
