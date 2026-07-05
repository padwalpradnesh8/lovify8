import { DOM } from "../core/dom.js";
import { EventBus } from "../core/event-bus.js";

export function initializeAccessibility() {
  DOM.playBtn?.setAttribute(
    "aria-label",
    "Toggle playback"
  );

  DOM.nextBtn?.setAttribute(
    "aria-label",
    "Next song"
  );

  DOM.prevBtn?.setAttribute(
    "aria-label",
    "Previous song"
  );

  DOM.progress?.setAttribute(
    "aria-label",
    "Playback progress"
  );

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;

    if (
      tag === "INPUT" ||
      tag === "TEXTAREA"
    ) {
      return;
    }

    if (
       event.code === "Space" &&
       !event.repeat
      ) {
      event.preventDefault();
      EventBus.emit("player:toggle");
    }
  });
}
