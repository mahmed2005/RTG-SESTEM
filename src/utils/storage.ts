/**
 * Safe local storage wrapper with memory fallback
 * Prevents DOMException / SecurityError when cookies/localStorage are restricted in iframes
 */

const memoryFallback: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Storage access restricted in iframe
    }
    return memoryFallback[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Quota exceeded or storage restricted
    }
    memoryFallback[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
    delete memoryFallback[key];
  },
};
