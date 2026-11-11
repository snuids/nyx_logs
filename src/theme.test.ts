/**
 * Theme resolution (see `theme.ts`).
 *
 * The console opens the app in an iframe, with the theme in the URL; opened directly, it follows the
 * system preference. Both rules are testable without a DOM — except `applyTheme`, which has to
 * paint.
 *
 * Run: `npm test`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { applyTheme, getTheme, resolveTheme, systemPrefersDark, urlTheme } from "./theme";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveTheme", () => {
  it("suit le parametre quand il est explicite", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("DARK", false)).toBe("dark");
    expect(resolveTheme(" dark ", true)).toBe("dark");
  });

  it("accepte les formes 1/0 et true/false d'un lien ecrit a la main", () => {
    expect(resolveTheme("1", false)).toBe("dark");
    expect(resolveTheme("true", false)).toBe("dark");
    expect(resolveTheme("0", true)).toBe("light");
    expect(resolveTheme("false", true)).toBe("light");
  });

  it("suit le systeme quand rien n'est demande", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("", true)).toBe("dark");
  });

  it("traite `auto` et une valeur inconnue comme « suivre le systeme »", () => {
    expect(resolveTheme("auto", true)).toBe("dark");
    expect(resolveTheme("auto", false)).toBe("light");
    expect(resolveTheme("bleu", true)).toBe("dark");
  });
});

describe("resolveTheme — jeton non remplace", () => {
  it("avertit quand la valeur n'est ni dark ni light (console plus ancienne que THEME)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // `THEME` arrives as is when the console did not perform the substitution
    expect(resolveTheme("THEME", false)).toBe("light");

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0][0]);
    expect(message).toMatch(/neither dark nor light/);
    expect(message).toMatch(/Ctrl\+Shift\+R/);
  });

  it("n'avertit pas pour `auto`, qui est une valeur prevue", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    resolveTheme("auto", false);

    expect(warn).not.toHaveBeenCalled();
  });
});

describe("urlTheme", () => {
  it("lit le parametre `theme` d'une chaine de requete", () => {
    expect(urlTheme("?theme=dark&token=abc")).toBe("dark");
    expect(urlTheme("?token=abc")).toBeNull();
    expect(urlTheme("")).toBeNull();
  });

  it("ne casse pas sur une chaine malformee", () => {
    expect(urlTheme("??==&")).toBeNull();
  });

  it("lit l'URL de la page quand on ne lui donne rien", () => {
    window.history.replaceState({}, "", "/logs/?theme=dark");
    expect(urlTheme()).toBe("dark");
    window.history.replaceState({}, "", "/logs/");
    expect(urlTheme()).toBeNull();
  });
});

describe("systemPrefersDark", () => {
  it("lit la preference du systeme", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("dark"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    expect(systemPrefersDark()).toBe(true);
  });

  it("repond « clair » quand le navigateur refuse la question", () => {
    vi.stubGlobal("matchMedia", () => {
      throw new Error("pas de media query ici");
    });

    expect(systemPrefersDark()).toBe(false);
  });
});

describe("getTheme", () => {
  it("prend le parametre de l'URL avant la preference systeme", () => {
    // outside a browser, the system preference is "light"
    expect(getTheme("?theme=dark")).toBe("dark");
    expect(getTheme("?theme=light")).toBe("light");
    expect(getTheme("")).toBe("light");
  });

  it("suit le systeme quand l'URL ne dit rien et que la machine est sombre", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("dark"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    expect(getTheme("")).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("pose la classe, l'attribut et le color-scheme sur <html>", () => {
    expect(applyTheme("dark")).toBe("dark");

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.getAttribute("data-theme")).toBe("dark");
    // without `color-scheme`, a dark page keeps white scrollbars
    expect(root.style.colorScheme).toBe("dark");
  });

  it("retire la classe quand on repasse en clair", () => {
    applyTheme("dark");
    expect(applyTheme("light")).toBe("light");

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.style.colorScheme).toBe("light");
  });
});
