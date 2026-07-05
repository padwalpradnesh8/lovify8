export const Logger = {
  info(category, payload = {}) {
    console.info({
      level: "info",
      category,
      timestamp: new Date().toISOString(),
      payload,
    });
  },

  warn(category, payload = {}) {
    console.warn({
      level: "warn",
      category,
      timestamp: new Date().toISOString(),
      payload,
    });
  },

  error(category, payload = {}) {
    console.error({
      level: "error",
      category,
      timestamp: new Date().toISOString(),
      payload,
    });
  },
};