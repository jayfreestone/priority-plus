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
  <ReactPriorityPlus.Root
    aria-label="React"
    render={(props) => <nav {...props} className="priority-nav" />}
  >
    <ReactPriorityPlus.Primary
      render={(props) => <ul {...props} className="priority-nav__list" />}
    >
      {items.map((item, index) => (
        <ReactPriorityPlus.Item
          id={item.href}
          key={item.href}
          order={index}
          render={(props) => (
            <li {...props} className="priority-nav__item">
              <a href={item.href}>{item.label}</a>
            </li>
          )}
        />
      ))}
    </ReactPriorityPlus.Primary>

    <ReactPriorityPlus.Trigger
      render={(props, state) => (
        <button {...props} className="priority-nav__toggle">
          More ({state.overflowCount})
        </button>
      )}
    />

    <ReactPriorityPlus.Overflow
      render={(props) => <ul {...props} className="priority-nav__overflow" />}
    />
  </ReactPriorityPlus.Root>,
);

mount(SvelteDemo, {
  props: { items },
  target: document.querySelector("#svelte-root")!,
});
