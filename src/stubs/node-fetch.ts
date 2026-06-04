// Browser-safe stub for node-fetch to prevent global pollution in sandboxed iframes
const browserFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;
export default browserFetch;
export const Headers = typeof window !== 'undefined' ? window.Headers : null;
export const Request = typeof window !== 'undefined' ? window.Request : null;
export const Response = typeof window !== 'undefined' ? window.Response : null;
