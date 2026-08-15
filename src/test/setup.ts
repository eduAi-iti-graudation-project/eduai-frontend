import "@testing-library/jest-dom/vitest"

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const elementProto = globalThis.Element?.prototype
if (elementProto && typeof elementProto.hasPointerCapture === "undefined") {
  elementProto.hasPointerCapture = (() => false) as unknown as typeof elementProto.hasPointerCapture
}
if (elementProto && typeof elementProto.releasePointerCapture === "undefined") {
  elementProto.releasePointerCapture = (() => {}) as unknown as typeof elementProto.releasePointerCapture
}
if (elementProto && typeof elementProto.setPointerCapture === "undefined") {
  elementProto.setPointerCapture = (() => {}) as unknown as typeof elementProto.setPointerCapture
}

if (typeof globalThis.scrollTo === "undefined") {
  globalThis.scrollTo = (() => {}) as unknown as typeof globalThis.scrollTo
}

if (elementProto && typeof elementProto.scrollIntoView === "undefined") {
  elementProto.scrollIntoView = (() => {}) as unknown as typeof elementProto.scrollIntoView
}