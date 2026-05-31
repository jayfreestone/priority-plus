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
    <PriorityPlus
      aria-label="Main"
      className="nav"
      primaryClassName="nav-list"
      overflowClassName="nav-overflow"
      items={items}
      getItemKey={(item) => item.href}
      renderToggle={(state) => `More (${state.overflowCount})`}
    >
      {(item) => <a href={item.href}>{item.label}</a>}
    </PriorityPlus>
  );
}
```

`PriorityPlus` takes the nav items as data and renders each through the child
function; `className`/`primaryClassName`/`overflowClassName`/`itemClassName`/
`toggleClassName` style the slots. For full markup control the package also
exports the lower-level `usePriorityPlus` hook.

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
<priority-plus>
  <nav>
    <ul data-priority-plus-primary>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/projects">Projects</a></li>
      <li><a href="/reports">Reports</a></li>
    </ul>
    <button hidden data-priority-plus-toggle type="button">
      More <span data-overflow-count></span>
    </button>
    <ul hidden data-priority-plus-overflow></ul>
  </nav>
</priority-plus>

<script type="module">
  import { PriorityPlusOverflowCountChangeEvent } from "priority-plus";

  const priorityPlus = document.querySelector("priority-plus");
  const count = priorityPlus.querySelector("[data-overflow-count]");

  function renderCount(overflowCount = priorityPlus.overflowCount) {
    count.textContent = overflowCount > 0 ? `(${overflowCount})` : "";
  }

  priorityPlus.addEventListener(
    PriorityPlusOverflowCountChangeEvent.eventName,
    (event) => renderCount(event.overflowCount),
  );
  renderCount();
</script>
```

Call `refresh()` on the element after changing item content or styles that affect
intrinsic widths. The element exposes readonly `itemCount`, `visibleCount`,
`overflowCount`, `allVisible`, and `state` accessors, and emits
`priority-plus:overflow-count-change` when `overflowCount` changes. If custom
count rendering changes the toggle's intrinsic width, give the toggle a stable
width or call `refresh()` after rendering the count.
