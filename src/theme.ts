/**
 * Theme support: `?theme=dark|light`, otherwise the system preference.
 *
 * The console opens this app in an iframe and passes its own theme in the URL — the `THEME` token of
 * an external application is replaced before the iframe loads, so `?theme=dark` is what arrives when
 * the console is dark. When the parameter is missing (someone opens the app directly), the system
 * preference decides, and it keeps deciding: a machine that turns dark at sunset takes the app with
 * it, unless the URL asked for a fixed theme.
 *
 * `applyTheme` paints the document, `useTheme` is the React side (see `useTheme.ts`). Keeping the
 * two apart means the resolution can be tested without a DOM.
 */

export type Theme = "light" | "dark";

function warnUnresolved(value: string) {
  if (typeof console === "undefined" || !console.warn) return;
  console.warn(
    `[nyx_logs] theme: "${value}" is neither dark nor light — falling back to the system ` +
      `preference. If the parameter arrived as "THEME", the console that opened this window is ` +
      `older than the token: reload it (Ctrl+Shift+R).`
  );
}

/** The query parameter the console fills in. */
export const THEME_PARAM = "theme";

/**
 * The theme a raw parameter value asks for.
 *
 * `auto`, an empty value, an unknown word or no parameter at all all mean "follow the system", which
 * is what `prefersDark` carries. `1`/`true` and `0`/`false` are accepted because a hand-written link
 * is as likely to use those as `dark`/`light`.
 */
export function resolveTheme(
  raw: string | null | undefined,
  prefersDark: boolean
): Theme {
  const value = String(raw ?? "").trim().toLowerCase();

  if (value === "dark" || value === "1" || value === "true") return "dark";
  if (value === "light" || value === "0" || value === "false") return "light";

  // Un jeton que la console n'a pas remplace (`THEME`) ou une valeur fautive : le theme ne
  // s'appliquera pas, et rien ne le dirait. C'est exactement le cas « ca ne marche pas » ou l'on
  // cherche pendant une heure.
  if (value && value !== "auto") warnUnresolved(value);

  return prefersDark ? "dark" : "light";
}

/** The raw `?theme=` value, or null. */
export function urlTheme(search?: string): string | null {
  if (typeof window === "undefined" && search === undefined) return null;
  const query = search !== undefined ? search : window.location.search;
  try {
    return new URLSearchParams(query).get(THEME_PARAM);
  } catch {
    return null; // a malformed query string must not blank the app
  }
}

/** Does the system ask for a dark interface? */
export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/** The theme in force now: the URL wins, the system has the last word otherwise. */
export function getTheme(search?: string): Theme {
  return resolveTheme(urlTheme(search), systemPrefersDark());
}

/**
 * Paint the theme on the document.
 *
 * The `dark` class is what our own stylesheet keys on; `data-theme` is there for anything that reads
 * an attribute rather than a class, and `color-scheme` makes the native widgets (scrollbars, form
 * controls) follow — without it a dark page keeps white scrollbars.
 */
export function applyTheme(theme: Theme): Theme {
  if (typeof document === "undefined" || !document.documentElement) return theme;

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  return theme;
}
