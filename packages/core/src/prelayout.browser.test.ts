import { afterEach, describe, expect, it } from "vitest";

import { prelayout } from "./prelayout";

// Mirrors the adapters' server output: every item in the primary list, a
// hidden toggle, and the hidden measurer with an item-list and toggle twin.
// 96px items with 8px gaps and a 72px toggle: at 300px, two items fit
// alongside the toggle (280px) but not three (384px).
const fixtureStyles = `
  body { margin: 0; }

  .nav {
    display: flex;
    gap: 8px;
    position: relative;
  }

  .list {
    display: flex;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .list > li {
    flex: 0 0 auto;
    width: 96px;
  }

  /* No display: an author display would override the hidden attribute. */
  .toggle {
    flex: 0 0 auto;
    width: 72px;
  }
`;

interface FixtureOptions {
  collapseAt?: number;
  itemCount?: number;
  measurer?: boolean;
  width?: number;
}

function mountFixture({
  collapseAt,
  itemCount = 4,
  measurer = true,
  width = 300,
}: FixtureOptions = {}): HTMLElement {
  installFixtureStyles();

  const list = () => `
    <ul class="list" data-priority-plus-primary="">
      ${Array.from(
        { length: itemCount },
        (_, index) => `<li><a href="#item-${index + 1}">Item ${index + 1}</a></li>`,
      ).join("")}
    </ul>`;

  document.body.innerHTML = `
    <nav
      class="nav"
      style="width: ${width}px"
      ${collapseAt === undefined ? "" : `data-priority-plus-collapse-at="${collapseAt}"`}
    >
      ${list()}
      <button class="toggle" data-priority-plus-toggle="" hidden type="button">More (1)</button>
      ${
        measurer
          ? `<div
              aria-hidden="true"
              data-priority-plus-measurer=""
              style="contain: layout; height: 0; left: 0; overflow: hidden; pointer-events: none; position: absolute; top: 0; visibility: hidden; width: max-content;"
            >
              ${list()}
              <button class="toggle" data-priority-plus-toggle="" type="button">More (${itemCount})</button>
            </div>`
          : ""
      }
    </nav>`;

  const nav = document.querySelector("nav");
  if (nav === null) throw new Error("fixture failed to mount");
  return nav;
}

function installFixtureStyles(): void {
  if (document.querySelector("style[data-prelayout-fixture]")) return;

  const style = document.createElement("style");
  style.setAttribute("data-prelayout-fixture", "");
  style.textContent = fixtureStyles;
  document.head.append(style);
}

function getPrimaryItemsHidden(nav: HTMLElement): boolean[] {
  return Array.from(
    nav.querySelectorAll(":scope > [data-priority-plus-primary] > li"),
    (item) => getComputedStyle(item).display === "none",
  );
}

function getToggle(nav: HTMLElement): HTMLElement {
  const toggle = nav.querySelector(":scope > [data-priority-plus-toggle]");
  if (!(toggle instanceof HTMLElement)) throw new Error("toggle missing");
  return toggle;
}

function getInjectedStyles(): HTMLStyleElement[] {
  return Array.from(
    document.querySelectorAll("style[data-priority-plus-prelayout]"),
  );
}

afterEach(() => {
  for (const style of getInjectedStyles()) style.remove();
  document.body.innerHTML = "";
});

describe("prelayout", () => {
  it("hides overflowed items and reveals the toggle", () => {
    const nav = mountFixture();

    expect(prelayout(nav)).toMatchObject({
      itemCount: 4,
      visibleCount: 2,
      overflowCount: 2,
      allVisible: false,
      measured: true,
    });

    expect(getPrimaryItemsHidden(nav)).toEqual([false, false, true, true]);

    // The toggle's `hidden` attribute is overridden with the display its
    // measurer twin resolved to — the UA default here, since the fixture sets
    // none. (The computed value is asserted via the stylesheet because a flex
    // item's computed display blockifies.)
    const toggle = getToggle(nav);
    expect(toggle.hidden).toBe(true);
    expect(getComputedStyle(toggle).display).not.toBe("none");

    // One stylesheet injected, and the container itself untouched — a stamped
    // attribute would surface as a hydration mismatch.
    const [style, ...others] = getInjectedStyles();
    expect(others).toEqual([]);
    expect(style?.textContent).toContain("display: inline-block");
    expect(nav.attributes).toHaveLength(2); // class + style only
  });

  it("leaves the measurer's twins untouched", () => {
    const nav = mountFixture();
    prelayout(nav);

    const twinItems = Array.from(
      nav.querySelectorAll(
        "[data-priority-plus-measurer] [data-priority-plus-primary] > li",
      ),
      (item) => getComputedStyle(item).display,
    );

    expect(twinItems).not.toContain("none");
  });

  it("is neutralised once the container is marked enhanced", () => {
    const nav = mountFixture();
    prelayout(nav);

    nav.setAttribute("data-priority-plus-enhanced", "");

    expect(getPrimaryItemsHidden(nav)).toEqual([false, false, false, false]);
    expect(getComputedStyle(getToggle(nav)).display).toBe("none");
  });

  it("no-ops when every item fits", () => {
    // 408px of items and gaps fit into 500px without the toggle.
    const nav = mountFixture({ width: 500 });

    expect(prelayout(nav)).toMatchObject({ allVisible: true });
    expect(getInjectedStyles()).toEqual([]);
    expect(getComputedStyle(getToggle(nav)).display).toBe("none");
  });

  it("reads collapse-at-count from the container", () => {
    const nav = mountFixture({ collapseAt: 2 });

    expect(prelayout(nav)).toMatchObject({ visibleCount: 0, overflowCount: 4 });
    expect(getPrimaryItemsHidden(nav)).toEqual([true, true, true, true]);
  });

  it("prefers an explicit collapse-at-count option over the attribute", () => {
    const nav = mountFixture({ collapseAt: 2 });

    expect(prelayout(nav, { collapseAtCount: 0 })).toMatchObject({
      visibleCount: 2,
    });
  });

  it("bails without side effects when the measurer is missing", () => {
    const nav = mountFixture({ measurer: false });

    expect(prelayout(nav)).toBeNull();
    expect(getInjectedStyles()).toEqual([]);
  });

  it("bails when the container is not laid out", () => {
    const nav = mountFixture();
    nav.style.display = "none";

    expect(prelayout(nav)).toBeNull();
    expect(getInjectedStyles()).toEqual([]);
  });

  it("tolerates a missing container", () => {
    expect(prelayout(null)).toBeNull();
    expect(prelayout(undefined)).toBeNull();
  });
});
