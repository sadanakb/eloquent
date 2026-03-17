/**
 * Lightweight pub/sub event bus built on the native EventTarget API.
 *
 * Supported events:
 *   achievement:unlocked | sound:play | score:gained | daily:completed | level:up
 */

class EventBus extends EventTarget {
  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {(e: CustomEvent) => void} callback
   * @returns {() => void} unsubscribe function
   */
  on(event, callback) {
    this.addEventListener(event, callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {(e: CustomEvent) => void} callback
   */
  off(event, callback) {
    this.removeEventListener(event, callback);
  }

  /**
   * Emit an event with optional data payload.
   * @param {string} event
   * @param {*} [data]
   */
  emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

const eventBus = new EventBus();
export default eventBus;
