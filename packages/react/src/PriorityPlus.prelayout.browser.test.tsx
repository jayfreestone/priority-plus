import { prelayout } from "@priority-plus/core/prelayout";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { page } from "vitest/browser";

import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
} from "../../../test/priority-plus-browser-behavior.js";
import { PriorityPlus } from "./PriorityPlus";

// The SSR-and-hydrate flow prelayout exists for: server markup paints with
// the correct layout before any framework code runs, and hydration adopts
// that markup untouched — no mismatches, no flash.
const fixture = (
  <PriorityPlus
    aria-label="Main"
    className="test-nav"
    primaryClassName="test-list"
    overflowClassName="test-overflow"
    itemClassName="test-item"
    toggleClassName="test-toggle"
    items={priorityPlusBrowserItems}
    getItemKey={(item) => item.href}
    renderToggle={(state) => `More (${state.overflowCount})`}
  >
    {(item) => (
      <a className="test-link" href={item.href}>
        {item.label}
      </a>
    )}
  </PriorityPlus>
);

describe("prelayout + hydration", () => {
  test("lays out server markup pre-paint and hydrates without mismatches", async () => {
    installPriorityPlusBrowserStyles();
    // 96px items with 8px gaps and a 72px toggle: two items fit at 300px.
    await page.viewport(300, 400);
    document.body.replaceChildren();

    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = renderToString(fixture);

    const nav = host.querySelector("nav");
    if (!(nav instanceof HTMLElement)) throw new Error("nav missing");

    // The render-blocking pass: measure the server markup, hide the overflow.
    expect(prelayout(nav)).toMatchObject({
      visibleCount: 2,
      overflowCount: 2,
    });

    expect(getPrimaryItemsHidden(nav)).toEqual([false, false, true, true]);
    expect(getComputedStyle(getToggle(nav)).display).not.toBe("none");

    // Hydrate against the framework-untouched markup. React reports
    // mismatches through onRecoverableError and console.error; both must
    // stay silent.
    const recoverableErrors: unknown[] = [];
    const consoleError = vi.spyOn(console, "error");
    const root = hydrateRoot(host, fixture, {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });

    onTestFinished(() => {
      root.unmount();
      consoleError.mockRestore();
      document
        .querySelectorAll("style[data-priority-plus-prelayout]")
        .forEach((style) => style.remove());
    });

    // The first measured layout marks the container enhanced, neutralising
    // the injected styles as the structural layout takes over.
    await expect
      .poll(() => nav.hasAttribute("data-priority-plus-enhanced"))
      .toBe(true);

    // Hydration adopted the server-rendered element rather than re-rendering.
    expect(host.querySelector("nav")).toBe(nav);

    await expect
      .poll(
        () =>
          nav.querySelectorAll(":scope > [data-priority-plus-primary] > li")
            .length,
      )
      .toBe(2);

    const toggle = getToggle(nav);
    expect(toggle.hidden).toBe(false);
    expect(toggle.textContent).toBe("More (2)");

    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

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
