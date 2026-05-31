import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  external: ["react", "react-dom"],
  format: "esm",
  platform: "browser",
  target: "esnext",
  sourcemap: true,
  dts: true,
});
