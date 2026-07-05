import { CONFIG } from "../config/config.js";

export const Utils = {
  sanitizeText(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim();
  },

  escapeHTML(value) {
    return this.sanitizeText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  safeSetAttribute(el, attr, value) {
    if (!el || !attr) return;

    const safeValue = this.sanitizeText(value);

    if (
      ["src", "href"].includes(attr) &&
      /^(javascript|data):/i.test(safeValue)
    ) {
      return;
    }

    el.setAttribute(attr, safeValue);
  },

  createElementSafe(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = this.sanitizeText(options.className);
    }

    if (options.text) {
      element.textContent = this.sanitizeText(options.text);
    }

    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        this.safeSetAttribute(element, key, value);
      });
    }

    return element;
  },

  formatCount(value) {
    const num = Number(value) || 0;

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }

    return String(num);
  },

  formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  },

  debounce(fn, delay = 300) {
    let timer;

    return (...args) => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  },

  withTimeout(promise, timeout = CONFIG.REQUEST_TIMEOUT) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeout)
      ),
    ]);
  },

setButtonLoading(button, loading, text = "Loading...") {
  if (!button) return;

  if (loading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent;
    }

    button.disabled = true;

    button.setAttribute(
      "aria-busy",
      "true"
    );

    button.textContent = text;

    return;
  }

  button.disabled = false;

  button.removeAttribute("aria-busy");

  button.textContent =
    button.dataset.originalText || "";

  delete button.dataset.originalText;
},

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  getFileExtension(filename = "") {
    return filename.split(".").pop()?.toLowerCase() || "";
  },
};