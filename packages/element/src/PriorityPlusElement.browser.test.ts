import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "./index";

testPriorityPlusBrowserBehavior(mountPriorityPlus);

test("uses cached measurements during viewport-only resizes", async () => {
  await page.viewport(260, 400);
  await mountPriorityPlus({ measurePerformance: true });
  await settleLayout();

  performance.clearMeasures("priority-plus:layout");
  performance.clearMeasures("priority-plus:measure");

  const originalGetBoundingClientRect =
    HTMLElement.prototype.getBoundingClientRect;
  let componentRectReads = 0;

  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(
    this: HTMLElement,
  ) {
    if (this.closest("priority-plus") !== null) {
      componentRectReads += 1;
    }

    return originalGetBoundingClientRect.call(this);
  };

  try {
    await page.viewport(360, 400);
    await expect.poll(getPrimaryLabels).toEqual(["Dashboard", "Projects"]);

    await page.viewport(520, 400);
    await expect.poll(getPrimaryLabels).toEqual(
      priorityPlusBrowserItems.map((item) => item.label),
    );
  } finally {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  }

  expect(componentRectReads).toBe(0);
  expect(performance.getEntriesByName("priority-plus:measure")).toHaveLength(0);
  expect(
    performance.getEntriesByName("priority-plus:layout").length,
  ).toBeGreaterThanOrEqual(2);
});

async function mountPriorityPlus({
  measurePerformance = false,
}: { measurePerformance?: boolean } = {}): Promise<void> {
  installPriorityPlusBrowserStyles();

  document.body.innerHTML = `
    <priority-plus ${measurePerformance ? "data-priority-plus-performance" : ""}>
      <nav class="test-nav" aria-label="Main">
        <ul class="test-list" data-priority-plus-primary>
          ${priorityPlusBrowserItems
            .map(
              (item) =>
                `<li><a class="test-link" href="${item.href}">${item.label}</a></li>`,
            )
            .join("")}
        </ul>
        <button
          hidden
          class="test-toggle"
          data-priority-plus-toggle
          type="button"
          aria-expanded="false"
        >
          More
        </button>
        <ul
          hidden
          class="test-overflow"
          data-priority-plus-overflow
          id="test-overflow"
        ></ul>
      </nav>
    </priority-plus>
  `;

  await customElements.whenDefined("priority-plus");
}

async function settleLayout(): Promise<void> {
  await document.fonts?.ready;
  await nextFrame();
  await nextFrame();
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function getPrimaryLabels(): string[] {
  const primary = document.querySelector(".test-nav > .test-list");
  if (primary === null) return [];

  return Array.from(primary.querySelectorAll("a"), (anchor) =>
    anchor.textContent?.trim(),
  ).filter((label): label is string => label !== undefined && label.length > 0);
}
