import { defineConfig } from "vitest/config";

import { createPriorityPlusBrowserTestConfig } from "../../test/vitest-browser-config";

export default defineConfig({
  test: createPriorityPlusBrowserTestConfig(["src/**/*.browser.test.ts"]),
});
