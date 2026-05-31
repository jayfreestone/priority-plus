<script lang="ts">
  import { PriorityPlus } from "@priority-plus/svelte";

  let {
    items,
  }: {
    items: Array<{ href: string; label: string }>;
  } = $props();
</script>

<PriorityPlus
  ariaLabel="Svelte"
  class="priority-nav"
  primaryClass="priority-nav__list"
  overflowClass="priority-nav__overflow"
  itemClass="priority-nav__item"
  toggleClass="priority-nav__toggle"
  {items}
>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
