/**
 * Le point d'entree (`main.tsx`).
 *
 * Il ne fait que deux choses, mais la premiere se voit : le theme est peint **avant** le premier
 * rendu, sinon une console sombre ouvre un fond blanc le temps que React monte, et l'iframe clignote
 * a chaque rechargement.
 */

import { act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  vi.stubGlobal("fetch", () =>
    Promise.resolve({
      ok: true,
      json: async () => ({ data: [] }),
      text: async () => JSON.stringify({ data: [] }),
    } as unknown as Response),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/logs/");
});

describe("main", () => {
  it("peint le theme demande avant de monter l'application", async () => {
    window.history.replaceState({}, "", "/logs/?theme=dark");
    // `applyTheme` est appele au niveau du module : c'est ce qui evite le flash
    const theme = await import("../src/theme");
    const spy = vi.spyOn(theme, "applyTheme");

    await import("../src/main");

    expect(spy).toHaveBeenCalledWith("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("monte l'application dans #root", { timeout: 30_000 }, async () => {
    await act(async () => {
      await import("../src/main");
    });

    // sans jeton dans l'URL, App rend sa coquille (barre d'outils + tableau vide)
    await waitFor(() =>
      expect(document.getElementById("root")?.childElementCount).toBeGreaterThan(0),
    );
  });
});
