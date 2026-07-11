import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      dom: "src/dom.ts",
      index: "src/index.ts",
      prelayout: "src/prelayout.ts",
    },
    format: "esm",
    minify: true,
    platform: "neutral",
    target: "esnext",
    sourcemap: true,
    dts: true,
  },
  // The prelayout global as a classic render-blocking script, for inlining
  // after server-rendered markup. No sourcemap: the trailing
  // `//# sourceMappingURL` line comment would swallow anything appended on
  // the same line when the file is interpolated into an inline script, and
  // the relative .map reference is meaningless once inlined anyway.
  {
    entry: { prelayout: "src/prelayout.iife.ts" },
    format: "iife",
    minify: true,
    platform: "browser",
    target: "es2020",
    sourcemap: false,
    dts: false,
  },
]);
