/**
 * Ce que jsdom ne fournit pas et qu'antd utilise.
 *
 * `matchMedia` et `ResizeObserver` sont absents de jsdom ; sans eux, tout rendu de tableau ou de
 * `ConfigProvider` lève avant même d'avoir peint. Les tests qui doivent piloter le thème ou le
 * redimensionnement remplacent ces doublures localement (`vi.stubGlobal`).
 */

import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  // `applyTheme` ecrit la classe sur <html> : un test ne doit pas la laisser au suivant
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

// antd mesure la taille des barres de defilement avec `getComputedStyle(el, '::-webkit-scrollbar')`,
// et jsdom leve « Not implemented » des qu'on lui passe un pseudo-element.
const getComputedStyle = window.getComputedStyle.bind(window)
// le pseudo-element est ignore : antd ne lit que la largeur de la barre de defilement
window.getComputedStyle = ((element: Element) =>
  getComputedStyle(element)) as typeof window.getComputedStyle

// antd mesure le conteneur pour ses tables : sans `getBoundingClientRect`, il rend une table vide
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () =>
    ({ width: 1024, height: 768, top: 0, left: 0, bottom: 768, right: 1024, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}
