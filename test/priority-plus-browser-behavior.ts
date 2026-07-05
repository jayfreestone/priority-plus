import { expect, test as baseTest } from "vitest";
import { page, userEvent } from "vitest/browser";

export interface PriorityPlusBrowserItem {
  href: string;
  label: string;
}

type PriorityPlusBrowserCleanup = () => Promise<void> | void;

export type MountPriorityPlus = () =>
  | PriorityPlusBrowserCleanup
  | Promise<PriorityPlusBrowserCleanup | void>
  | void;

type MountAtWidth = (width: number) => Promise<void>;
type ExpectPriorityPlusLayout = (layout: ExpectedLayout) => Promise<void>;

interface ExpectedLayout {
  buttonName: string | null;
  primaryLabels: string[];
  visibleOverflowLabels?: string[];
}

export const priorityPlusBrowserItems: readonly PriorityPlusBrowserItem[] = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#projects", label: "Projects" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#integrations", label: "Integrations" },
];

export const priorityPlusBrowserStyles = `
  body {
    margin: 0;
  }

  .test-nav {
    display: flex;
    gap: 8px;
    position: relative;
    width: 100vw;
  }

  .test-list {
    display: flex;
    flex: 0 1 auto;
    gap: 8px;
    list-style: none;
    margin: 0;
    min-width: 0;
    padding: 0;
  }

  .test-item,
  .test-list > li {
    flex: 0 0 auto;
    width: 96px;
  }

  .test-link,
  .test-list a {
    display: block;
    width: 96px;
  }

  .test-toggle {
    flex: 0 0 auto;
    width: 72px;
  }

  .test-overflow {
    display: flex;
  }

  .test-overflow:not(:popover-open)[popover] {
    display: none;
  }
`;

const itemLabels = priorityPlusBrowserItems.map((item) => item.label);
const overflowLabels = itemLabels.slice(1);

export const priorityPlusBrowserTest = baseTest
  .extend<"priorityPlusBrowserDocument", void>(
    "priorityPlusBrowserDocument",
    { auto: true },
    async ({}) => {
      installPriorityPlusBrowserStyles();
    },
  )
  .extend<"mountPriorityPlus", MountPriorityPlus>(
    "mountPriorityPlus",
    async () => {
      return () => {
        throw new Error(
          "mountPriorityPlus must be provided by the implementation test",
        );
      };
    },
  )
  .extend<"mountAtWidth", MountAtWidth>(
    "mountAtWidth",
    async ({ mountPriorityPlus }, { onCleanup }) => {
      let cleanupMount: PriorityPlusBrowserCleanup | undefined;

      const cleanupCurrentMount = async () => {
        const cleanup = cleanupMount;
        cleanupMount = undefined;

        await cleanup?.();
      };

      onCleanup(cleanupCurrentMount);

      return async (width) => {
        await page.viewport(width, 400);
        await cleanupCurrentMount();
        document.body.replaceChildren();

        const cleanup = await mountPriorityPlus();

        if (typeof cleanup === "function") {
          cleanupMount = cleanup;
        }
      };
    },
  )
  .extend<"expectPriorityPlusLayout", ExpectPriorityPlusLayout>(
    "expectPriorityPlusLayout",
    async () => expectLayout,
  );

export function installPriorityPlusBrowserStyles(): void {
  if (document.querySelector("style[data-priority-plus-browser-fixture]")) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-priority-plus-browser-fixture", "");
  style.textContent = priorityPlusBrowserStyles;
  document.head.append(style);
}

export function testPriorityPlusBrowserBehavior(
  test: typeof priorityPlusBrowserTest,
): void {
  test(
    "renders accessible primary and overflow navigation",
    async ({ expectPriorityPlusLayout, mountAtWidth }) => {
      await mountAtWidth(260);

      const moreButton = page.getByRole("button", { name: "More (3)" });

      await expect
        .element(page.getByRole("navigation", { name: "Main" }))
        .toBeVisible();
      await expect.element(moreButton).toHaveAccessibleName("More (3)");
      await expect
        .element(moreButton)
        .toHaveAttribute("aria-expanded", "false");
      await expect
        .element(page.getByRole("link", { name: "Dashboard" }))
        .toBeVisible();
      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
      });

      moreButton.element().focus();
      await expect.element(moreButton).toHaveFocus();
      await userEvent.keyboard("{Enter}");

      await expect.element(moreButton).toHaveAttribute("aria-expanded", "true");
      await expect
        .element(page.getByRole("link", { name: "Integrations" }))
        .toBeVisible();
      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
        visibleOverflowLabels: overflowLabels,
      });

      await userEvent.keyboard("{Enter}");

      await expect
        .element(moreButton)
        .toHaveAttribute("aria-expanded", "false");
      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
      });
    },
  );

  test(
    "moves items into and out of overflow as the viewport resizes",
    async ({ expectPriorityPlusLayout, mountAtWidth }) => {
      await mountAtWidth(260);

      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
      });

      await page.viewport(360, 400);

      await expectPriorityPlusLayout({
        buttonName: "More (2)",
        primaryLabels: ["Dashboard", "Projects"],
      });

      await page.viewport(520, 400);

      await expectPriorityPlusLayout({
        buttonName: null,
        primaryLabels: itemLabels,
      });

      await page.viewport(360, 400);

      await expectPriorityPlusLayout({
        buttonName: "More (2)",
        primaryLabels: ["Dashboard", "Projects"],
      });

      await page.viewport(260, 400);

      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
      });
    },
  );

  test(
    "reserves room for the toggle and never overflows the container",
    async ({ mountAtWidth }) => {
      await mountAtWidth(520);

      // 315px is the discriminating width: three 96px items plus gaps fit on
      // their own (304px), but not alongside the toggle's 80px — a layout that
      // measured the toggle too narrow would show three items and overflow.
      const expectedLayouts: Array<[number, string[]]> = [
        [520, itemLabels],
        [430, itemLabels], // 408px of items fit without any toggle
        [360, ["Dashboard", "Projects"]],
        [315, ["Dashboard", "Projects"]],
        [260, ["Dashboard"]],
        [200, ["Dashboard"]],
      ];

      for (const [width, primaryLabels] of expectedLayouts) {
        await page.viewport(width, 400);
        await expect.poll(getPrimaryLabels).toEqual(primaryLabels);
        await expect.poll(fitsWithinContainer).toBe(true);
      }
    },
  );

  test(
    "marks the container enhanced once a measured layout applies",
    async ({ mountAtWidth }) => {
      await mountAtWidth(260);

      // The attribute a render-blocking prelayout pass keys its interim
      // styles off: it must appear with the first measured layout.
      await expect
        .poll(() => document.querySelector("[data-priority-plus-enhanced]"))
        .not.toBeNull();
    },
  );

  test(
    "closes an open overflow when resizing makes every item fit",
    async ({ expectPriorityPlusLayout, mountAtWidth }) => {
      await mountAtWidth(260);

      const moreButton = page.getByRole("button", { name: "More (3)" });
      await moreButton.click();

      await expect.element(moreButton).toHaveAttribute("aria-expanded", "true");
      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
        visibleOverflowLabels: overflowLabels,
      });

      await page.viewport(520, 400);

      await expectPriorityPlusLayout({
        buttonName: null,
        primaryLabels: itemLabels,
      });
      await expect.poll(getToggleExpanded).toBe("false");

      await page.viewport(260, 400);

      await expectPriorityPlusLayout({
        buttonName: "More (3)",
        primaryLabels: ["Dashboard"],
      });
      await expect
        .element(page.getByRole("button", { name: "More (3)" }))
        .toHaveAttribute("aria-expanded", "false");
    },
  );
}

async function expectLayout({
  buttonName,
  primaryLabels,
  visibleOverflowLabels = [],
}: ExpectedLayout): Promise<void> {
  await expect.poll(getPrimaryLabels).toEqual(primaryLabels);
  await expect.poll(getVisibleOverflowLabels).toEqual(visibleOverflowLabels);
  await expect.poll(getVisibleNavLabels).toEqual([
    ...primaryLabels,
    ...visibleOverflowLabels,
  ]);
  await expect.poll(getVisibleToggleName).toBe(buttonName);

  if (buttonName !== null) {
    await expect
      .element(page.getByRole("button", { name: buttonName }))
      .toBeVisible();
  }
}

export function getPrimaryLabels(): string[] {
  return getLinkLabels(document.querySelector(".test-nav > .test-list"));
}

/**
 * Whether every visible primary link and the toggle sit inside the container.
 * The cross-adapter invariant behind the fit calculation: however an adapter
 * establishes its measurements, the rendered layout must never overflow.
 */
function fitsWithinContainer(): boolean {
  const nav = document.querySelector(".test-nav");
  if (!(nav instanceof HTMLElement)) return false;

  const limit = nav.getBoundingClientRect().right + 0.5;
  const edges = Array.from(
    nav.querySelectorAll(":scope > .test-list a"),
    (anchor) => anchor.getBoundingClientRect().right,
  );

  const toggle = getToggleElement();
  if (toggle !== null && isVisible(toggle)) {
    edges.push(toggle.getBoundingClientRect().right);
  }

  return edges.every((edge) => edge <= limit);
}

function getOverflowLabels(): string[] {
  return getLinkLabels(document.querySelector(".test-nav > .test-overflow"));
}

function getVisibleOverflowLabels(): string[] {
  return isOverflowVisible() ? getOverflowLabels() : [];
}

function getVisibleNavLabels(): string[] {
  return [...getPrimaryLabels(), ...getVisibleOverflowLabels()];
}

function getVisibleToggleName(): string | null {
  const toggle = getToggleElement();

  if (toggle === null || !isVisible(toggle)) return null;

  return toggle.textContent?.trim() ?? "";
}

function getToggleExpanded(): string | null {
  return getToggleElement()?.getAttribute("aria-expanded") ?? null;
}

export function getLinkLabels(container: Element | null): string[] {
  if (container === null) return [];

  return Array.from(container.querySelectorAll("a"), (anchor) =>
    anchor.textContent?.trim(),
  ).filter((label): label is string => label !== undefined && label.length > 0);
}

function isOverflowVisible(): boolean {
  const overflow = document.querySelector(".test-nav > .test-overflow");

  return overflow instanceof HTMLElement && isVisible(overflow);
}

export function getToggleElement(): HTMLElement | null {
  const toggle = document.querySelector(".test-nav > .test-toggle");

  return toggle instanceof HTMLElement ? toggle : null;
}

export function isVisible(element: HTMLElement): boolean {
  return !element.hidden && getComputedStyle(element).display !== "none";
}
