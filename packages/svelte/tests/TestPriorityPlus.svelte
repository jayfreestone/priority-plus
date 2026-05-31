<script lang="ts">
  import PriorityPlus from "../src/PriorityPlus.svelte";

  const items = [
    { href: "#dashboard", label: "Dashboard" },
    { href: "#projects", label: "Projects" },
    { href: "#roadmap", label: "Roadmap" },
    { href: "#integrations", label: "Integrations" },
  ];
</script>

<PriorityPlus
  ariaLabel="Main"
  class="test-nav"
  primaryClass="test-list"
  overflowClass="test-overflow"
  itemClass="test-item"
  toggleClass="test-toggle"
  {items}
>
  {#snippet children(item)}
    <a class="test-link" href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>

<style>
  :global(.test-nav) {
    display: flex;
    gap: 8px;
    position: relative;
    width: 260px;
  }

  :global(.test-list) {
    display: flex;
    flex: 0 1 auto;
    gap: 8px;
    list-style: none;
    margin: 0;
    min-width: 0;
    padding: 0;
  }

  :global(.test-item) {
    flex: 0 0 auto;
    width: 96px;
  }

  :global(.test-link) {
    display: block;
    width: 96px;
  }

  :global(.test-toggle) {
    flex: 0 0 auto;
    width: 72px;
  }

  :global(.test-overflow) {
    display: flex;
  }
</style>
