# Core

`@priority-plus/core` is the framework-agnostic engine that every adapter is
built on. Reach for it directly when you're targeting a runtime without an
adapter (Vue, Solid, Angular, vanilla JS, …) or when you want the layout maths
without any rendering.

```sh
npm install @priority-plus/core
```

It has two entry points:

- **`@priority-plus/core`** — state, item partitioning, the layout session, and
  the toggle presenter.
- **`@priority-plus/core/dom`** — browser measurement helpers.

Read [How It Works](/guide/how-it-works) first for the conceptual model; this
page is the API reference.

## Types

### Measurements

`PriorityPlusMeasurements` is the raw input to the pure fit calculation:

| Field | Type | Description |
| --- | --- | --- |
| `itemWidths` | `number[]` | Width of each item, in source order. |
| `itemGap` | `number` | Gap between adjacent primary items. |
| `containerGap` | `number` | Gap between the primary list and the toggle. |
| `toggleWidth` | `number` | Width of the toggle when visible. |
| `available` | `number` | Inline space available for the primary list + toggle. |

`PriorityPlusCachedMeasurements` is the shape the session caches between
layouts: the same fields **without** `available`, plus a
`primaryNonContentInlineSize` (the primary list's own padding/border/margin).
`available` is re-derived from the live container width on every resize, so
plain resizes never re-measure. `readCachedMeasurements` (below) produces this
shape for you.

### State

`PriorityPlusState` is the output that drives rendering:

| Field | Type | Description |
| --- | --- | --- |
| `itemCount` | `number` | Total number of items. |
| `visibleCount` | `number` | Items that fit in the primary list. |
| `overflowCount` | `number` | Items pushed into overflow. |
| `allVisible` | `boolean` | `true` when `overflowCount === 0`. |

### Options

`PriorityPlusOptions` — see the [Options guide](/guide/options):

| Field | Type | Description |
| --- | --- | --- |
| `collapseAtCount` | `number` | Collapse everything into overflow at or below this fitted count. |

## State helpers

### `createPriorityPlusState(itemCount?)`

Build an initial all-visible state — useful as a render default before the first
measurement.

### `partitionItems(items, visibleCount)`

Split your item array into `{ visibleItems, overflowItems }` — for adapters that
re-render:

```ts
import { partitionItems } from "@priority-plus/core";

const { visibleItems, overflowItems } = partitionItems(items, state.visibleCount);
```

### `planPartition(previousVisibleCount, nextVisibleCount, itemCount, options?)`

For adapters that move live DOM nodes instead of re-rendering. Returns a
`PriorityPlusPartitionPlan` describing which item indices move between lists:

| Kind | Payload | Meaning |
| --- | --- | --- |
| `none` | — | Nothing moves. |
| `promote` | `indices` | These move from overflow to the end of primary. |
| `demote` | `indices` | These move from the end of primary to the *front* of overflow. |
| `rebuild` | `primary`, `overflow` | Repartition from scratch (pass `{ force: true }` after re-measuring). |

## The layout session

### `createPriorityPlusSession(options)`

The single interface adapters build on. The session owns the measurement cache,
the "re-measure vs. reuse" decision, frame coalescing, and the
`ResizeObserver`; you supply three DOM-facing hooks.

```ts
import { createPriorityPlusSession } from "@priority-plus/core";
import { contentInlineSize, readCachedMeasurements } from "@priority-plus/core/dom";

const session = createPriorityPlusSession({
  itemCount: items.length,
  readMeasurements: () =>
    readCachedMeasurements({
      items: measureList.children,
      itemGapSource: measureList,
      container,
      toggle: measureToggle,
      primary,
    }),
  getContainerInlineSize: () => contentInlineSize(container),
  onResult: (result) => render(result.state),
});

session.observe(container);
session.observe(measureList, { refreshOnResize: true });
session.layout({ refreshMeasurements: true });
```

| Option | Type | Description |
| --- | --- | --- |
| `readMeasurements` | `() => PriorityPlusCachedMeasurements \| null \| undefined` | Read fresh widths. Return nullish to abort (e.g. elements not mounted). |
| `getContainerInlineSize` | `() => number \| null \| undefined` | The width available to the primary list. Read after `readMeasurements`. Nullish aborts. |
| `onResult` | `(result: PriorityPlusLayoutResult) => void` | Apply a computed layout. Every state change arrives here. |
| `options` | `PriorityPlusOptions` | Initial layout options. |
| `itemCount` | `number` | Seeds the optimistic all-visible state. |
| `requestFrame` / `cancelFrame` | functions | Override frame primitives (mainly for tests). Default to `requestAnimationFrame`. |

The returned session:

| Method | Description |
| --- | --- |
| `getState()` | The current `PriorityPlusState` (the same snapshot `onResult` last delivered). |
| `layout({ refreshMeasurements? })` | Run a layout synchronously. |
| `schedule({ refreshMeasurements? })` | Coalesce a layout into the next frame. Bursts collapse to one run; if **any** caller asked to refresh, widths are re-read. |
| `observe(element, { refreshOnResize? })` | Watch an element's size. Pass `refreshOnResize: true` for elements whose intrinsic size feeds the fit calculation (the hidden measurer); leave it off for the container, whose resize reuses cached widths. Observing the measurer this way also covers web-font loads: new metrics resize the measurer, which triggers the re-measure. |
| `unobserve(element)` | Stop watching an element. |
| `reset(itemCount?)` | Drop cached measurements, commit an optimistic all-visible state. Call when the item set changes, then `layout({ refreshMeasurements: true })`. |
| `setOptions(options)` | Swap options (e.g. `collapseAtCount`) and recalculate against cached measurements. |
| `destroy()` | Cancel pending work and disconnect observers. Reversible — a later `observe` revives the session, so it survives unmount/remount cycles. |

Every recalculation — including `reset` and `setOptions` — is delivered to
`onResult` as a `PriorityPlusLayoutResult`:

| Field | Type | Description |
| --- | --- | --- |
| `state` | `PriorityPlusState` | The new state. |
| `previousState` | `PriorityPlusState` | The state before this call. |
| `visibleCountChanged` | `boolean` | — |
| `overflowCountChanged` | `boolean` | — |
| `itemCountChanged` | `boolean` | — |
| `measurementsChanged` | `boolean` | Whether widths were re-read. |

## The toggle presenter

The rendered truth about the toggle and overflow list, derived in one place so
adapters can't drift apart. Store the *intent* (did the user ask to open?) in
your own reactivity, and derive everything else:

### `presentToggle(openIntent, state)`

| Field | Description |
| --- | --- |
| `expanded` | Whether the overflow is open — the value `aria-expanded` reflects. Never `true` while `allVisible`. |
| `toggleHidden` | Whether the toggle should be hidden (nothing overflows). |
| `overflowHidden` | Whether the overflow list should be hidden. |

One rule the presenter can't own: when `allVisible` becomes `true`, reset your
stored intent to closed, so the overflow doesn't spring back open when items
overflow again later.

### `defaultToggleLabel(state)`

The default `More (n)` label, clamped so a measurer never renders `More (0)`.

### `widestToggleState(itemCount)`

The state a hidden measurer should render the toggle with: as if every item had
overflowed, so the fit calculation reserves room for the toggle at its widest.

## DOM helpers (`@priority-plus/core/dom`)

### `readCachedMeasurements(sources)`

Builds the cached-measurement shape from a set of elements. The single place
every adapter reads the DOM, so the shape is identical everywhere.

```ts
import { readCachedMeasurements } from "@priority-plus/core/dom";
```

| Source | Type | Role |
| --- | --- | --- |
| `items` | `Iterable<Element>` | Items whose widths to read, in order. |
| `itemGapSource` | `Element` | Element whose `column-gap` defines item spacing. |
| `container` | `HTMLElement` | Element whose `column-gap` separates list from toggle. |
| `toggle` | `Element` | The toggle, measured at its visible width. |
| `primary` | `HTMLElement` | Primary list, whose own padding/border/margin is subtracted. |

### `contentInlineSize(element)`

The element's content-box inline size (width minus horizontal padding) — the
"available" width you pass via `getContainerInlineSize`.

## Building an adapter

The recipe every official adapter follows:

1. Render the navigation **and** a hidden measurer containing the full item list
   plus a toggle rendered with `widestToggleState`.
2. Create a session with `createPriorityPlusSession`, wired to your elements via
   `readCachedMeasurements` and `contentInlineSize`.
3. `observe` the container (plain) and the measurer elements
   (`{ refreshOnResize: true }`); run `layout({ refreshMeasurements: true })`
   on mount. When the item set changes, `reset(items.length)` then re-run a
   refreshing layout.
4. In `onResult`, split items with `partitionItems` (re-rendering) or execute a
   `planPartition` plan (moving live nodes), and derive the toggle's
   `aria-expanded`/hidden flags with `presentToggle`.
5. `destroy()` on teardown.

The [React hook](/adapters/react#usepriorityplus) and the
[Svelte component](/adapters/svelte) are the clearest worked examples — both are
small enough to read end to end.
