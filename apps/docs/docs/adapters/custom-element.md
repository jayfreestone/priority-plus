# Custom Element

The `priority-plus` package is a custom element designed for **progressive
enhancement**. You write ordinary server-rendered navigation markup; the element
enhances it in place. If the script never loads, the markup is still a perfectly
usable list of links.

```sh
npm install priority-plus
```

Unlike the React and Svelte adapters, this one doesn't render or own your
markup — it observes and rearranges the elements you provide.

## Usage

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
  import "priority-plus";
</script>
```

Importing the package auto-registers the `<priority-plus>` element. On connect it
finds your elements, measures them, and moves overflowing items from the primary
list into the overflow list.

## Required markup

The element locates its parts by data attribute. All three are required:

| Attribute | Element | Role |
| --- | --- | --- |
| `data-priority-plus-primary` | `<ul>` | The primary list. Put **all** your items here initially. |
| `data-priority-plus-overflow` | `<ul>` | The overflow list. Leave it empty (and `hidden`). |
| `data-priority-plus-toggle` | `<button>` | The "More" toggle. Mark it `hidden`; the element shows it when needed. |

The container that gets measured is the **parent of the primary list** (the
`<nav>` in the example). Items are measured in place — there is no separate
hidden measurer — so your real markup is the source of truth.

::: tip Progressive enhancement
Start with everything in the primary list and the toggle + overflow list
`hidden`. With no JavaScript, users see a complete list of links and never see an
empty overflow menu or a dead toggle.
:::

## Attributes

| Attribute | Type | Description |
| --- | --- | --- |
| `collapse-at-count` | number | See [Options](/guide/options). Reflected live via `attributeChangedCallback`. |

```html
<priority-plus collapse-at-count="1"> … </priority-plus>
```

## Properties

The element exposes read-only accessors mirroring the layout
[state](/adapters/core#state):

| Property | Type | Description |
| --- | --- | --- |
| `itemCount` | `number` | Total number of items. |
| `visibleCount` | `number` | Items currently in the primary list. |
| `overflowCount` | `number` | Items currently in the overflow list. |
| `allVisible` | `boolean` | Whether nothing is overflowing. |
| `open` | `boolean` | Whether the overflow menu is open. |
| `state` | `Readonly<PriorityPlusState>` | A snapshot of the full state object. |

```js
const nav = document.querySelector("priority-plus");
console.log(nav.overflowCount, nav.allVisible);
```

## Methods

### `refresh()`

Re-syncs structure and forces a fresh measurement. Call it after changing item
content or any styling that affects intrinsic widths — for instance after
rendering a dynamic count into the toggle.

```js
document.querySelector("priority-plus").refresh();
```

You usually don't need this for adding or removing `<li>` items: the element runs
a `MutationObserver` over its subtree and re-syncs automatically when children
change.

## Events

### `priority-plus:overflow-count-change`

Dispatched whenever `overflowCount` changes. The event
(`PriorityPlusOverflowCountChangeEvent`) bubbles and is composed, and carries:

| Field | Type | Description |
| --- | --- | --- |
| `overflowCount` | `number` | The new overflow count. |
| `previousOverflowCount` | `number` | The previous overflow count. |
| `state` | `Readonly<PriorityPlusState>` | The new state. |
| `previousState` | `Readonly<PriorityPlusState>` | The previous state. |

A common use is rendering the count into the toggle:

```html
<script type="module">
  import { PriorityPlusOverflowCountChangeEvent } from "priority-plus";

  const nav = document.querySelector("priority-plus");
  const count = nav.querySelector("[data-overflow-count]");

  function renderCount(overflowCount = nav.overflowCount) {
    count.textContent = overflowCount > 0 ? `(${overflowCount})` : "";
  }

  nav.addEventListener(
    PriorityPlusOverflowCountChangeEvent.eventName,
    (event) => renderCount(event.overflowCount),
  );
  renderCount();
</script>
```

::: warning Toggle width and dynamic counts
Because the element measures your real toggle, changing its content can change
its intrinsic width and shift the fit calculation. If custom count rendering
changes the toggle width, give the toggle a stable width or call `refresh()`
after rendering the count. See [Styling](/guide/styling#keep-the-toggle-width-stable).
:::

## Custom element name

Importing the package registers `<priority-plus>` automatically. To register
under a different tag name, use the exported helper instead:

```js
import { definePriorityPlusElement, PriorityPlusElement } from "priority-plus";

definePriorityPlusElement("site-nav"); // <site-nav> … </site-nav>
```

`definePriorityPlusElement` is idempotent — if the name is already defined it
returns the existing constructor rather than throwing. Each name is registered
with its own subclass (a constructor can only be registered once per registry),
and every instance is still an `instanceof PriorityPlusElement`.
`PriorityPlusElement` is exported too if you want to subclass it yourself.

## Server rendering

The required markup **is** the server-rendered / no-JS state: all items in the
primary list, toggle and overflow hidden. The element doesn't use the
[prelayout pass](/guide/ssr) — it has no hidden measurer — but it reflects the
same `data-priority-plus-enhanced` attribute on itself once it has measured, so
you can style the un-enhanced paint:

```css
priority-plus:not([data-priority-plus-enhanced]) [data-priority-plus-primary] {
  flex-wrap: nowrap;
  overflow: clip; /* pre-enhancement, items that don't fit are cut off, not wrapped */
}
```

## Lifecycle and automatic behaviour

- **Connect** — finds elements, measures, and applies the initial layout.
- **`MutationObserver`** — watches the subtree and re-syncs when items change.
- **`ResizeObserver`** — re-lays-out (reusing cached widths) on container resize.
- **`document.fonts.ready`** — re-measures once fonts have loaded.
- **Disconnect** — disconnects observers and cancels any pending layout.

## Styling

See the [Styling guide](/guide/styling) for the slot structure and the CSS rules
the pattern needs. With the custom element you style your own elements via the
`data-priority-plus-*` attributes or your own classes.
