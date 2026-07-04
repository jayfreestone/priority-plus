# Options

All adapters share the same core options, defined by
`PriorityPlusOptions` in [`@priority-plus/core`](/adapters/core). They're passed
idiomatically per adapter — as props, as hook options, or as attributes — but
the behaviour is identical everywhere.

## `collapseAtCount`

- **Type:** `number`
- **Default:** `undefined` (disabled)

Collapse **every** item into overflow when the number of items that would
otherwise fit is less than or equal to this value. This avoids leaving one or
two orphaned items in the primary list next to a "More" toggle — sometimes it
looks better to show just the toggle.

For example, with `collapseAtCount={1}`, if only a single item would fit, the
primary list is emptied and all items move to overflow instead.

Collapsing only kicks in when there is genuine overflow — if everything fits,
all items stay visible regardless of this value.

::: code-group

```tsx [React]
<PriorityPlus items={items} collapseAtCount={1}>
  {(item) => <a href={item.href}>{item.label}</a>}
</PriorityPlus>
```

```svelte [Svelte]
<PriorityPlus {items} collapseAtCount={1}>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
```

```html [Custom Element]
<priority-plus collapse-at-count="1">
  <!-- ... -->
</priority-plus>
```

```ts [Core]
const session = createPriorityPlusSession({
  options: { collapseAtCount: 1 },
  // ...hooks
});

// Or at runtime, against cached measurements:
session.setOptions({ collapseAtCount: 1 });
```

:::

All adapters react to this option changing at runtime — update the prop /
attribute and the layout recalculates without re-measuring.
