import { Events } from './createEvent';
import eventTarget from './eventTarget';

export type EventCallback = (eventDetail: CustomEvent<{}>) => void;

interface CallbackRef {
  eventType: Events;
  wrappedCallback: EventCallback;
}

function createEventHandler() {
  const state = { eventReady: false };
  const eventChannel = eventTarget();
  const eventListeners: Map<EventCallback, CallbackRef> = new Map();

  /**
   * Registers an an event listener for the instance.
   * By default the callback will only be run after the first-load.
   * However this can be overridden by setting 'afterReady' to 'false'.
   */
  function on(eventType: Events, cb: EventCallback, afterReady = true) {
    function wrappedCallback(event: CustomEvent<{}>) {
      if (!afterReady || state.eventReady) cb(event);
    }

    // Store it so we can remove it later
    eventListeners.set(cb, { eventType, wrappedCallback });
    eventChannel.addEventListener(eventType, wrappedCallback as EventListener);

    return this;
  }

  /**
   * Removes an event listener.
   */
  function off(eventType: Events, cb: EventCallback) {
    const { wrappedCallback } = eventListeners.get(cb) as CallbackRef;
    eventChannel.removeEventListener(eventType, wrappedCallback as EventListener);

    return this;
  }

  /**
   * Dispatch an event.
   */
  function trigger(event: CustomEvent<{}>) {
    eventChannel.dispatchEvent(event);
  }

  /**
   * Set if we're ready to fire event callbacks.
   */
  function setEventReady(ready = true) {
    state.eventReady = ready;
  }

  return {
    off,
    on,
    setEventReady,
    trigger,
  };
}

export default createEventHandler;
