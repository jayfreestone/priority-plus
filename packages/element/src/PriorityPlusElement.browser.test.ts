import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import {
  PriorityPlusElement,
  PriorityPlusOverflowCountChangeEvent,
} from "./index";

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
          More<span data-test-overflow-count></span>
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
  renderOverflowCount();
}

test("emits subclassed overflow count change events", async () => {
  installPriorityPlusBrowserStyles();
  await page.viewport(260, 400);
  document.body.innerHTML = "";

  const priorityPlus = document.createElement("priority-plus");

  if (!(priorityPlus instanceof PriorityPlusElement)) {
    throw new Error("priority-plus element was not defined");
  }

  priorityPlus.innerHTML = `
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
        More<span data-test-overflow-count></span>
      </button>
      <ul
        hidden
        class="test-overflow"
        data-priority-plus-overflow
        id="test-overflow"
      ></ul>
    </nav>
  `;

  const events: PriorityPlusOverflowCountChangeEvent[] = [];
  priorityPlus.addEventListener(
    PriorityPlusOverflowCountChangeEvent.eventName,
    (event) => {
      if (event instanceof PriorityPlusOverflowCountChangeEvent) {
        events.push(event);
      }
    },
  );

  document.body.append(priorityPlus);

  await expect.poll(() => events.map((event) => event.overflowCount)).toEqual([
    3,
  ]);
  expect(events[0]?.previousOverflowCount).toBe(0);
  expect(events[0]?.previousState.overflowCount).toBe(0);
  expect(events[0]?.state.overflowCount).toBe(3);
  expect(priorityPlus.overflowCount).toBe(3);
  expect(priorityPlus.state.overflowCount).toBe(3);

  await page.viewport(360, 400);

  await expect.poll(() => events.map((event) => event.overflowCount)).toEqual([
    3, 2,
  ]);
  expect(events[1]?.previousOverflowCount).toBe(3);
  expect(events[1]?.previousState.overflowCount).toBe(3);
  expect(events[1]?.state.overflowCount).toBe(2);
  expect(priorityPlus.overflowCount).toBe(2);
});

test("waits for light DOM parts before enhancing", async () => {
  installPriorityPlusBrowserStyles();
  await page.viewport(260, 400);
  document.body.innerHTML = "<priority-plus></priority-plus>";
  await customElements.whenDefined("priority-plus");

  const priorityPlus = document.querySelector("priority-plus");
  if (!(priorityPlus instanceof PriorityPlusElement)) {
    throw new Error("priority-plus element was not defined");
  }

  expect(priorityPlus.itemCount).toBe(0);

  priorityPlus.innerHTML = `
    <nav class="test-nav" aria-label="Main">
      <ul class="test-list" data-priority-plus-primary>
        ${priorityPlusBrowserItems
          .map(
            (item) =>
              `<li><a class="test-link" href="${item.href}">${item.label}</a></li>`,
          )
          .join("")}
      </ul>
      <ul
        hidden
        class="test-overflow"
        data-priority-plus-overflow
        id="test-overflow"
      ></ul>
    </nav>
  `;
  await nextFrame();
  expect(priorityPlus.itemCount).toBe(0);

  const overflow = priorityPlus.querySelector("[data-priority-plus-overflow]");
  if (!(overflow instanceof HTMLElement)) {
    throw new Error("overflow element was not found");
  }

  const toggle = document.createElement("button");
  toggle.hidden = true;
  toggle.className = "test-toggle";
  toggle.dataset.priorityPlusToggle = "";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "More<span data-test-overflow-count></span>";
  overflow.before(toggle);

  renderOverflowCount();

  await expect.poll(getPrimaryLabels).toEqual(["Dashboard"]);
  await expect
    .element(page.getByRole("button", { name: "More (3)" }))
    .toBeVisible();
  expect(priorityPlus.itemCount).toBe(4);
});

test("refreshes its item cache when light DOM items change", async () => {
  installPriorityPlusBrowserStyles();
  await page.viewport(360, 400);
  await mountPriorityPlus();

  await expect
    .element(page.getByRole("button", { name: "More (2)" }))
    .toBeVisible();
  await expect.poll(getPrimaryLabels).toEqual(["Dashboard", "Projects"]);

  const primary = document.querySelector("[data-priority-plus-primary]");
  if (!(primary instanceof HTMLElement)) {
    throw new Error("primary element was not found");
  }

  const billing = document.createElement("li");
  billing.innerHTML = `<a class="test-link" href="#billing">Billing</a>`;
  primary.append(billing);

  await expect
    .element(page.getByRole("button", { name: "More (3)" }))
    .toBeVisible();
  await expect.poll(getPrimaryLabels).toEqual(["Dashboard", "Projects"]);

  billing.remove();

  await expect
    .element(page.getByRole("button", { name: "More (2)" }))
    .toBeVisible();
  await expect.poll(getPrimaryLabels).toEqual(["Dashboard", "Projects"]);
});

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

function renderOverflowCount(): void {
  const priorityPlus = document.querySelector("priority-plus");
  const count = document.querySelector("[data-test-overflow-count]");

  if (
    !(priorityPlus instanceof PriorityPlusElement) ||
    !(count instanceof HTMLElement)
  ) {
    return;
  }

  const render = (overflowCount = priorityPlus.overflowCount) => {
    count.textContent = overflowCount > 0 ? ` (${overflowCount})` : "";
  };

  priorityPlus.addEventListener(
    PriorityPlusOverflowCountChangeEvent.eventName,
    (event) => {
      if (event instanceof PriorityPlusOverflowCountChangeEvent) {
        render(event.overflowCount);
      }
    },
  );
  render();
}

function getPrimaryLabels(): string[] {
  const primary = document.querySelector(".test-nav > .test-list");
  if (primary === null) return [];

  return Array.from(primary.querySelectorAll("a"), (anchor) =>
    anchor.textContent?.trim(),
  ).filter((label): label is string => label !== undefined && label.length > 0);
}
