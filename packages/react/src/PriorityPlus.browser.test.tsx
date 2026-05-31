import { useState } from "react";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  installPriorityPlusBrowserStyles,
  priorityPlusBrowserItems,
  testPriorityPlusBrowserBehavior,
} from "../../../test/priority-plus-browser-behavior.js";
import { PriorityPlus } from "./PriorityPlus";

const dynamicPriorityPlusStyles = `
  .dynamic-nav {
    display: flex;
    gap: 8px;
    position: relative;
    width: 100vw;
  }

  .dynamic-list {
    display: flex;
    flex: 0 1 auto;
    gap: 8px;
    list-style: none;
    margin: 0;
    min-width: 0;
    padding: 0;
  }

  .dynamic-item {
    flex: 0 0 auto;
  }

  .dynamic-link {
    display: block;
    width: 60px;
  }

  .dynamic-link--wide {
    width: 140px;
  }

  .dynamic-toggle {
    flex: 0 0 auto;
    width: 72px;
  }

  .dynamic-overflow[hidden] {
    display: none;
  }
`;

testPriorityPlusBrowserBehavior(async () => {
  installPriorityPlusBrowserStyles();

  await render(
    <PriorityPlus.Root
      aria-label="Main"
      render={(props) => <nav {...props} className="test-nav" />}
    >
      <PriorityPlus.Primary
        render={(props) => <ul {...props} className="test-list" />}
      >
        {priorityPlusBrowserItems.map((item, index) => (
          <PriorityPlus.Item
            id={item.href}
            key={item.href}
            order={index}
            render={(props) => (
              <li {...props} className="test-item">
                <a className="test-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            )}
          />
        ))}
      </PriorityPlus.Primary>

      <PriorityPlus.Trigger
        render={(props, state) => (
          <button {...props} className="test-toggle">
            More ({state.overflowCount})
          </button>
        )}
      />

      <PriorityPlus.Overflow
        render={(props) => <ul {...props} className="test-overflow" />}
      />
    </PriorityPlus.Root>,
  );
});

test("recalculates when same-count item widths change", async () => {
  installDynamicPriorityPlusStyles();
  await page.viewport(220, 400);

  await render(<DynamicPriorityPlus />);

  await expect.poll(getDynamicPrimaryLabels).toEqual([
    "Dashboard",
    "Projects",
    "Reports",
  ]);
  await expect.poll(getDynamicToggleName).toBe(null);

  await page.getByRole("button", { name: "Widen" }).click();

  await expect.poll(getDynamicPrimaryLabels).toEqual(["Dashboard"]);
  await expect.poll(getDynamicToggleName).toBe("More (2)");
});

function DynamicPriorityPlus() {
  const [wide, setWide] = useState(false);
  const items = [
    { href: "#dashboard", label: "Dashboard", wide },
    { href: "#projects", label: "Projects", wide: false },
    { href: "#reports", label: "Reports", wide: false },
  ];

  return (
    <>
      <button onClick={() => setWide(true)} type="button">
        Widen
      </button>
      <PriorityPlus.Root
        aria-label="Dynamic"
        render={(props) => <nav {...props} className="dynamic-nav" />}
      >
        <PriorityPlus.Primary
          render={(props) => <ul {...props} className="dynamic-list" />}
        >
          {items.map((item, index) => (
            <PriorityPlus.Item
              id={item.href}
              key={item.href}
              order={index}
              render={(props) => (
                <li {...props} className="dynamic-item">
                  <a
                    className={[
                      "dynamic-link",
                      item.wide ? "dynamic-link--wide" : undefined,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    href={item.href}
                  >
                    {item.label}
                  </a>
                </li>
              )}
            />
          ))}
        </PriorityPlus.Primary>

        <PriorityPlus.Trigger
          render={(props, state) => (
            <button {...props} className="dynamic-toggle">
              More ({state.overflowCount})
            </button>
          )}
        />

        <PriorityPlus.Overflow
          render={(props) => <ul {...props} className="dynamic-overflow" />}
        />
      </PriorityPlus.Root>
    </>
  );
}

function installDynamicPriorityPlusStyles(): void {
  if (document.querySelector("style[data-dynamic-priority-plus-fixture]")) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-dynamic-priority-plus-fixture", "");
  style.textContent = dynamicPriorityPlusStyles;
  document.head.append(style);
}

function getDynamicPrimaryLabels(): string[] {
  return getLinkLabels(document.querySelector(".dynamic-nav > .dynamic-list"));
}

function getDynamicToggleName(): string | null {
  const toggle = document.querySelector(".dynamic-nav > .dynamic-toggle");

  if (!(toggle instanceof HTMLElement) || !isVisible(toggle)) return null;

  return toggle.textContent?.trim() ?? "";
}

function getLinkLabels(container: Element | null): string[] {
  if (container === null) return [];

  return Array.from(container.querySelectorAll("a"), (anchor) =>
    anchor.textContent?.trim(),
  ).filter((label): label is string => label !== undefined && label.length > 0);
}

function isVisible(element: HTMLElement): boolean {
  return !element.hidden && getComputedStyle(element).display !== "none";
}
