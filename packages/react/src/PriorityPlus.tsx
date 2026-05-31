import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type Dispatch,
  type HTMLAttributes,
  type ReactNode,
  type RefCallback,
  type RefObject,
  type SetStateAction,
} from "react";
import type { PriorityPlusState } from "@priority-plus/core";

import {
  usePriorityPlus,
  type UsePriorityPlusOptions,
  type UsePriorityPlusResult,
} from "./usePriorityPlus";

const measurerStyle: HTMLAttributes<HTMLDivElement>["style"] = {
  contain: "layout",
  height: 0,
  left: 0,
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  visibility: "hidden",
  width: "max-content",
};

export type PriorityPlusRender<Props, State> = (
  props: Props,
  state: State,
) => ReactNode;

type RenderChildren<State> = ReactNode | ((state: State) => ReactNode);

export type PriorityPlusItemPlacement = "measure" | "overflow" | "primary";

interface RegisteredPriorityPlusItem {
  descriptorRef: RefObject<PriorityPlusItemDescriptor>;
  id: string;
  order: number;
}

interface PriorityPlusItemRegistration
  extends Omit<RegisteredPriorityPlusItem, "order"> {
  order?: number;
}

interface RegisteredPriorityPlusPrimary {
  descriptorRef: RefObject<PriorityPlusPrimaryDescriptor>;
  id: string;
}

interface RegisteredPriorityPlusTrigger {
  descriptorRef: RefObject<PriorityPlusTriggerDescriptor>;
  id: string;
}

interface PriorityPlusItemDescriptor {
  children?: RenderChildren<PriorityPlusItemRenderState>;
  render?: PriorityPlusRender<
    PriorityPlusItemRenderProps,
    PriorityPlusItemRenderState
  >;
}

interface PriorityPlusPrimaryDescriptor {
  children?: ReactNode;
  props: Omit<PriorityPlusPrimaryRenderProps, "children" | "ref">;
  render?: PriorityPlusRender<
    PriorityPlusPrimaryRenderProps,
    PriorityPlusPrimaryRenderState
  >;
}

interface PriorityPlusTriggerDescriptor {
  children?: RenderChildren<PriorityPlusTriggerRenderState>;
  props: Omit<
    PriorityPlusTriggerRenderProps,
    "aria-expanded" | "children" | "hidden" | "onClick" | "ref" | "type"
  >;
  render?: PriorityPlusRender<
    PriorityPlusTriggerRenderProps,
    PriorityPlusTriggerRenderState
  >;
}

interface PriorityPlusContextValue {
  itemIndexById: Map<string, number>;
  open: boolean;
  overflowItemIds: Set<string>;
  primary: RegisteredPriorityPlusPrimary | null;
  priority: UsePriorityPlusResult<RegisteredPriorityPlusItem>;
  registerItem: (
    item: PriorityPlusItemRegistration,
  ) => () => void;
  registerPrimary: (
    primary: RegisteredPriorityPlusPrimary,
  ) => () => void;
  registerTrigger: (
    trigger: RegisteredPriorityPlusTrigger,
  ) => () => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
  trigger: RegisteredPriorityPlusTrigger | null;
  visibleItemIds: Set<string>;
}

export interface PriorityPlusRootRenderState extends PriorityPlusState {
  open: boolean;
  overflowOpen: boolean;
  update: () => void;
}

export interface PriorityPlusRootRenderProps
  extends HTMLAttributes<HTMLElement> {
  ref: RefCallback<HTMLElement>;
}

export interface PriorityPlusRootProps
  extends Omit<HTMLAttributes<HTMLElement>, "children">,
    UsePriorityPlusOptions {
  "aria-label"?: string;
  children?: ReactNode;
  render?: PriorityPlusRender<
    PriorityPlusRootRenderProps,
    PriorityPlusRootRenderState
  >;
}

export interface PriorityPlusPrimaryRenderState extends PriorityPlusState {
  open: boolean;
  overflowOpen: boolean;
  placement: "measure" | "primary";
}

export interface PriorityPlusPrimaryRenderProps
  extends HTMLAttributes<HTMLUListElement> {
  ref: RefCallback<HTMLUListElement>;
}

export interface PriorityPlusPrimaryProps
  extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  children?: ReactNode;
  render?: PriorityPlusRender<
    PriorityPlusPrimaryRenderProps,
    PriorityPlusPrimaryRenderState
  >;
}

export interface PriorityPlusItemRenderState extends PriorityPlusState {
  id: string;
  index: number;
  open: boolean;
  overflowed: boolean;
  placement: PriorityPlusItemPlacement;
  visible: boolean;
}

export type PriorityPlusItemRenderProps = HTMLAttributes<HTMLLIElement> & {
  ref?: RefCallback<HTMLLIElement>;
};

export interface PriorityPlusItemProps {
  children?: RenderChildren<PriorityPlusItemRenderState>;
  id?: string;
  order?: number;
  render?: PriorityPlusRender<
    PriorityPlusItemRenderProps,
    PriorityPlusItemRenderState
  >;
}

export interface PriorityPlusTriggerRenderState extends PriorityPlusState {
  open: boolean;
  overflowOpen: boolean;
  placement: "measure" | "trigger";
}

export interface PriorityPlusTriggerRenderProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref: RefCallback<HTMLButtonElement>;
}

export interface PriorityPlusTriggerProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-expanded" | "children" | "hidden" | "type"
  > {
  children?: RenderChildren<PriorityPlusTriggerRenderState>;
  render?: PriorityPlusRender<
    PriorityPlusTriggerRenderProps,
    PriorityPlusTriggerRenderState
  >;
}

export interface PriorityPlusOverflowRenderState extends PriorityPlusState {
  open: boolean;
  overflowOpen: boolean;
}

export interface PriorityPlusOverflowRenderProps
  extends HTMLAttributes<HTMLUListElement> {
  hidden: boolean;
}

export interface PriorityPlusOverflowProps
  extends Omit<HTMLAttributes<HTMLUListElement>, "children" | "hidden"> {
  children?: RenderChildren<PriorityPlusOverflowRenderState>;
  render?: PriorityPlusRender<
    PriorityPlusOverflowRenderProps,
    PriorityPlusOverflowRenderState
  >;
}

export interface PriorityPlusOverflowCountProps {
  children?: (overflowCount: number) => ReactNode;
}

const PriorityPlusContext = createContext<PriorityPlusContextValue | null>(null);

export function PriorityPlusRoot({
  "aria-label": ariaLabel = "Priority navigation",
  children,
  collapseAtCount,
  render,
  ...props
}: PriorityPlusRootProps) {
  const [items, setItems] = useState<RegisteredPriorityPlusItem[]>([]);
  const [primary, setPrimary] =
    useState<RegisteredPriorityPlusPrimary | null>(null);
  const [trigger, setTrigger] =
    useState<RegisteredPriorityPlusTrigger | null>(null);
  const [open, setOpen] = useState(false);
  const fallbackItemOrdersRef = useRef(new Map<string, number>());
  const nextFallbackItemOrderRef = useRef(0);
  const priority = usePriorityPlus(items, { collapseAtCount });
  const overflowOpen = open && !priority.allVisible;

  const registerItem = useCallback((item: PriorityPlusItemRegistration) => {
    const fallbackItemOrders = fallbackItemOrdersRef.current;
    let order = item.order;

    if (order === undefined) {
      order = fallbackItemOrders.get(item.id);

      if (order === undefined) {
        order = nextFallbackItemOrderRef.current;
        nextFallbackItemOrderRef.current += 1;
        fallbackItemOrders.set(item.id, order);
      }
    }

    const registeredItem: RegisteredPriorityPlusItem = {
      ...item,
      order,
    };

    setItems((currentItems) => {
      const nextItems = currentItems.filter(
        (currentItem) => currentItem.id !== registeredItem.id,
      );
      nextItems.push(registeredItem);
      nextItems.sort((a, b) => a.order - b.order);

      if (registeredItemsEqual(currentItems, nextItems)) {
        return currentItems;
      }

      return nextItems;
    });

    return () => {
      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== registeredItem.id ||
            currentItem.descriptorRef !== registeredItem.descriptorRef,
        ),
      );
    };
  }, []);

  const registerPrimary = useCallback(
    (nextPrimary: RegisteredPriorityPlusPrimary) => {
      setPrimary(nextPrimary);

      return () => {
        setPrimary((currentPrimary) =>
          currentPrimary?.id === nextPrimary.id ? null : currentPrimary,
        );
      };
    },
    [],
  );

  const registerTrigger = useCallback(
    (nextTrigger: RegisteredPriorityPlusTrigger) => {
      setTrigger(nextTrigger);

      return () => {
        setTrigger((currentTrigger) =>
          currentTrigger?.id === nextTrigger.id ? null : currentTrigger,
        );
      };
    },
    [],
  );

  useEffect(() => {
    if (priority.allVisible) setOpen(false);
  }, [priority.allVisible]);

  const visibleItemIds = useMemo(
    () => new Set(priority.visibleItems.map((item) => item.id)),
    [priority.visibleItems],
  );
  const overflowItemIds = useMemo(
    () => new Set(priority.overflowItems.map((item) => item.id)),
    [priority.overflowItems],
  );
  const itemIndexById = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items],
  );

  const context = useMemo<PriorityPlusContextValue>(
    () => ({
      itemIndexById,
      open,
      overflowItemIds,
      primary,
      priority,
      registerItem,
      registerPrimary,
      registerTrigger,
      setOpen,
      trigger,
      visibleItemIds,
    }),
    [
      itemIndexById,
      open,
      overflowItemIds,
      primary,
      priority,
      registerItem,
      registerPrimary,
      registerTrigger,
      trigger,
      visibleItemIds,
    ],
  );

  const state: PriorityPlusRootRenderState = {
    ...getPriorityState(priority),
    open,
    overflowOpen,
    update: priority.update,
  };
  const rootChildren = (
    <>
      {children}
      <PriorityPlusInternalMeasurer />
    </>
  );
  const rootProps: PriorityPlusRootRenderProps = {
    ...props,
    "aria-label": ariaLabel,
    children: rootChildren,
    ref: priority.containerRef,
  };

  return (
    <PriorityPlusContext.Provider value={context}>
      {render === undefined ? <nav {...rootProps} /> : render(rootProps, state)}
    </PriorityPlusContext.Provider>
  );
}

export function PriorityPlusPrimary({
  children,
  render,
  ...props
}: PriorityPlusPrimaryProps) {
  const context = usePriorityPlusContext("PriorityPlus.Primary");
  const { registerPrimary } = context;
  const id = useId();
  const descriptorRef = useRef<PriorityPlusPrimaryDescriptor>({
    children,
    props,
    render,
  });
  descriptorRef.current = { children, props, render };

  useLayoutEffect(
    () => registerPrimary({ descriptorRef, id }),
    [id, registerPrimary],
  );

  const state = getPrimaryRenderState(context, "primary");
  const primaryProps: PriorityPlusPrimaryRenderProps = {
    ...props,
    children,
    ref: context.priority.primaryRef,
  };

  return renderPrimary(primaryProps, state, render);
}

export function PriorityPlusItem({
  children,
  id,
  order,
  render,
}: PriorityPlusItemProps) {
  const context = usePriorityPlusContext("PriorityPlus.Item");
  const { registerItem } = context;
  const generatedId = useId();
  const descriptorRef = useRef<PriorityPlusItemDescriptor>({
    children,
    render,
  });
  const itemId = id ?? generatedId;

  descriptorRef.current = { children, render };

  useLayoutEffect(
    () =>
      registerItem({
        descriptorRef,
        id: itemId,
        order,
      }),
    [itemId, order, registerItem],
  );

  const index = context.itemIndexById.get(itemId);
  const item = context.priority.visibleItems.find(
    (visibleItem) => visibleItem.id === itemId,
  );

  if (index === undefined || item === undefined) {
    return null;
  }

  return renderItem(item, context, "primary");
}

export function PriorityPlusTrigger({
  children,
  onClick,
  render,
  ...props
}: PriorityPlusTriggerProps) {
  const context = usePriorityPlusContext("PriorityPlus.Trigger");
  const { registerTrigger } = context;
  const id = useId();
  const triggerRef = useCallback<RefCallback<HTMLButtonElement>>(() => {}, []);
  const descriptorRef = useRef<PriorityPlusTriggerDescriptor>({
    children,
    props,
    render,
  });
  descriptorRef.current = { children, props, render };

  useLayoutEffect(
    () => registerTrigger({ descriptorRef, id }),
    [id, registerTrigger],
  );

  return renderTrigger(
    descriptorRef.current,
    context,
    "trigger",
    triggerRef,
    onClick,
  );
}

export function PriorityPlusOverflow({
  children,
  render,
  ...props
}: PriorityPlusOverflowProps) {
  const context = usePriorityPlusContext("PriorityPlus.Overflow");
  const state = getOverflowRenderState(context);
  const defaultChildren = context.priority.overflowItems.map((item) => (
    <Fragment key={item.id}>{renderItem(item, context, "overflow")}</Fragment>
  ));
  const overflowProps: PriorityPlusOverflowRenderProps = {
    ...props,
    children:
      children === undefined
        ? defaultChildren
        : resolveChildren(children, state),
    hidden: !state.overflowOpen,
  };

  return render === undefined ? (
    <ul {...overflowProps} />
  ) : (
    render(overflowProps, state)
  );
}

export function PriorityPlusOverflowCount({
  children,
}: PriorityPlusOverflowCountProps) {
  const context = usePriorityPlusContext("PriorityPlus.OverflowCount");
  const { overflowCount } = context.priority;

  return <>{children === undefined ? overflowCount : children(overflowCount)}</>;
}

export interface PriorityPlusNamespace {
  Item: typeof PriorityPlusItem;
  Overflow: typeof PriorityPlusOverflow;
  OverflowCount: typeof PriorityPlusOverflowCount;
  Primary: typeof PriorityPlusPrimary;
  Root: typeof PriorityPlusRoot;
  Trigger: typeof PriorityPlusTrigger;
}

export const PriorityPlus: PriorityPlusNamespace = {
  Item: PriorityPlusItem,
  Overflow: PriorityPlusOverflow,
  OverflowCount: PriorityPlusOverflowCount,
  Primary: PriorityPlusPrimary,
  Root: PriorityPlusRoot,
  Trigger: PriorityPlusTrigger,
};

function PriorityPlusInternalMeasurer() {
  const context = usePriorityPlusContext("PriorityPlus.Root");
  const primaryDescriptor = context.primary?.descriptorRef.current;
  const triggerDescriptor = context.trigger?.descriptorRef.current;
  const primaryState = getPrimaryRenderState(context, "measure");
  const measureListProps: PriorityPlusPrimaryRenderProps = {
    ...(primaryDescriptor?.props ?? {}),
    children: context.priority.visibleItems
      .concat(context.priority.overflowItems)
      .map((item) => (
        <Fragment key={item.id}>{renderItem(item, context, "measure")}</Fragment>
      )),
    ref: context.priority.measureListRef,
  };

  return (
    <div aria-hidden="true" style={measurerStyle}>
      {renderPrimary(
        measureListProps,
        primaryState,
        primaryDescriptor?.render,
      )}
      {renderTrigger(
        triggerDescriptor,
        context,
        "measure",
        context.priority.measureToggleRef,
      )}
    </div>
  );
}

function renderPrimary(
  props: PriorityPlusPrimaryRenderProps,
  state: PriorityPlusPrimaryRenderState,
  render?: PriorityPlusPrimaryDescriptor["render"],
) {
  return render === undefined ? <ul {...props} /> : render(props, state);
}

function renderItem(
  item: RegisteredPriorityPlusItem,
  context: PriorityPlusContextValue,
  placement: PriorityPlusItemPlacement,
) {
  const index = context.itemIndexById.get(item.id) ?? 0;
  const descriptor = item.descriptorRef.current;
  const state: PriorityPlusItemRenderState = {
    ...getPriorityState(context.priority),
    id: item.id,
    index,
    open: context.open,
    overflowed: context.overflowItemIds.has(item.id),
    placement,
    visible: context.visibleItemIds.has(item.id),
  };
  const props: PriorityPlusItemRenderProps = {
    children: resolveChildren(descriptor.children, state),
    ref: placement === "measure" ? context.priority.measureItemRef : undefined,
  };

  return descriptor.render === undefined ? (
    <li {...props} />
  ) : (
    descriptor.render(props, state)
  );
}

function renderTrigger(
  descriptor: PriorityPlusTriggerDescriptor | undefined,
  context: PriorityPlusContextValue,
  placement: PriorityPlusTriggerRenderState["placement"],
  ref: RefCallback<HTMLButtonElement>,
  onClick?: PriorityPlusTriggerProps["onClick"],
) {
  const state = getTriggerRenderState(context, placement);
  const props: PriorityPlusTriggerRenderProps = {
    ...(descriptor?.props ?? {}),
    "aria-expanded": context.open && !context.priority.allVisible,
    children:
      descriptor === undefined || descriptor.children === undefined
        ? `More (${Math.max(1, context.priority.overflowCount)})`
        : resolveChildren(descriptor.children, state),
    hidden: placement === "trigger" && context.priority.allVisible,
    onClick: (event) => {
      onClick?.(event);

      if (placement === "trigger" && !event.defaultPrevented) {
        context.setOpen((open) => !open);
      }
    },
    ref,
    type: "button",
  };

  if (descriptor?.render === undefined) {
    return <button {...props} />;
  }

  return descriptor.render(props, state);
}

function getPrimaryRenderState(
  context: PriorityPlusContextValue,
  placement: PriorityPlusPrimaryRenderState["placement"],
): PriorityPlusPrimaryRenderState {
  return {
    ...getPriorityState(context.priority),
    open: context.open,
    overflowOpen: context.open && !context.priority.allVisible,
    placement,
  };
}

function getTriggerRenderState(
  context: PriorityPlusContextValue,
  placement: PriorityPlusTriggerRenderState["placement"],
): PriorityPlusTriggerRenderState {
  const priorityState = getPriorityState(context.priority);

  if (
    placement === "measure" &&
    priorityState.itemCount > 0
  ) {
    priorityState.allVisible = false;
    priorityState.overflowCount = priorityState.itemCount;
    priorityState.visibleCount = 0;
  }

  return {
    ...priorityState,
    open: context.open,
    overflowOpen: context.open && !context.priority.allVisible,
    placement,
  };
}

function getOverflowRenderState(
  context: PriorityPlusContextValue,
): PriorityPlusOverflowRenderState {
  return {
    ...getPriorityState(context.priority),
    open: context.open,
    overflowOpen: context.open && !context.priority.allVisible,
  };
}

function getPriorityState(priority: PriorityPlusState): PriorityPlusState {
  return {
    allVisible: priority.allVisible,
    itemCount: priority.itemCount,
    overflowCount: priority.overflowCount,
    visibleCount: priority.visibleCount,
  };
}

function resolveChildren<State>(
  children: RenderChildren<State> | undefined,
  state: State,
) {
  return typeof children === "function" ? children(state) : children;
}

function registeredItemsEqual(
  a: readonly RegisteredPriorityPlusItem[],
  b: readonly RegisteredPriorityPlusItem[],
) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.id === b[index]?.id &&
        item.order === b[index]?.order &&
        item.descriptorRef === b[index]?.descriptorRef,
    )
  );
}

function usePriorityPlusContext(componentName: string) {
  const context = useContext(PriorityPlusContext);

  if (context === null) {
    throw new Error(`${componentName} must be used inside PriorityPlus.Root`);
  }

  return context;
}
