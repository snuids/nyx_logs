/**
 * Le theme vu par React (`useTheme.ts`).
 *
 * Une fenetre de logs reste ouverte tout l'apres-midi : si la machine passe en sombre au coucher du
 * soleil, la fenetre doit suivre sans rechargement. Mais quand l'URL a demande un theme explicite
 * (`?theme=light`), c'est elle qui commande et le systeme n'a plus voix au chapitre.
 *
 * On monte un petit composant qui affiche le theme courant et on pilote `matchMedia` a la main.
 */

import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTheme } from "../src/useTheme";

type Listener = (event: { matches: boolean }) => void;

interface Controls {
  listeners: Listener[];
  legacy: Listener[];
  fire: (matches: boolean) => void;
}

function stubMatchMedia(options: { legacy?: boolean; throwOnQuery?: boolean } = {}): Controls {
  const controls: Controls = { listeners: [], legacy: [], fire: () => {} };

  vi.stubGlobal("matchMedia", (query: string) => {
    if (options.throwOnQuery) throw new Error("pas de media query");
    const list: Record<string, unknown> = {
      matches: false,
      media: query,
      dispatchEvent: () => true,
    };
    if (options.legacy) {
      list.addListener = (listener: Listener) => controls.legacy.push(listener);
      list.removeListener = () => {
        controls.legacy.length = 0;
      };
    } else {
      list.addEventListener = (_: string, listener: Listener) => controls.listeners.push(listener);
      list.removeEventListener = () => {
        controls.listeners.length = 0;
      };
    }
    return list as unknown as MediaQueryList;
  });

  controls.fire = (matches: boolean) => {
    for (const listener of [...controls.listeners, ...controls.legacy]) {
      act(() => listener({ matches }));
    }
  };
  return controls;
}

function Probe() {
  const theme = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/logs/");
});

describe("useTheme", () => {
  it("affiche le theme demande par l'URL", () => {
    window.history.replaceState({}, "", "/logs/?theme=dark");
    stubMatchMedia();

    render(<Probe />);

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("suit le systeme quand l'URL ne demande rien", () => {
    stubMatchMedia();
    render(<Probe />);
    expect(screen.getByTestId("theme")).toHaveTextContent("light");

    const controls = stubMatchMedia();
    const { unmount } = render(<Probe />);
    controls.fire(true);
    expect(screen.getAllByTestId("theme")[1]).toHaveTextContent("dark");
    unmount();
  });

  it("change de theme quand la machine passe en sombre, si rien n'a ete demande", () => {
    const controls = stubMatchMedia();
    render(<Probe />);

    controls.fire(true);

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    controls.fire(false);

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("ignore le systeme quand l'URL a demande un theme", () => {
    window.history.replaceState({}, "", "/logs/?theme=light");
    const controls = stubMatchMedia();
    render(<Probe />);

    controls.fire(true);

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("suit encore le systeme quand l'URL a dit `auto`", () => {
    window.history.replaceState({}, "", "/logs/?theme=auto");
    const controls = stubMatchMedia();
    render(<Probe />);

    controls.fire(true);

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("utilise addListener quand le navigateur n'a pas addEventListener (Safari < 14)", () => {
    const controls = stubMatchMedia({ legacy: true });
    render(<Probe />);

    controls.fire(true);

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("ne s'abonne a rien quand le navigateur n'a pas matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);

    render(<Probe />);

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("retire son ecouteur en se demontant", () => {
    const controls = stubMatchMedia();
    const { unmount } = render(<Probe />);
    expect(controls.listeners.length).toBe(1);

    unmount();

    expect(controls.listeners.length).toBe(0);
  });
});
