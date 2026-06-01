<script lang="ts" generics="Item">
  import {
    createPriorityPlusState,
    createPriorityPlusSession,
    partitionItems,
    contentInlineSize,
    readCachedMeasurements,
    type PriorityPlusCachedMeasurements,
    type PriorityPlusOptions,
    type PriorityPlusState,
  } from "./internal/runtime.js";
  import type { Snippet } from "svelte";
  import { onMount, tick } from "svelte";

  interface PriorityPlusProps<Item> extends PriorityPlusOptions {
    items: readonly Item[];
    children: Snippet<[Item, number]>;
    toggle?: Snippet<[PriorityPlusState]>;
    ariaLabel?: string;
    class?: string;
    primaryClass?: string;
    overflowClass?: string;
    itemClass?: string;
    toggleClass?: string;
    measurerClass?: string;
  }

  let {
    items,
    children,
    toggle,
    ariaLabel = "Priority navigation",
    class: className = "",
    primaryClass = "",
    overflowClass = "",
    itemClass = "",
    toggleClass = "",
    measurerClass = "",
    collapseAtCount,
  }: PriorityPlusProps<Item> = $props();

  let container: HTMLElement;
  let primary: HTMLElement;
  let measureList: HTMLElement;
  let measureToggle: HTMLElement;
  let open: boolean = $state(false);
  let layout: PriorityPlusState = $state(createPriorityPlusState(0));
  let partitioned = $derived(partitionItems(items, layout.visibleCount));

  const coreOptions = $derived({ collapseAtCount });
  const session = createPriorityPlusSession({
    readMeasurements,
    getContainerInlineSize: () =>
      container ? contentInlineSize(container) : null,
    onResult: (result) => {
      layout = result.state;
      if (result.state.allVisible) open = false;
    },
  });

  function readMeasurements(): PriorityPlusCachedMeasurements | null {
    if (!container || !primary || !measureList || !measureToggle) return null;

    return readCachedMeasurements({
      items: measureList.children,
      itemGapSource: measureList,
      container,
      toggle: measureToggle,
      primary,
    });
  }

  // Wait for Svelte to flush pending DOM updates before measuring, then defer
  // the measure/resize decision to the shared session.
  async function update() {
    await tick();
    session.layout({ refreshMeasurements: true });
  }

  $effect(() => {
    items.length;
    layout = session.reset(items.length).state;
    update();
  });

  $effect(() => {
    collapseAtCount;
    layout = session.setOptions(coreOptions).state;
  });

  onMount(() => {
    session.observe(container);
    session.refreshOnFontLoad();

    return () => session.destroy();
  });
</script>

<svelte:options runes={true} />

<nav aria-label={ariaLabel} class={className} bind:this={container}>
  <ul class={primaryClass} bind:this={primary}>
    {#each partitioned.visibleItems as item, index}
      <li class={itemClass}>
        {@render children(item, index)}
      </li>
    {/each}
  </ul>

  <button
    aria-expanded={open}
    class={toggleClass}
    hidden={layout.allVisible}
    type="button"
    onclick={() => (open = !open)}
  >
    {#if toggle}
      {@render toggle(layout)}
    {:else}
      More ({layout.overflowCount})
    {/if}
  </button>

  {#if open && !layout.allVisible}
    <ul class={overflowClass}>
      {#each partitioned.overflowItems as item, index}
        <li class={itemClass}>
          {@render children(item, layout.visibleCount + index)}
        </li>
      {/each}
    </ul>
  {/if}

  <div
    aria-hidden="true"
    class={measurerClass}
    style="contain: layout; height: 0; left: 0; overflow: hidden; pointer-events: none; position: absolute; top: 0; visibility: hidden; width: max-content;"
  >
    <ul class={primaryClass} bind:this={measureList}>
      {#each items as item, index}
        <li class={itemClass}>
          {@render children(item, index)}
        </li>
      {/each}
    </ul>
    <button class={toggleClass} bind:this={measureToggle}>
      {#if toggle}
        {@render toggle(layout)}
      {:else}
        More ({Math.max(1, items.length)})
      {/if}
    </button>
  </div>
</nav>
