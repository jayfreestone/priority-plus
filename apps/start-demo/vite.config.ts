import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // The nitro plugin produces a runnable node server (.output/server) that
  // also serves the static client assets.
  plugins: [tanstackStart(), nitroV2Plugin(), viteReact()],
});
