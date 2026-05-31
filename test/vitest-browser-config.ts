import { playwright } from "@vitest/browser-playwright";
import type { TestUserConfig } from "vitest/config";

export function createPriorityPlusBrowserTestConfig(
  include: string[],
): TestUserConfig {
  return {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    include,
  };
}
