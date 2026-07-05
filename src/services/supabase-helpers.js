import { Utils } from "../utils/utils.js"; 
export const SupabaseHelpers = {
  pendingRequests: new Map(),

  async execute(key, operation) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = Utils.withTimeout(
      Promise.resolve().then(operation)
    ).finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);

    return promise;
  },
};