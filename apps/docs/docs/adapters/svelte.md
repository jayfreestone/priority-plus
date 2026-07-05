# Svelte

A single Svelte 5 component built on runes. It renders the navigation, manages
the overflow menu's open state, and re-measures when needed.

```sh
npm install @priority-plus/svelte
```

Svelte `>=5` is a peer dependency. The component uses runes, so it requires a
Svelte 5 project.

## Usage

```svelte
<script lang="ts">
  import { PriorityPlus } from "@priority-plus/svelte";

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/reports", label: "Reports" },
  ];
</script>

<PriorityPlus
  {items}
  aria-label="Main"
  class="nav"
  primaryClass="nav-list"
  overflowClass="nav-overflow"
>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
```

The `children` snippet is rendered for every item — in the primary list, the
overflow list, and the hidden measurer.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly Item[]` | — | The full list of items, in source order. |
| `children` | `Snippet<[Item, number]>` | — | Snippet rendered per item, receiving the item and its index. |
| `toggle` | `Snippet<[PriorityPlusToggleState]>` | `` `More (n)` `` | Snippet for the toggle contents, receiving the layout [state](/adapters/core#state) plus `open`. |
| `collapseAtCount` | `number` | `undefined` | See [Options](/guide/options). |
| `class` | `string` | `undefined` | Class for the container `<nav>`. |
| `primaryClass` | `string` | `undefined` | Class for the primary `<ul>`. |
| `overflowClass` | `string` | `undefined` | Class for the overflow `<ul>`. |
| `itemClass` | `string` | `undefined` | Class for each `<li>`. |
| `toggleClass` | `string` | `undefined` | Class for the toggle `<button>`. |
| `measurerClass` | `string` | `undefined` | Class for the hidden measurer `<div>`. |

Any other attributes (`aria-label`, `id`, `data-*`, …) are spread onto the
`<nav>`. Its accessible name defaults to `"Priority navigation"`.

The component is generic over the item type via
`generics="Item"`, so `item` in your snippet is fully typed.

## Custom toggle content

Provide a `toggle` snippet to control what the button renders. It receives the
current layout [state](/adapters/core#state) plus `open`, whether the overflow
list is currently open:

```svelte
<PriorityPlus {items}>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}

  {#snippet toggle(state)}
    {state.open ? "Close" : `More (${state.overflowCount})`}
  {/snippet}
</PriorityPlus>
```

When omitted, the toggle renders `More (n)`.

## Re-measuring

The component re-measures automatically:

- when `items` changes (it waits for Svelte to flush DOM updates with `tick()`
  before measuring),
- on container resize via a `ResizeObserver`,
- when the hidden measurer resizes — which is how late-loading web fonts are
  picked up.

For plain resizes it reuses cached widths; when `items` changes it re-reads them.
See [How It Works](/guide/how-it-works) for the underlying mechanics.

For content changes Svelte cannot see, the component instance exposes
`update()`:

```svelte
<PriorityPlus bind:this={nav} {items}>…</PriorityPlus>
<button onclick={() => nav.update()}>Re-measure</button>
```

## Server rendering

The component SSRs as the optimistic all-visible state and hydrates cleanly —
the first measured layout commits before paint. To avoid the pre-hydration
flash on slow connections, pair the server output with the render-blocking
[prelayout pass](/guide/ssr); the component stamps the markup contract and the
`data-priority-plus-enhanced` attribute it needs automatically.

## Exported types

For convenience the package re-exports the core types so you can annotate your
own code without depending on `@priority-plus/core` directly:

```ts
import type {
  PriorityPlusOptions,
  PriorityPlusState,
  PriorityPlusToggleState,
} from "@priority-plus/svelte";
```

## Styling

See the [Styling guide](/guide/styling) for the slot structure and the CSS rules
the pattern needs.
