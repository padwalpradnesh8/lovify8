export const Cache = (() => {
  const store = new Map();

  return {
    get(key) {
      return store.get(key);
    },

    set(key, value) {
      store.set(key, {
        value,
        timestamp: Date.now(),
      });
    },

    remove(key) {
      store.delete(key);
    },

    clear() {
      store.clear();
    },
  };
})();