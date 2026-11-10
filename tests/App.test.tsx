/**
 * L'ecran principal (`App.tsx`) : la liste d'un dossier, le fil, les icones.
 *
 * L'app est ouverte en iframe par la console, qui remplace `token`, `api`, `path` et la langue dans
 * l'URL. Ce que ces tests tiennent, c'est ce qu'un utilisateur remarque quand ca casse : une liste
 * vide alors que le dossier n'est pas vide, un filtre qui ne filtre pas, une icone de dossier qui ne
 * descend pas, un fichier qui ne s'ouvre pas.
 *
 * `fetch` est double (aucune requete reelle) ; `FileViewer` est remplace par un temoin, pour que
 * l'ouverture d'un fichier se voie sans monter le lecteur.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App";

vi.mock("../src/FileViewer", () => ({
  default: (props: {
    file: string;
    selectedFile: string;
    api: string;
    token: string;
    onBack: () => void;
  }) => (
    <div data-testid="viewer">
      {`${props.file}|${props.selectedFile}|${props.api}|${props.token}`}
      <button onClick={props.onBack}>retour</button>
    </div>
  ),
}));

const ENTRIES = [
  { type: "dir", name: "archives", creation_time: 1700000000, modification_time: 1700000000, size: 4096 },
  { type: "file", name: "app.log", creation_time: 1700000000, modification_time: 1700000000, size: 512 },
  { type: "file", name: "big.log", creation_time: 1700000000, modification_time: 1700000000, size: 2048 },
  { type: "file", name: "huge.log", creation_time: 1700000000, modification_time: 1700000000, size: 5 * 1024 * 1024 },
  { type: "file", name: "giant.log", creation_time: 1700000000, modification_time: 1700000000, size: 3 * 1024 * 1024 * 1024 },
];

interface Call {
  url: string;
  body: unknown;
}

let calls: Call[];

function jsonResponse(payload: unknown): Response {
  return { ok: true, json: async () => payload, text: async () => JSON.stringify(payload) } as unknown as Response;
}

function stubFetch(handler: (url: string, body: unknown) => unknown) {
  calls = [];
  vi.stubGlobal("fetch", (url: string, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, body });
    return Promise.resolve(jsonResponse(handler(url, body)));
  });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/logs/?token=tok123&api=https%3A%2F%2Fapi.example%2F&path=logs");
  stubFetch(() => ({ data: ENTRIES }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/logs/");
});

describe("App — la liste", () => {
  it("demande le dossier de l'URL avec le jeton recu", async () => {
    render(<App />);

    await screen.findByText("app.log");

    expect(calls[0].url).toBe("https://api.example/listdir?token=tok123");
    expect(calls[0].body).toEqual({ rec_id: -1, path: "logs" });
  });

  it("affiche les dossiers et les fichiers, avec leur taille lisible", async () => {
    render(<App />);
    await screen.findByText("app.log");

    expect(screen.getByText("archives")).toBeInTheDocument();
    expect(screen.getByText("512 B")).toBeInTheDocument();
    expect(screen.getByText("2.00 KB")).toBeInTheDocument();
    expect(screen.getByText("5.00 MB")).toBeInTheDocument();
    expect(screen.getByText("3.00 GB")).toBeInTheDocument();
    // un dossier n'a pas de taille : la colonne reste vide
    expect(screen.queryByText("4.00 KB")).not.toBeInTheDocument();
  });

  it("n'emet aucune requete sans jeton ni API", async () => {
    window.history.replaceState({}, "", "/logs/");
    stubFetch(() => ({ data: ENTRIES }));

    render(<App />);
    await waitFor(() => expect(calls).toHaveLength(0));
  });
});

describe("App — le fil", () => {
  it("filtre la liste sur le nom, sans perdre les autres", async () => {
    render(<App />);
    await screen.findByText("app.log");

    fireEvent.change(screen.getByPlaceholderText("Filter by name"), { target: { value: "big" } });

    await waitFor(() => expect(screen.queryByText("app.log")).not.toBeInTheDocument());
    expect(screen.getByText("big.log")).toBeInTheDocument();
    expect(screen.queryByText("huge.log")).not.toBeInTheDocument();
  });

  it("traduit le fil en francais quand la console l'a ouverte en francais", async () => {
    window.history.replaceState({}, "", "/logs/?token=t&api=https%3A%2F%2Fapi.example%2F&language=fr");

    render(<App />);

    expect(await screen.findByPlaceholderText("Filtrer par nom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rafraîchir/ })).toBeInTheDocument();
  });
});

describe("App — la navigation", () => {
  it("descend dans un dossier et affiche le fil d'Ariane", async () => {
    render(<App />);
    await screen.findByText("archives");

    fireEvent.click(document.querySelector(".anticon-folder") as Element);

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].body).toEqual({ rec_id: -1, path: "logs/archives" });
    await waitFor(() => expect(document.querySelector(".ant-breadcrumb")).not.toBeNull());
  });

  it("ouvre un fichier dans le lecteur, avec son chemin complet", async () => {
    render(<App />);
    await screen.findByText("app.log");

    fireEvent.click(document.querySelector(".anticon-file") as Element);

    const viewer = await screen.findByTestId("viewer");
    expect(viewer).toHaveTextContent("logs/app.log|app.log|https://api.example/|tok123");
    // la barre d'outils de la liste disparait pendant la lecture
    expect(screen.queryByPlaceholderText("Filter by name")).not.toBeInTheDocument();
  });

  it("remonte d'un dossier en cliquant dans le fil d'Ariane", async () => {
    render(<App />);
    await screen.findByText("archives");
    fireEvent.click(document.querySelector(".anticon-folder") as Element);
    await waitFor(() => expect(calls).toHaveLength(2));

    // le fil affiche la racine puis le dossier ouvert ; cliquer sur le dossier relit ce dossier
    const crumbs = document.querySelectorAll(".ant-breadcrumb-link");
    expect(crumbs.length).toBe(2);
    fireEvent.click(crumbs[1]);

    await waitFor(() => expect(calls).toHaveLength(3));
    expect(calls[2].body).toEqual({ rec_id: -1, path: "logs/archives" });
  });

  it("trie sur chaque colonne quand on clique sur son en-tete", async () => {
    render(<App />);
    await screen.findByText("app.log");

    for (const header of ["Type", "Name", "Creation", "Modification", "Size"]) {
      const column = screen.getByText(header);
      fireEvent.click(column);
      fireEvent.click(column);
    }

    // le tri est fait par antd sur les donnees deja recues : aucune requete supplementaire
    expect(calls).toHaveLength(1);
    expect(screen.getByText("archives")).toBeInTheDocument();
  });

  it("revient a la liste quand le lecteur appelle onBack", async () => {
    render(<App />);
    await screen.findByText("app.log");
    fireEvent.click(document.querySelector(".anticon-file") as Element);
    await screen.findByTestId("viewer");

    fireEvent.click(screen.getByRole("button", { name: "retour" }));

    expect(await screen.findByText("app.log")).toBeInTheDocument();
    expect(screen.queryByTestId("viewer")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter by name")).toBeInTheDocument();
  });

  it("relit le dossier quand on clique sur Rafraichir", async () => {
    render(<App />);
    await screen.findByText("app.log");
    expect(calls).toHaveLength(1);

    // le bouton est en attente jusqu'a 300 ms apres la reponse : un clic pendant ce temps ne compte pas
    const refresh = screen.getByRole("button", { name: /Refresh/ });
    await waitFor(() => expect(refresh.className).not.toMatch(/loading/));
    fireEvent.click(refresh);

    await waitFor(() => expect(calls).toHaveLength(2));
  });
});

describe("App — les pannes", () => {
  it("journalise une requete qui echoue sans casser l'ecran", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", () => Promise.reject(new Error("reseau coupe")));

    render(<App />);

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.calls[0][0])).toMatch(/Error fetching API/);
  });
});

describe("App — les details qui se voient", () => {
  it("affiche la version du paquet en bas de l'ecran", async () => {
    render(<App />);
    await screen.findByText("app.log");

    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it("suit le theme demande par l'URL", async () => {
    window.history.replaceState({}, "", "/logs/?token=t&api=https%3A%2F%2Fapi.example%2F&theme=dark");

    render(<App />);
    await screen.findByText("app.log");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
