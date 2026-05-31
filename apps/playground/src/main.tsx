import { PriorityPlus as ReactPriorityPlus } from "@priority-plus/react";
import { mount } from "svelte";
import { createRoot } from "react-dom/client";
import "priority-plus";

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
    classNames={{
      item: "priority-nav__item",
      overflow: "priority-nav__overflow",
      primary: "priority-nav__list",
      root: "priority-nav",
      toggle: "priority-nav__toggle",
    }}
    getKey={(item) => item.href}
    items={items}
    renderItem={(item) => <a href={item.href}>{item.label}</a>}
  />,
);

mount(SvelteDemo, {
  props: { items },
  target: document.querySelector("#svelte-root")!,
});
