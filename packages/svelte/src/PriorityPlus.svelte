<script lang="ts" generics="Item">
  import {
    createPriorityPlusState,
    createPriorityPlusFrameScheduler,
    partitionItems,
    PriorityPlusLayoutController,
    type PriorityPlusCachedMeasurements,
    type PriorityPlusOptions,
    type PriorityPlusScheduleOptions,
    type PriorityPlusState,
  } from "@priority-plus/core";
  import type { Snippet } from "svelte";
  import { onMount, tick } from "svelte";

  import {
    contentInlineSize,
    inlineGap,
    nonContentInlineSize,
  } from "@priority-plus/core/dom";

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
    throttleMs?: number;
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
    throttleMs = 50,
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
  const controller = new PriorityPlusLayoutController();
  const scheduler = createPriorityPlusFrameScheduler((request) => {
    update(request);
  });

  function readMeasurements(): PriorityPlusCachedMeasurements | null {
    if (!container || !primary || !measureList || !measureToggle) return null;

    return {
      itemWidths: Array.from(measureList.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .map((item) => item.getBoundingClientRect().width),
      itemGap: inlineGap(measureList),
      containerGap: inlineGap(container),
      toggleWidth: measureToggle.getBoundingClientRect().width,
      primaryNonContentInlineSize: nonContentInlineSize(primary),
    };
  }

  async function update({
    refreshMeasurements = true,
  }: PriorityPlusScheduleOptions = {}) {
    await tick();

    if (!container) return;

    const containerInlineSize = contentInlineSize(container);
    const result =
      refreshMeasurements || !controller.hasMeasurements
        ? (() => {
            const measurements = readMeasurements();
            return measurements === null
              ? null
              : controller.setMeasurements(measurements, containerInlineSize);
          })()
        : controller.setContainerInlineSize(containerInlineSize);

    if (result === null) return;

    layout = result.state;

    if (result.shouldCloseOverflow) {
      open = false;
    }
  }

  $effect(() => {
    items.length;
    layout = controller.reset(items.length).state;
    update({ refreshMeasurements: true });
  });

  $effect(() => {
    collapseAtCount;
    layout = controller.setOptions(coreOptions).state;
  });

  onMount(() => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => scheduler.schedule());
    observer.observe(container);
    document.fonts?.ready.then(() => update({ refreshMeasurements: true }));

    return () => {
      scheduler.cancel();
      observer.disconnect();
    };
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
