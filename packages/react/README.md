# @priority-plus/react

React adapter for the [Priority+ navigation
pattern](https://css-tricks.com/the-priority-navigation-pattern/): items that
don't fit move into an overflow menu behind a toggle, recalculated as the
container resizes. The first measured layout commits **before paint**, so
client renders never flash an unfitted nav.

```sh
npm install @priority-plus/react
```

Requires React 19+.

## Usage

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
    >
      {(item) => <a href={item.href}>{item.label}</a>}
    </PriorityPlus>
  );
}
```

`PriorityPlus` takes the items as data and renders each through the child
function. For full markup control the package also exports the lower-level
`usePriorityPlus` hook. The package ships `"use client"`, so it can be imported
directly from React Server Components.

For SSR, the optional `@priority-plus/core/prelayout` pass (~1&nbsp;kB,
render-blocking) fits the server-rendered markup before first paint — see the
[server rendering guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/guide/ssr.md),
which includes Next.js and TanStack Start recipes.

## Documentation

Full docs — props, the hook, styling, options — live in the
[repository](https://github.com/jayfreestone/priority-plus): see the
[React adapter guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/adapters/react.md).

## License

[ISC](./LICENSE)
