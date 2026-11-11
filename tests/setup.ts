/**
 * What jsdom does not provide and antd uses.
 *
 * `matchMedia` and `ResizeObserver` are missing from jsdom; without them, any table or
 * `ConfigProvider` render throws before painting anything. Tests that need to drive the theme or
 * the resizing replace these doubles locally (`vi.stubGlobal`).
 */

import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  // `applyTheme` writes the class on <html>: a test must not leave it behind for the next one
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
})

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// antd measures the scrollbar width with `getComputedStyle(el, '::-webkit-scrollbar')`, and jsdom
// throws "Not implemented" as soon as it is given a pseudo-element.
const getComputedStyle = window.getComputedStyle.bind(window)
// the pseudo-element is dropped: antd only reads the scrollbar width
window.getComputedStyle = ((element: Element) =>
  getComputedStyle(element)) as typeof window.getComputedStyle

// antd measures the container for its tables: without `getBoundingClientRect` it renders an empty table
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () =>
    ({ width: 1024, height: 768, top: 0, left: 0, bottom: 768, right: 1024, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}
