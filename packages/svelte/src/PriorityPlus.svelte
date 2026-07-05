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
    type PriorityPlusToggleState,
  } from "./internal/runtime.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { onMount, tick } from "svelte";

  interface PriorityPlusProps<Item>
    extends PriorityPlusOptions,
      Omit<HTMLAttributes<HTMLElement>, "children"> {
    items: readonly Item[];
    children: Snippet<[Item, number]>;
    toggle?: Snippet<[PriorityPlusToggleState]>;
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
    "aria-label": ariaLabel = "Priority navigation",
    class: className,
    primaryClass,
    overflowClass,
    itemClass,
    toggleClass,
    measurerClass,
    collapseAtCount,
    ...rest
  }: PriorityPlusProps<Item> = $props();

  let container: HTMLElement;
  let primary: HTMLElement;
  let measureList: HTMLElement;
  let measureToggle: HTMLElement;
  let open: boolean = $state(false);
  // Optimistic all-visible seed: SSR and the pre-measurement render show every
  // item in the primary list.
  // svelte-ignore state_referenced_locally
  let layout: PriorityPlusState = $state(createPriorityPlusState(items.length));
  let partitioned = $derived(partitionItems(items, layout.visibleCount));
  let view = $derived(presentToggle(open, layout));
  let toggleState: PriorityPlusToggleState = $derived({ ...layout, open });
  // The hidden measurer renders the toggle as if every item overflowed, so the
  // fit calculation always reserves room for the toggle at its widest.
  let measureState: PriorityPlusToggleState = $derived({
    ...widestToggleState(items.length),
    open: false,
  });

  const itemCount = $derived(items.length);
  const coreOptions = $derived({ collapseAtCount });
  // Initial construction values only — later changes flow through the
  // session.reset/setOptions effects below.
  // svelte-ignore state_referenced_locally
  const session = createPriorityPlusSession({
    itemCount: items.length,
    options: { collapseAtCount },
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

  /**
   * Force a re-measure and relayout — reachable on the component instance via
   * `bind:this` for content changes Svelte cannot see. Waits for Svelte to
   * flush pending DOM updates before measuring, then defers the
   * measure/resize decision to the shared session.
   */
  export async function update() {
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

  // Only a change in item count invalidates the committed layout; same-length
  // item swaps re-measure below without an interim all-visible reset.
  $effect(() => {
    session.reset(itemCount);
  });

  $effect(() => {
    // update() only reads the DOM after an await, so the dependency on the
    // items must be declared here.
    void items;
    update();
  });

  $effect(() => {
    session.setOptions(coreOptions);
  });

  onMount(() => {
    session.observe(container);

    return () => session.destroy();
  });
</script>

<svelte:options runes={true} />

<!--
  The data-priority-plus-* attributes are the prelayout contract: `collapse-at`
  lets a render-blocking prelayout pass read the option from the DOM, and
  `enhanced` appears with the first measured layout, neutralising any styles
  that pass injected.
-->
<nav
  {...rest}
  aria-label={ariaLabel}
  class={className}
  data-priority-plus-collapse-at={collapseAtCount}
  data-priority-plus-enhanced={layout.measured ? "" : undefined}
  bind:this={container}
>
  <ul class={primaryClass} data-priority-plus-primary="" bind:this={primary}>
    {#each partitioned.visibleItems as item, index}
      <li class={itemClass}>
        {@render children(item, index)}
      </li>
    {/each}
  </ul>

  <button
    aria-expanded={view.expanded}
    class={toggleClass}
    data-priority-plus-toggle=""
    hidden={view.toggleHidden}
    type="button"
    onclick={() => (open = !open)}
  >
    {#if toggle}
      {@render toggle(toggleState)}
    {:else}
      {defaultToggleLabel(toggleState)}
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
    data-priority-plus-measurer=""
    style="contain: layout; height: 0; left: 0; overflow: hidden; pointer-events: none; position: absolute; top: 0; visibility: hidden; width: max-content;"
  >
    <ul
      class={primaryClass}
      data-priority-plus-primary=""
      bind:this={measureList}
      use:measures
    >
      {#each items as item, index}
        <li class={itemClass} use:measures>
          {@render children(item, index)}
        </li>
      {/each}
    </ul>
    <button
      type="button"
      class={toggleClass}
      data-priority-plus-toggle=""
      bind:this={measureToggle}
      use:measures
    >
      {#if toggle}
        {@render toggle(measureState)}
      {:else}
        {defaultToggleLabel(measureState)}
      {/if}
    </button>
  </div>
</nav>
