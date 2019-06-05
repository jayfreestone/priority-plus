export enum Events {
  ShowOverflow = 'showOverflow',
  HideOverflow = 'hideOverflow',
  ItemsChanged = 'itemsChanged',
}

export interface ItemsChangedEvent {
  detail: {
    overflowCount: number,
  };
}

function createEvent(name: Events, payload = {}) {
  return new CustomEvent(name, {
    detail: payload,
  });
}

export function createShowOverflowEvent() {
  return createEvent(Events.ShowOverflow);
}

export function createHideOverflowEvent() {
  return createEvent(Events.HideOverflow);
}

export function createItemsChangedEvent({ overflowCount }: ItemsChangedEvent['detail']) {
  return createEvent(Events.ItemsChanged, { overflowCount });
}

export default createEvent;
