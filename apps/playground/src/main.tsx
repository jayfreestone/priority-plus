import { PriorityPlus as ReactPriorityPlus } from "@priority-plus/react";
import { mount } from "svelte";
import { createRoot } from "react-dom/client";
import {
  PriorityPlusElement,
  PriorityPlusOverflowCountChangeEvent,
} from "priority-plus";

import SvelteDemo from "./SvelteDemo.svelte";
import "./playground.css";

const items = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#projects", label: "Projects" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#customers", label: "Customers" },
  { href: "#analytics", label: "Analytics" },
  { href: "#automation", label: "Automation" },
  { href: "#reports", label: "Reports" },
  { href: "#integrations", label: "Integrations" },
];

createRoot(document.querySelector("#react-root")!).render(
  <ReactPriorityPlus
    aria-label="React"
    className="priority-nav"
    primaryClassName="priority-nav__list"
    overflowClassName="priority-nav__overflow"
    itemClassName="priority-nav__item"
    toggleClassName="priority-nav__toggle"
    items={items}
    getItemKey={(item) => item.href}
  >
    {(item) => <a href={item.href}>{item.label}</a>}
  </ReactPriorityPlus>,
);

mount(SvelteDemo, {
  props: { items },
  target: document.querySelector("#svelte-root")!,
});

renderElementOverflowCount();

function renderElementOverflowCount(): void {
  const priorityPlus = document.querySelector("priority-plus");
  const count = priorityPlus?.querySelector(
    "[data-priority-plus-overflow-count]",
  );

  if (
    !(priorityPlus instanceof PriorityPlusElement) ||
    !(count instanceof HTMLElement)
  ) {
    return;
  }

  const render = (overflowCount = priorityPlus.overflowCount) => {
    count.textContent = overflowCount > 0 ? `(${overflowCount})` : "";
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
