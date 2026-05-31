# Getting Started

Pick the package that matches your stack. Each adapter depends on
`@priority-plus/core`, which is installed automatically.

## Install

::: code-group

```sh [React]
npm install @priority-plus/react
```

```sh [Svelte]
npm install @priority-plus/svelte
```

```sh [Custom Element]
npm install priority-plus
```

```sh [Core only]
npm install @priority-plus/core
```

:::

`@priority-plus/react` and `@priority-plus/svelte` declare React (>=19) and
Svelte (>=5) as peer dependencies, so they use the copy already in your project.

## A first navigation

::: code-group

```tsx [React]
import { PriorityPlus } from "@priority-plus/react";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  return (
    <PriorityPlus
      aria-label="Main"
      items={items}
      getItemKey={(item) => item.href}
    >
      {(item) => <a href={item.href}>{item.label}</a>}
    </PriorityPlus>
  );
}
```

```svelte [Svelte]
<script lang="ts">
  import { PriorityPlus } from "@priority-plus/svelte";

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/reports", label: "Reports" },
  ];
</script>

<PriorityPlus {items}>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
```

```html [Custom Element]
<priority-plus>
  <nav>
    <ul data-priority-plus-primary>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/projects">Projects</a></li>
      <li><a href="/reports">Reports</a></li>
    </ul>
    <button hidden data-priority-plus-toggle type="button">More</button>
    <ul hidden data-priority-plus-overflow></ul>
  </nav>
</priority-plus>

<script type="module">
  import "priority-plus";
</script>
```

:::

That's a working Priority+ navigation. Resize the container and items move
between the primary and overflow lists automatically.

## Next steps

- The examples above render with no styling — add your own CSS via the
  [styling slots](/guide/styling).
- Learn how measurement and layout actually work in
  [How It Works](/guide/how-it-works).
- See every prop and option in the adapter pages:
  [React](/adapters/react), [Svelte](/adapters/svelte),
  [Custom Element](/adapters/custom-element).
- Tune behaviour with shared [Options](/guide/options) like `collapseAtCount`.
