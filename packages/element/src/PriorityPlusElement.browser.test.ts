import {
  getLinkLabels,
  getPrimaryLabels,
  priorityPlusBrowserItems,
  priorityPlusBrowserTest,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import { expect } from "vitest";
import { page } from "vitest/browser";

import {
  definePriorityPlusElement,
  PriorityPlusElement,
  PriorityPlusOverflowCountChangeEvent,
} from "./index";

const elementPriorityPlusTest = priorityPlusBrowserTest.override(
  "mountPriorityPlus",
  async () => mountPriorityPlus,
);

testPriorityPlusBrowserBehavior(elementPriorityPlusTest);

elementPriorityPlusTest("uses cached measurements during viewport-only resizes", async () => {
  await page.viewport(260, 400);
  await mountPriorityPlus();
  await settleLayout();

  const originalGetBoundingClientRect =
    HTMLElement.prototype.getBoundingClientRect;
  let measurementRectReads = 0;

  // The container's own inline size is legitimately re-read on every resize;
  // the cached-measurement invariant covers everything inside it.
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(
    this: HTMLElement,
  ) {
    if (this.closest("priority-plus") !== null && !this.matches(".test-nav")) {
      measurementRectReads += 1;
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

  // Viewport-only resizes must reuse cached item widths: no item or toggle
  // inside the component should be re-measured.
  expect(measurementRectReads).toBe(0);
});

async function mountPriorityPlus(): Promise<void> {
  document.body.innerHTML = `
    <priority-plus>
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

elementPriorityPlusTest("emits subclassed overflow count change events", async () => {
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

elementPriorityPlusTest("waits for light DOM parts before enhancing", async () => {
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

elementPriorityPlusTest("refreshes its item cache when light DOM items change", async () => {
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

elementPriorityPlusTest("preserves source order in overflow across promote/demote cycles", async () => {
  await page.viewport(260, 400);
  await mountPriorityPlus();

  await expect.poll(getPrimaryLabels).toEqual(["Dashboard"]);

  // Promote "Projects" into primary, then demote it again: the plan executor
  // must put it back at the *front* of the overflow list, not append it.
  await page.viewport(360, 400);
  await expect.poll(getPrimaryLabels).toEqual(["Dashboard", "Projects"]);

  await page.viewport(260, 400);
  await expect.poll(getPrimaryLabels).toEqual(["Dashboard"]);

  expect(
    getLinkLabels(document.querySelector(".test-nav > .test-overflow")),
  ).toEqual(["Projects", "Roadmap", "Integrations"]);
});

elementPriorityPlusTest("registers custom names alongside the default", async () => {
  // The module registers <priority-plus> on import; a second name must get its
  // own subclass rather than re-registering the same constructor (which throws).
  const first = definePriorityPlusElement("test-priority-plus-alias");
  const second = definePriorityPlusElement("test-priority-plus-alias");

  expect(second).toBe(first);
  expect(document.createElement("test-priority-plus-alias")).toBeInstanceOf(
    PriorityPlusElement,
  );
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
