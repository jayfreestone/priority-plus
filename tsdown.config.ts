import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "priority-plus": "src/priorityPlus.ts",
  },
  format: "esm",
  platform: "browser",
  target: "esnext",
  sourcemap: true,
  dts: true,
});
