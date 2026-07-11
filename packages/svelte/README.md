# @priority-plus/svelte

Svelte 5 adapter for the [Priority+ navigation
pattern](https://css-tricks.com/the-priority-navigation-pattern/): items that
don't fit move into an overflow menu behind a toggle, recalculated as the
container resizes. The first measured layout commits **before paint**, so
client renders never flash an unfitted nav.

```sh
npm install @priority-plus/svelte
```

Requires Svelte 5+.

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

<PriorityPlus {items}>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
```

An optional `toggle` snippet customises the overflow toggle, and the
`class` / `primaryClass` / `overflowClass` / `itemClass` / `toggleClass` props
style the slots.

For SSR (SvelteKit included), the optional `@priority-plus/core/prelayout`
pass (~1&nbsp;kB, render-blocking) fits the server-rendered markup before
first paint — see the
[server rendering guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/guide/ssr.md),
which includes a SvelteKit recipe.

## Documentation

Full docs — props, snippets, styling, options — live in the
[repository](https://github.com/jayfreestone/priority-plus): see the
[Svelte adapter guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/adapters/svelte.md).

## License

[ISC](./LICENSE)
