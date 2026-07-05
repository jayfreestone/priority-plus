<script lang="ts">
  import { priorityPlusBrowserItems } from "../../../test/priority-plus-browser-behavior.js";
  import PriorityPlus from "../src/PriorityPlus.svelte";
</script>

<PriorityPlus
  aria-label="Main"
  class="test-nav"
  primaryClass="test-list"
  overflowClass="test-overflow"
  itemClass="test-item"
  toggleClass="test-toggle"
  items={priorityPlusBrowserItems}
>
  {#snippet children(item)}
    <a class="test-link" href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>
