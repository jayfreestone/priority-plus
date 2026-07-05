# React

The React adapter ships two things: a ready-made `PriorityPlus` component for
the common case, and a lower-level `usePriorityPlus` hook for full markup
control.

```sh
npm install @priority-plus/react
```

React `>=19` and `react-dom` `>=19` are peer dependencies.

## `<PriorityPlus>`

Pass your items as data and render each through the child function:

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

The component renders the `<nav>`, both lists, the toggle, and the hidden
measurer for you, and manages the open/closed state of the overflow menu.

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly T[]` | — | The full list of items, in source order. |
| `children` | `(item: T, state: PriorityPlusItemState) => ReactNode` | — | Render function for each item. Called for both lists and the measurer. |
| `renderToggle` | `(state: PriorityPlusToggleState) => ReactNode` | `` `More (n)` `` | Render the toggle's contents. |
| `getItemKey` | `(item: T, index: number) => Key` | item index | Derive a stable React key. |
| `collapseAtCount` | `number` | `undefined` | See [Options](/guide/options). |
| `className` | `string` | — | Class for the container `<nav>`. |
| `primaryClassName` | `string` | — | Class for the primary `<ul>`. |
| `overflowClassName` | `string` | — | Class for the overflow `<ul>`. |
| `itemClassName` | `string` | — | Class for each `<li>`. |
| `toggleClassName` | `string` | — | Class for the toggle `<button>`. |
| `measurerClassName` | `string` | — | Class for the hidden measurer `<div>`. |
| `aria-label` | `string` | `"Priority navigation"` | Accessible name for the `<nav>`. |
| `ref` | `Ref<HTMLElement>` | — | The rendered `<nav>`; merged with the internal container ref. |

Any other valid `<nav>` attributes (`id`, `data-*`, event handlers, …) are
spread onto the container element.

### `PriorityPlusItemState`

The second argument to `children`:

| Field | Type | Description |
| --- | --- | --- |
| `index` | `number` | The item's position in the source `items` array. |
| `overflowed` | `boolean` | Whether this item is currently rendered in the overflow list. |

```tsx
{(item, { overflowed }) => (
  <a href={item.href} aria-current={overflowed ? undefined : "page"}>
    {item.label}
  </a>
)}
```

### `PriorityPlusToggleState`

The argument to `renderToggle` — the full layout
[state](/adapters/core#state) plus whether the menu is open:

| Field | Type | Description |
| --- | --- | --- |
| `itemCount` | `number` | Total number of items. |
| `visibleCount` | `number` | Items currently in the primary list. |
| `overflowCount` | `number` | Items currently in the overflow list. |
| `allVisible` | `boolean` | Whether nothing is overflowing. |
| `open` | `boolean` | Whether the overflow menu is open. |

```tsx
renderToggle={(state) => (state.open ? "Close" : `More (${state.overflowCount})`)}
```

## `usePriorityPlus`

When you need different markup than the component produces, drive everything
yourself with the hook. It does the measuring, scheduling, and partitioning;
you render.

```tsx
import { usePriorityPlus } from "@priority-plus/react";

function Nav({ items }) {
  const p = usePriorityPlus(items);

  return (
    <nav ref={p.containerRef} aria-label="Main">
      <ul ref={p.primaryRef}>
        {p.visibleItems.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>

      {!p.allVisible && (
        <details>
          <summary>More ({p.overflowCount})</summary>
          <ul>
            {p.overflowItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Hidden measurer — must contain every item and the toggle. */}
      <div aria-hidden style={{ position: "absolute", visibility: "hidden" }}>
        <ul ref={p.measureListRef}>
          {items.map((item) => (
            <li key={item.href} ref={p.measureItemRef}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
        <button ref={p.measureToggleRef}>More ({items.length})</button>
      </div>
    </nav>
  );
}
```

### Signature

```ts
function usePriorityPlus<T>(
  items: readonly T[],
  options?: UsePriorityPlusOptions, // { collapseAtCount?: number }
): UsePriorityPlusResult<T>;
```

### Result

The result spreads the current layout [state](/adapters/core#state)
(`itemCount`, `visibleCount`, `overflowCount`, `allVisible`) and adds:

| Field | Type | Description |
| --- | --- | --- |
| `visibleItems` | `T[]` | The slice of `items` currently visible. |
| `overflowItems` | `T[]` | The slice of `items` currently overflowing. |
| `containerRef` | `RefCallback` | Attach to the container element. |
| `primaryRef` | `RefCallback` | Attach to the visible primary list. |
| `measureListRef` | `RefCallback` | Attach to the measurer's list. |
| `measureItemRef` | `RefCallback` | Attach to each measurer item. |
| `measureToggleRef` | `RefCallback` | Attach to the measurer's toggle. |
| `update` | `() => void` | Force a re-measure and relayout. |

::: warning You must render a measurer
The hook reads item widths from the elements wired to `measureListRef`,
`measureItemRef`, and `measureToggleRef`. Render the **full** item list and a
toggle into a hidden, off-screen container — otherwise there's nothing to
measure. The `<PriorityPlus>` component does this for you.
:::

### When to call `update()`

The hook re-measures automatically when `items` changes, on container resize
(via `ResizeObserver`), and once `document.fonts.ready` resolves. Call `update()`
manually if something else changes an item's intrinsic width — for example a
label that updates without the `items` reference changing. See
[How It Works](/guide/how-it-works#when-measurements-must-be-re-read).

## Styling

See the [Styling guide](/guide/styling) for the slot structure and the CSS rules
the pattern needs.
