import { ErrorHandler } from "./error-handler.js";
import { Logger } from "./logger.js";

export const EventBus = (() => {
  const events = new Map();

  return {
    on(event, callback) {
      if (!event || typeof callback !== "function") return () => {};

      if (!events.has(event)) {
        events.set(event, new Set());
      }

      const listeners = events.get(event);

      if (!listeners.has(callback)) {
        listeners.add(callback);
      }

      return () => {
        listeners.delete(callback);
      };
    },

    emit(event, data) {
      const listeners = events.get(event);

      if (!listeners) return;

      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          ErrorHandler.handle(error, "Event error", {
            event,
          });
        }
      });
    },

    clear(event) {
  if (!event) {
    Logger?.warn?.(
      "event_bus_clear_blocked",
      {
        reason:
          "Refusing to clear entire EventBus without explicit event name",
      }
    );

    return;
  }

  events.delete(event);
},
  };
})();