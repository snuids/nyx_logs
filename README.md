# nyx_logs

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
