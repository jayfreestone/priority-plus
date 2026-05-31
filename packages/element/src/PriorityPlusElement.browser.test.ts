import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "./index";

test("opens the overflow popover in a real browser", async () => {
  document.body.innerHTML = `
    <style>
      .test-nav {
        display: flex;
        gap: 8px;
        position: relative;
        width: 260px;
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

      .test-list > li {
        flex: 0 0 auto;
        width: 96px;
      }

      .test-list a {
        display: block;
        width: 96px;
      }

      .test-toggle {
        flex: 0 0 auto;
        width: 72px;
      }

      .test-overflow:not(:popover-open)[popover] {
        display: none;
      }
    </style>

    <priority-plus>
      <nav class="test-nav" aria-label="Main">
        <ul class="test-list" data-priority-plus-primary>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#roadmap">Roadmap</a></li>
          <li><a href="#integrations">Integrations</a></li>
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

  const moreButton = page.getByRole("button", { name: "More (3)" });
  const overflow = document.querySelector<HTMLElement>(
    "[data-priority-plus-overflow]",
  );

  await expect.element(moreButton).toBeVisible();
  expect(overflow?.hidden).toBe(true);
  await moreButton.click();

  await expect.element(moreButton).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(page.getByRole("link", { name: "Integrations" }))
    .toBeVisible();
  expect(overflow?.hidden).toBe(false);
});
