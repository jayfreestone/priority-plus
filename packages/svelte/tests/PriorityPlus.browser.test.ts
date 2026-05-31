import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import TestPriorityPlus from "./TestPriorityPlus.svelte";

test("renders primary and overflow items in a real browser", async () => {
  const screen = await render(TestPriorityPlus);

  await expect
    .element(screen.getByRole("button", { name: "More (3)" }))
    .toBeVisible();
  expect(
    Array.from(document.querySelectorAll("a")).filter(
      (anchor) => anchor.textContent === "Integrations",
    ),
  ).toHaveLength(1);

  await screen.getByRole("button", { name: "More (3)" }).click();

  await expect
    .element(screen.getByRole("button", { name: "More (3)" }))
    .toHaveAttribute("aria-expanded", "true");
  await expect
    .element(screen.getByRole("link", { name: "Dashboard" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("link", { name: "Integrations" }))
    .toBeVisible();
});
