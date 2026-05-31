# Core

`@priority-plus/core` is the framework-agnostic engine that every adapter is
built on. Reach for it directly when you're targeting a runtime without an
adapter (Vue, Solid, Angular, vanilla JS, …) or when you want the layout maths
without any rendering.

```sh
npm install @priority-plus/core
```

It has two entry points:

- **`@priority-plus/core`** — pure calculation, state, the layout controller,
  and the scheduling engine.
- **`@priority-plus/core/dom`** — browser measurement helpers.

Read [How It Works](/guide/how-it-works) first for the conceptual model; this
page is the API reference.

## Types

### Measurements

`PriorityPlusMeasurements` is the raw input to the pure calculation:

| Field | Type | Description |
| --- | --- | --- |
| `itemWidths` | `number[]` | Width of each item, in source order. |
| `itemGap` | `number` | Gap between adjacent primary items. |
| `containerGap` | `number` | Gap between the primary list and the toggle. |
| `toggleWidth` | `number` | Width of the toggle when visible. |
| `available` | `number` | Inline space available for the primary list + toggle. |

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

## Pure calculation

### `calculateVisibleCount(measurements)`

Returns how many leading items fit. Pure, no DOM:

```ts
import { calculateVisibleCount } from "@priority-plus/core";

const visible = calculateVisibleCount({
  itemWidths: [80, 120, 95, 110],
  itemGap: 8,
  containerGap: 8,
  toggleWidth: 64,
  available: 300,
});
```

### `resolveVisibleCount(measurements, options?)`

Like `calculateVisibleCount` but applies `collapseAtCount`. Use this rather than
`calculateVisibleCount` if you support that option.

## State helpers

### `createPriorityPlusState(itemCount?)`

Build an initial all-visible state — useful as a render default before the first
measurement.

### `getPriorityPlusState(measurements, options?)`

Resolve measurements straight into a `PriorityPlusState`.

### `partitionItems(items, visibleCount)`

Split your item array into `{ visibleItems, overflowItems }`:

```ts
import { partitionItems } from "@priority-plus/core";

const { visibleItems, overflowItems } = partitionItems(items, state.visibleCount);
```

## `PriorityPlusLayoutController`

Stateful wrapper that caches measurements and the container width and tracks what
changed between layouts. This is what adapters hold onto.

```ts
import { PriorityPlusLayoutController } from "@priority-plus/core";

const controller = new PriorityPlusLayoutController(options, itemCount);
```

| Member | Description |
| --- | --- |
| `getState()` | The current `PriorityPlusState`. |
| `hasMeasurements` | Whether measurements have been cached yet. |
| `setMeasurements(measurements, containerInlineSize)` | Cache fresh widths + width, recalculate. Use when content changed. |
| `setContainerInlineSize(size)` | Update only the available width and recalculate, reusing cached widths. Use for plain resizes. |
| `setOptions(options)` | Swap options (e.g. `collapseAtCount`) and recalculate. |
| `reset(itemCount?)` | Drop cached measurements and reset to an all-visible state. |

Each mutating call returns a `PriorityPlusLayoutResult`:

| Field | Type | Description |
| --- | --- | --- |
| `state` | `PriorityPlusState` | The new state. |
| `previousState` | `PriorityPlusState` | The state before this call. |
| `visibleCountChanged` | `boolean` | — |
| `overflowCountChanged` | `boolean` | — |
| `itemCountChanged` | `boolean` | — |
| `measurementsChanged` | `boolean` | Whether widths were re-read. |

Note the controller works with `PriorityPlusCachedMeasurements` — the same shape
as `PriorityPlusMeasurements` but **without** `available`, plus a
`primaryNonContentInlineSize` (the primary list's own padding/border/margin).
The controller computes `available` from the container width minus that value.
`readCachedMeasurements` (below) produces this shape for you.

## `createPriorityPlusEngine`

Owns the "re-measure vs. reuse" decision and coalesces layouts into animation
frames. You provide three DOM-facing hooks; it calls them at the right time.

```ts
import {
  createPriorityPlusEngine,
  PriorityPlusLayoutController,
} from "@priority-plus/core";
import { contentInlineSize, readCachedMeasurements } from "@priority-plus/core/dom";

const controller = new PriorityPlusLayoutController();

const engine = createPriorityPlusEngine({
  controller,
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
```

| Option | Type | Description |
| --- | --- | --- |
| `controller` | `PriorityPlusLayoutController` | The controller to drive. Must outlive the engine. |
| `readMeasurements` | `() => PriorityPlusCachedMeasurements \| null \| undefined` | Read fresh widths. Return nullish to abort (e.g. elements not mounted). |
| `getContainerInlineSize` | `() => number \| null \| undefined` | The width available to the primary list. Read after `readMeasurements`. Nullish aborts. |
| `onResult` | `(result: PriorityPlusLayoutResult) => void` | Apply a computed layout. |
| `requestFrame` / `cancelFrame` | functions | Override frame primitives (mainly for tests). Default to `requestAnimationFrame`. |

The returned engine has:

| Method | Description |
| --- | --- |
| `layout({ refreshMeasurements? })` | Run a layout synchronously. |
| `schedule({ refreshMeasurements? })` | Coalesce a layout into the next frame. Bursts collapse to one run; if **any** caller asked to refresh, widths are re-read. |
| `cancel()` | Drop a pending scheduled layout. |

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

### `inlineGap(element)`

The element's resolved `column-gap` (falling back to `gap`), in pixels.

### `nonContentInlineSize(element)`

The element's horizontal margin + border + padding — i.e. everything that isn't
content box, used to translate a container width into space available for items.

## Building an adapter

The recipe every official adapter follows:

1. Render the navigation **and** a hidden measurer containing the full item list
   plus a toggle.
2. Create a `PriorityPlusLayoutController` and a `createPriorityPlusEngine` wired
   to your elements via `readCachedMeasurements` and `contentInlineSize`.
3. `engine.layout({ refreshMeasurements: true })` on mount and whenever items
   change; `engine.schedule()` from a `ResizeObserver`; re-measure on
   `document.fonts.ready`.
4. In `onResult`, use `partitionItems` (or the controller's state) to render the
   visible/overflow split.
5. `engine.cancel()` and disconnect observers on teardown.

The [React hook](/adapters/react#usepriorityplus) and the
[Svelte component](/adapters/svelte) are the clearest worked examples — both are
small enough to read end to end.
