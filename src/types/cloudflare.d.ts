// Minimal type stub for @cloudflare/next-on-pages (moduleResolution: "node" can't
// resolve package exports; workers-types is also not installed).
// Only declares the getRequestContext function used by D1Storage.
declare module '@cloudflare/next-on-pages' {
  interface RequestContext {
    env: Record<string, unknown>;
  }
  export function getRequestContext(): RequestContext;
}
