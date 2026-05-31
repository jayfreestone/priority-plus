import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

import { PriorityPlus } from "./PriorityPlus";

const items = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#projects", label: "Projects" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#integrations", label: "Integrations" },
];

test("renders primary and overflow items in a real browser", async () => {
  const screen = await render(
    <>
      <style>{`
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

        .test-item {
          flex: 0 0 auto;
          width: 96px;
        }

        .test-link {
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
      `}</style>
      <PriorityPlus
        aria-label="Main"
        classNames={{
          item: "test-item",
          overflow: "test-overflow",
          primary: "test-list",
          root: "test-nav",
          toggle: "test-toggle",
        }}
        getKey={(item) => item.href}
        items={items}
        renderItem={(item) => (
          <a className="test-link" href={item.href}>
            {item.label}
          </a>
        )}
      />
    </>,
  );

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
