// Minimal Node globals some Comunica dependencies expect in the browser.
export const process = globalThis.process || { env: {}, nextTick: (fn, ...a) => queueMicrotask(() => fn(...a)), version: '', versions: {}, platform: 'browser', browser: true };
