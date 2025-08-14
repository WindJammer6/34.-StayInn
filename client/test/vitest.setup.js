// vitest.setup.js
import { expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/vitest'; // gives .toBeInTheDocument, etc.

// ------------------------------------------------------------------
// Worker: needed if any code does new Worker(...) at module load time
// ------------------------------------------------------------------
class MockWorker {
  onmessage = null;
  postMessage(_) {}
  terminate() {}
}
Object.defineProperty(globalThis, 'Worker', { value: MockWorker, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Worker', { value: MockWorker, writable: true });
}

// ------------------------------------------------------------------
// URL helpers: some code calls URL.createObjectURL / revokeObjectURL
// ------------------------------------------------------------------
const OriginalURL = typeof URL !== 'undefined' ? URL : class {};
class URLShim extends OriginalURL {}
URLShim.createObjectURL = vi.fn(() => 'mockedURL');
URLShim.revokeObjectURL = vi.fn();
Object.defineProperty(globalThis, 'URL', { value: URLShim, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'URL', { value: URLShim, writable: true });
}

// ------------------------------------------------------------------
// IntersectionObserver: robust mock + test-side trigger helper
// Usage (in tests): triggerIntersect({ isIntersecting: true }, optionalElement)
// If element omitted, triggers on all observed elements.
// ------------------------------------------------------------------
const ioInstances = [];
class IntersectionObserverMock {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
    ioInstances.push(this);
  }
  observe(el)   { this.elements.add(el); }
  unobserve(el) { this.elements.delete(el); }
  disconnect()  { this.elements.clear(); }
}
Object.defineProperty(globalThis, 'IntersectionObserver', { value: IntersectionObserverMock, writable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'IntersectionObserver', { value: IntersectionObserverMock, writable: true });
}

/** Fire an IO entry from your tests */
globalThis.triggerIntersect = (entry = { isIntersecting: true }, el) => {
  for (const inst of ioInstances) {
    const targets = el ? [el] : Array.from(inst.elements);
    if (targets.length === 0) continue;
    const records = targets.map(t => ({ target: t, ...entry }));
    inst.callback(records, inst);
  }
};

// ------------------------------------------------------------------
// Keep your jest-dom matchers (already imported above)
// ------------------------------------------------------------------
afterEach(() => {
  vi.clearAllMocks();
});