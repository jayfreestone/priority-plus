import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    dom: "src/dom.ts",
    index: "src/index.ts",
  },
  format: "esm",
  minify: true,
  platform: "neutral",
  target: "esnext",
  sourcemap: true,
  dts: true,
});
