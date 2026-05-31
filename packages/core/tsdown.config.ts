import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    dom: "src/dom.ts",
    index: "src/index.ts",
  },
  format: "esm",
  platform: "neutral",
  target: "esnext",
  sourcemap: true,
  dts: true,
});
