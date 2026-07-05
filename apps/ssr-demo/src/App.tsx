import { PriorityPlus } from "@priority-plus/react";

const items = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#projects", label: "Projects" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#integrations", label: "Integrations" },
  { href: "#analytics", label: "Analytics" },
  { href: "#reports", label: "Reports" },
  { href: "#members", label: "Members" },
  { href: "#billing", label: "Billing" },
  { href: "#settings", label: "Settings" },
  { href: "#support", label: "Support" },
];

export function App() {
  return (
    <PriorityPlus
      aria-label="Demo"
      className="nav"
      primaryClassName="list"
      overflowClassName="overflow"
      itemClassName="item"
      toggleClassName="toggle"
      items={items}
      getItemKey={(item) => item.href}
      // Count-free label: a counted label would show the server-rendered
      // count until hydration, since prelayout cannot rewrite text.
      renderToggle={() => "More ▾"}
    >
      {(item) => (
        <a className="link" href={item.href}>
          {item.label}
        </a>
      )}
    </PriorityPlus>
  );
}
