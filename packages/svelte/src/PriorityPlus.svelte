<script lang="ts" generics="Item">
  import {
    createPriorityPlusState,
    createPriorityPlusSession,
    defaultToggleLabel,
    partitionItems,
    presentToggle,
    widestToggleState,
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
  let view = $derived(presentToggle(open, layout));
  // The hidden measurer renders the toggle as if every item overflowed, so the
  // fit calculation always reserves room for the toggle at its widest.
  let measureState = $derived(widestToggleState(items.length));

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

  // Elements whose intrinsic size feeds the fit calculation: a resize of any
  // measurer element (an item's content grew, the toggle label changed) must
  // re-measure, unlike the container, whose resize reuses cached measurements.
  function measures(node: HTMLElement) {
    session.observe(node, { refreshOnResize: true });
    return {
      destroy: () => session.unobserve(node),
    };
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
    aria-expanded={view.expanded}
    class={toggleClass}
    hidden={view.toggleHidden}
    type="button"
    onclick={() => (open = !open)}
  >
    {#if toggle}
      {@render toggle(layout)}
    {:else}
      {defaultToggleLabel(layout)}
    {/if}
  </button>

  {#if !view.overflowHidden}
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
    <ul class={primaryClass} bind:this={measureList} use:measures>
      {#each items as item, index}
        <li class={itemClass} use:measures>
          {@render children(item, index)}
        </li>
      {/each}
    </ul>
    <button class={toggleClass} bind:this={measureToggle} use:measures>
      {#if toggle}
        {@render toggle(measureState)}
      {:else}
        {defaultToggleLabel(measureState)}
      {/if}
    </button>
  </div>
</nav>
