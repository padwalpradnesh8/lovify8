import { Logger } from "./logger.js";
import { Utils } from "../utils/utils.js";
import { toast } from "../ui/toast.js";

export const ErrorHandler = {
  normalize(error) {
    if (!error) {
      return {
        message: "Unknown error",
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
      };
    }

    return {
      message: error.message || "Unexpected error",
      code: error.code || null,
      status: error.status || null,
      details: error.details || null,
    };
  },

  handle(error, fallbackMessage = "Something went wrong", context = {}) {
    const normalized = this.normalize(error);

    Logger.error("app_error", {
      context,
      error: normalized,
    });

    toast(normalized.message || fallbackMessage);

    return normalized;
  },
};