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

## TESTS

```
npm test              # la suite (vitest, jsdom), 63 tests
npm run test:coverage # la meme chose, avec la mesure et le plancher
```

La mesure porte sur **tout** `src/` (`include` dans `vitest.config.mjs`) : 97,1 % des instructions,
89,9 % des branches, 100 % des fonctions, 98,9 % des lignes. Le plancher vit dans le meme fichier —
c'est le niveau mesure, il monte quand des tests arrivent, il ne descend jamais.

Ce que la suite tient, et pourquoi :

- **la liste** — le dossier de l'URL est demande avec le jeton recu, les tailles sont lisibles
  (`512 B`, `2.00 KB`, `5.00 MB`, `3.00 GB`), un dossier n'affiche pas de taille ;
- **le fil** — la liste se filtre sur le nom sans perdre les autres entrees, et suit la langue de la
  console (`?language=fr` donne « Filtrer par nom ») ;
- **la navigation** — descendre dans un dossier relit le bon chemin et affiche le fil d'Ariane,
  remonter par le fil refait la requete, ouvrir un fichier passe son chemin complet au lecteur,
  revenir rend la liste ;
- **le lecteur** — le HTML rendu par `streamfile` s'affiche tel quel, `INFO`/`ERROR` sont mis en
  evidence quand le serveur ne l'a pas fait, le telechargement passe par `files`, l'actualisation
  auto relit toutes les cinq secondes ;
- **le theme** — `?theme=` gagne sur la preference systeme, `auto` et l'absence de parametre suivent
  la machine (y compris quand elle change d'avis en cours de session), et `applyTheme` peint la
  classe, l'attribut et le `color-scheme` sur `<html>` ;
- **les pannes** — une requete qui echoue, une reponse 500, un corps qui n'est pas du JSON : chacune
  est journalisee, aucune ne casse l'ecran.

**Un defaut fige par un test** : `FileViewer` fait `JSON.parse` sur le corps de `streamfile`. Un
fichier qui n'est pas du JSON leve avant `setLoading(false)`, et le bouton Rafraichir tourne
indefiniment. Le test `laisse le bouton en attente quand le fichier n'est pas du JSON` decrit ce
comportement plutot que de le corriger — le corriger demande de decider ce qu'on affiche pour un
fichier non colore par l'API.
