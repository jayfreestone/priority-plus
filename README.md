# priority-plus

A modern Priority+ navigation library with a framework-agnostic core and small framework adapters.

## Packages

- `@priority-plus/core`: pure layout calculation, state helpers, and scheduling utilities.
- `priority-plus`: custom element adapter for progressive enhancement.
- `@priority-plus/react`: React hook and component adapter.
- `@priority-plus/svelte`: Svelte 5 component adapter.
- `@priority-plus/playground`: local Vite playground consuming the workspace packages.

The package split follows the same broad model used by TanStack projects: shared logic lives in a small core package, while framework packages handle measurement, lifecycle, and rendering idiomatically for their runtime.

## Development

```sh
npm install
npm run typecheck
npm run test
npm run test:browser
npm run build
```

Browser component tests run with Vitest Browser Mode and Playwright Chromium. If Chromium is not installed locally, run:

```sh
npx playwright install chromium
```

Start the playground:

```sh
npm run dev
```

## React

```tsx
import { PriorityPlus } from "@priority-plus/react";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  return (
    <PriorityPlus.Root
      aria-label="Main"
      render={(props) => <nav {...props} className="nav" />}
    >
      <PriorityPlus.Primary
        render={(props) => <ul {...props} className="nav-list" />}
      >
        {items.map((item, index) => (
          <PriorityPlus.Item
            id={item.href}
            key={item.href}
            order={index}
            render={(props) => (
              <li {...props}>
                <a href={item.href}>{item.label}</a>
              </li>
            )}
          />
        ))}
      </PriorityPlus.Primary>

      <PriorityPlus.Trigger
        render={(props, state) => (
          <button {...props}>More ({state.overflowCount})</button>
        )}
      />

      <PriorityPlus.Overflow
        render={(props) => <ul {...props} className="nav-overflow" />}
      />
    </PriorityPlus.Root>
  );
}
```

Items register when they mount, so the root does not need an `items` prop. The
React package also exports `usePriorityPlus` for teams that want lower-level
markup control.

## Svelte

```svelte
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

## Custom Element

```html
<script type="module">
  import "priority-plus";
</script>

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
```

Call `refresh()` on the element after changing item content or styles that affect
intrinsic widths. Add `data-priority-plus-performance` while profiling to emit
`priority-plus:layout` and `priority-plus:measure` entries through the browser
Performance API.
