import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";

export const priorityPlusBrowserItems = [
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

const labels = priorityPlusBrowserItems.map((item) => item.label);

export function installPriorityPlusBrowserStyles() {
  if (document.querySelector("style[data-priority-plus-browser-fixture]")) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-priority-plus-browser-fixture", "");
  style.textContent = priorityPlusBrowserStyles;
  document.head.append(style);
}

export function testPriorityPlusBrowserBehavior(mount) {
  test("renders accessible primary and overflow navigation", async () => {
    await mountAtWidth(mount, 260);

    const moreButton = page.getByRole("button", { name: "More (3)" });

    await expect
      .element(page.getByRole("navigation", { name: "Main" }))
      .toBeVisible();
    await expect.element(moreButton).toHaveAccessibleName("More (3)");
    await expect.element(moreButton).toHaveAttribute("aria-expanded", "false");
    await expect.element(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(primaryLabels()).toEqual(["Dashboard"]);

    moreButton.element().focus();
    await expect.element(moreButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.element(moreButton).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(page.getByRole("link", { name: "Integrations" }))
      .toBeVisible();
  });

  test("responds to viewport resizing", async () => {
    await mountAtWidth(mount, 260);

    await expect
      .poll(primaryLabels)
      .toEqual(["Dashboard"]);
    await expect
      .element(page.getByRole("button", { name: "More (3)" }))
      .toBeVisible();

    await page.viewport(520, 400);

    await expect.poll(primaryLabels).toEqual(labels);
    await expect.poll(isToggleVisible).toBe(false);

    await page.viewport(260, 400);

    await expect.poll(primaryLabels).toEqual(["Dashboard"]);
    await expect
      .element(page.getByRole("button", { name: "More (3)" }))
      .toBeVisible();
  });
}

async function mountAtWidth(mount, width) {
  await page.viewport(width, 400);
  document.body.innerHTML = "";
  await mount();
}

function primaryLabels() {
  const primary = document.querySelector(".test-nav > .test-list");

  if (primary === null) return [];

  return Array.from(primary.querySelectorAll("a"), (anchor) =>
    anchor.textContent?.trim(),
  ).filter(Boolean);
}

function isToggleVisible() {
  const toggle = document.querySelector(".test-nav > .test-toggle");

  if (!(toggle instanceof HTMLElement)) return false;

  return !toggle.hidden && getComputedStyle(toggle).display !== "none";
}
