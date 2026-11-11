# nyx_logs

![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/snuids/nyx_logs/badges/coverage.json&style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/snuids/nyx_logs/ci-tests.yml?style=flat-square&label=tests)

The log and file browser of the NYX console: it lists a directory served by the API
(`listdir`), lets you walk into folders, filter by name, and read a file in place
(`streamfile`) or download it.

It is a small React + TypeScript application (antd, Vite) meant to be **embedded** in the console:
the console opens it as an external application, in an iframe, and hands it everything it needs
through the URL.

## URL parameters

| parameter | meaning |
|---|---|
| `token` | the user's API token, passed to `listdir`, `streamfile` and `files` |
| `api` | the API root, with its trailing slash (`https://host/api/v1/`) |
| `path` | the directory to open first |
| `lang` (or `language`, `locale`) | `en`, `fr`, `el` — anything else falls back to `en` |
| `theme` | `light` or `dark`; `auto`, an unknown word or no parameter follows the system preference |

The console fills those in with the tokens of the external application it was configured with
(`TOKEN`, `API`, `LANG`, `THEME`), so a typical entry is:

```
https://logs.example/logs/?token=TOKEN&api=API&theme=THEME
```

## Theme

`?theme=dark` (or `light`) wins over everything else. Without it, the app follows
`prefers-color-scheme`, and keeps following it: a machine that switches to dark at sunset takes the
window with it, which matters for a log viewer left open all day.

Two halves, applied together:

- **antd** gets `ConfigProvider` with `darkAlgorithm`, so tables, buttons, inputs and pagination
  repaint as a whole;
- **our own styles** live in `src/index.css` as CSS variables (`--nyx-bg`, `--nyx-text`,
  `--nyx-code-bg`, …) redefined under `html.dark`. `applyTheme` sets that class, plus `data-theme`
  and `color-scheme` (without it a dark page keeps white scrollbars).

The colours match the console's (`#14181f` background, `#dfe4ed` text), because two different dark
greys side by side in one window are visible.

## Commands

```bash
npm ci
npm run dev      # http://127.0.0.1:5173/logs/ — `base` is `/logs/`
npm run build    # tsc -b && vite build -> dist/
npm test         # theme resolution, with the Node test runner (no extra dependency)
npm run lint
```

The image is built by `.github/workflows/docker-publish.yml`.

## Licence

BSD 2-Clause — see [LICENSE](LICENSE).

## Tests

```
npm test              # the suite (vitest, jsdom), 63 tests
npm run test:coverage # the same, with the measurement and the floor
```

The measurement covers **all** of `src/` (`include` in `vitest.config.mjs`): 97.1 % of the
instructions, 89.9 % of the branches, 100 % of the functions, 98.9 % of the lines. The floor lives in
the same file — it is the measured level, it goes up when tests land, it never goes down.

What the suite holds, and why:

- **the list** — the directory from the URL is requested with the token that came with it, the sizes
  are readable (`512 B`, `2.00 KB`, `5.00 MB`, `3.00 GB`), a directory shows no size;
- **the filter** — the list filters on the name without losing the other entries, and follows the
  console's language (`?language=fr` gives "Filtrer par nom");
- **the navigation** — walking into a folder reads the right path and shows the breadcrumb, walking
  back up through it repeats the request, opening a file hands its full path to the viewer, going
  back restores the list;
- **the viewer** — the HTML rendered by `streamfile` is shown as is, `INFO`/`ERROR` are highlighted
  when the server did not do it, the download goes through `files`, the auto refresh reads again
  every five seconds;
- **the theme** — `?theme=` wins over the system preference, `auto` and a missing parameter follow
  the machine (including when it changes its mind mid-session), and `applyTheme` paints the class,
  the attribute and the `color-scheme` on `<html>`;
- **the failures** — a request that fails, a 500 response, a body that is not JSON: each is logged,
  none breaks the screen.

**One defect frozen by a test**: `FileViewer` runs `JSON.parse` on the body of `streamfile`. A file
that is not JSON throws before `setLoading(false)`, and the Refresh button spins for ever. The test
`laisse le bouton en attente quand le fichier n'est pas du JSON` (still in French, like every other
test title) describes that behaviour rather than fixing it — fixing it means deciding what to show for a file the API did not colour.
