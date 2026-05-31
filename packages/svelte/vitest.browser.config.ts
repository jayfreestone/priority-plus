import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

import { createPriorityPlusBrowserTestConfig } from "../../test/vitest-browser-config";

export default defineConfig({
  plugins: [svelte()],
  esbuild: {
    tsconfigRaw: {},
  },
  test: createPriorityPlusBrowserTestConfig(["tests/**/*.browser.test.ts"]),
});
