/**
 * The React side of the theme: resolve it once, then keep following the system while no explicit
 * `?theme=` was asked for.
 *
 * A machine that switches to dark at sunset should take the app with it — a log window left open all
 * afternoon is exactly the case where nobody reloads. When the URL named a theme, the URL wins and
 * the media query is ignored.
 */

import { useState, useEffect } from "react";

import { applyTheme, getTheme, resolveTheme, urlTheme, type Theme } from "./theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      const requested = urlTheme();
      // An explicit choice is not up for negotiation; `auto` and an absent parameter are.
      if (requested && requested.trim().toLowerCase() !== "auto") return;
      setTheme(resolveTheme(requested, event.matches));
    };

    if (query.addEventListener) query.addEventListener("change", onChange);
    else if (query.addListener) query.addListener(onChange); // Safari < 14

    return () => {
      if (query.removeEventListener) query.removeEventListener("change", onChange);
      else if (query.removeListener) query.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return theme;
}
