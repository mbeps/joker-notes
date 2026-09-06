import "@testing-library/jest-dom/vitest";

// Fallback environment variables for tests
process.env.NEXT_PUBLIC_CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://hearty-grasshopper-879.convex.cloud";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Z3JhdGVmdWwtZ2xvd3dvcm0tMjAuY2xlcmsuYWNjb3VudHMuZGV2JA";
process.env.CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY || "sk_test_mock_clerk_secret_key";
process.env.EDGE_STORE_ACCESS_KEY =
  process.env.EDGE_STORE_ACCESS_KEY || "mock_edge_store_access_key";
process.env.EDGE_STORE_SECRET_KEY =
  process.env.EDGE_STORE_SECRET_KEY || "mock_edge_store_secret_key";

// Mock ResizeObserver for cmdk and Base UI components
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = window.ResizeObserver || MockResizeObserver;
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;

// Stub window.matchMedia for viewport-dependent hooks/components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Stub scrollIntoView for cmdk in jsdom
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}
if (!window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = vi.fn();
}
