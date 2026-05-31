# Styling

`priority-plus` ships **no CSS**. You own the markup's appearance through
class-name slots (React / Svelte) or your own selectors (custom element). This
page covers the structure every adapter renders and the few rules that matter
for the pattern to work.

## The rendered structure

Every adapter produces the same logical layout:

```
<nav>                       ← container        (className / class)
  <ul>                      ← primary list     (primaryClassName / primaryClass)
    <li>…</li>              ← item             (itemClassName / itemClass)
  </ul>
  <button>More (n)</button> ← overflow toggle  (toggleClassName / toggleClass)
  <ul>…</ul>                ← overflow list    (overflowClassName / overflowClass)
  <div aria-hidden>…</div>  ← hidden measurer  (measurerClassName / measurerClass)
</nav>
```

| Slot | React prop | Svelte prop | Custom element |
| --- | --- | --- | --- |
| Container `<nav>` | `className` | `class` | your `<priority-plus>` / `<nav>` |
| Primary `<ul>` | `primaryClassName` | `primaryClass` | `[data-priority-plus-primary]` |
| Overflow `<ul>` | `overflowClassName` | `overflowClass` | `[data-priority-plus-overflow]` |
| Item `<li>` | `itemClassName` | `itemClass` | your own `<li>` |
| Toggle `<button>` | `toggleClassName` | `toggleClass` | `[data-priority-plus-toggle]` |
| Measurer `<div>` | `measurerClassName` | `measurerClass` | n/a (no measurer) |

::: tip
The custom element measures your *real* markup in place rather than rendering a
separate measurer, so it has no measurer slot. See its
[page](/adapters/custom-element) for details.
:::

## The one rule that matters

The primary list must lay items out **on a single line** so their widths sum the
way the fit calculation expects. Use flexbox (or inline-block), and **do not let
items wrap**:

```css
.nav-list {
  display: flex;
  flex-wrap: nowrap; /* important: wrapping breaks the measurement */
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
```

The core reads the list's `column-gap` (or `gap`) to account for spacing between
items, so set the gap on the list itself rather than with margins on items where
possible.

## A complete example

::: code-group

```css [React / Svelte]
.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;          /* gap between the primary list and the toggle */
}

.nav-list,
.nav-overflow {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-list {
  flex-wrap: nowrap;
}

.nav-overflow {
  position: absolute;   /* float the overflow menu over the page */
  flex-direction: column;
  margin-top: 0.5rem;
}
```

```css [Custom element]
priority-plus nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

[data-priority-plus-primary],
[data-priority-plus-overflow] {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

[data-priority-plus-primary] {
  flex-wrap: nowrap;
}

[data-priority-plus-overflow] {
  position: absolute;
  flex-direction: column;
}
```

:::

Wire the classes up (React shown):

```tsx
<PriorityPlus
  className="nav"
  primaryClassName="nav-list"
  overflowClassName="nav-overflow"
  items={items}
>
  {(item) => <a href={item.href}>{item.label}</a>}
</PriorityPlus>
```

## Keep the toggle width stable

The fit calculation reserves space for the toggle at its widest. If your toggle
content changes width as the overflow count changes (e.g. `More (9)` vs
`More (12)`), give it a stable width or you may see a one-item flicker on resize:

```css
.nav-toggle {
  min-width: 6ch;
}
```

The React and Svelte adapters render the measurer's toggle as if **every** item
overflowed, so the reserved width already assumes the largest count. The custom
element measures your real toggle — if you render a dynamic count into it, call
`refresh()` after updating it, or give the toggle a fixed width.

## Open / closed state

The toggle reflects its state with `aria-expanded`, and the overflow list is
toggled with the `hidden` attribute. Style the open state with:

```css
.nav-toggle[aria-expanded="true"] {
  /* active styles */
}
```
