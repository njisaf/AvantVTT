/**
 * Lightweight wrapper around console to allow easy mocking in tests.
 * Exported methods mirror console.* but can be monkey-patched.
 */
/* eslint-disable no-console */
export const logger = {
    log: (...args) => console.log(...args),
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.debug(...args)
};
/* eslint-enable no-console */ 