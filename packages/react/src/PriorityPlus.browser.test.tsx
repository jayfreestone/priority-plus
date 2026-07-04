import { useState } from "react";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  getLinkLabels,
  isVisible,
  priorityPlusBrowserItems,
  priorityPlusBrowserTest,
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

const reactPriorityPlusTest = priorityPlusBrowserTest.override(
  "mountPriorityPlus",
  async () => async () => {
    render(
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
      </PriorityPlus>,
    );
  },
);

testPriorityPlusBrowserBehavior(reactPriorityPlusTest);

reactPriorityPlusTest("recalculates when same-count item widths change", async () => {
  installDynamicPriorityPlusStyles();
  await page.viewport(220, 400);

  render(<DynamicPriorityPlus />);

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
      <PriorityPlus
        aria-label="Dynamic"
        className="dynamic-nav"
        primaryClassName="dynamic-list"
        overflowClassName="dynamic-overflow"
        itemClassName="dynamic-item"
        toggleClassName="dynamic-toggle"
        items={items}
        getItemKey={(item) => item.href}
        renderToggle={(state) => `More (${state.overflowCount})`}
      >
        {(item) => (
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
        )}
      </PriorityPlus>
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
