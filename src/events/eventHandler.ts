import { Events } from './createEvent';
import eventTarget from './eventTarget';

function createEventHandler() {
  const state = { eventReady: false };
  const eventChannel = eventTarget();
  const eventListeners: Map<((eventDetail: object) => void), {
    eventType: Events,
    wrappedCallback: (eventDetail: object) => void,
  }> = new Map();

  /**
   * Registers an an event listener for the instance.
   * By default the callback will only be run after the first-load.
   * However this can be overridden by setting 'afterReady' to 'false'.
   */
  function on(eventType: Events, cb: (eventDetail: object) => void, afterReady = true) {
    function wrappedCallback(event) {
      if (!afterReady || state.eventReady) cb(event);
    }

    // Store it so we can remove it later
    eventListeners.set(cb, { eventType, wrappedCallback });
    eventChannel.addEventListener(eventType, wrappedCallback);

    return this;
  }

  /**
   * Removes an event listener.
   */
  function off(eventType: Events, cb: (eventDetail: object) => void) {
    const { wrappedCallback } = eventListeners.get(cb);
    eventChannel.removeEventListener(eventType, wrappedCallback);

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
