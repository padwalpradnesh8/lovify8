import { DOM } from "../core/dom.js";
import { CONFIG } from "../config/config.js";
import { UIComponents } from "./ui-components.js";

export function toast(message, type = "info") {
  if (!DOM.toastContainer) return;

  const toastElement =
    UIComponents.createToast(message, type);

  DOM.toastContainer.appendChild(toastElement);

  requestAnimationFrame(() => {
    toastElement.classList.add("visible");
  });

  setTimeout(() => {
    toastElement.classList.remove("visible");

    setTimeout(() => {
      toastElement.remove();
    }, 200);
  }, CONFIG.TOAST_DURATION);
}