import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { createPriorityPlusBrowserTestConfig } from "../../test/vitest-browser-config";

export default defineConfig({
  plugins: [react()],
  test: createPriorityPlusBrowserTestConfig(["src/**/*.browser.test.tsx"]),
});
