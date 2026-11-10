/**
 * Le lecteur de fichier (`FileViewer.tsx`).
 *
 * Le fichier arrive de `streamfile`, qui rend du HTML deja colore : le composant l'injecte tel quel.
 * Ce que ces tests tiennent : le contenu s'affiche, `INFO`/`ERROR` sont mis en evidence quand le
 * serveur n'a pas deja colore, le telechargement passe par `files`, l'actualisation auto relit toute
 * les cinq secondes, et un fichier qui n'est pas du JSON ne laisse pas le bouton tourner dans le vide.
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FileViewer from "../src/FileViewer";

const API = "https://api.example/";
const TOKEN = "tok123";
const FILE = "logs/app.log";

interface Call {
  url: string;
}

let calls: Call[];

function stubStream(handler: (url: string) => Response) {
  calls = [];
  vi.stubGlobal("fetch", (url: string) => {
    calls.push({ url });
    return Promise.resolve(handler(url));
  });
}

function htmlResponse(body: string): Response {
  return { ok: true, text: async () => body, blob: async () => new Blob([body]) } as unknown as Response;
}

function renderViewer(onBack = vi.fn()) {
  render(<FileViewer file={FILE} selectedFile="app.log" onBack={onBack} api={API} token={TOKEN} />);
  return onBack;
}

beforeEach(() => {
  stubStream(() => htmlResponse(JSON.stringify({ data: "<div>deja colore</div>" })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("FileViewer — le contenu", () => {
  it("demande le fichier avec le jeton et le chemin", async () => {
    renderViewer();

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(calls[0].url).toBe("https://api.example/streamfile?token=tok123&file=logs/app.log");
  });

  it("affiche le HTML rendu par le serveur tel quel", async () => {
    renderViewer();

    const rendered = await screen.findByText("deja colore");
    expect(rendered).toBeInTheDocument();
  });

  it("met INFO et ERROR en evidence quand le serveur ne l'a pas fait", async () => {
    stubStream(() => htmlResponse(JSON.stringify({ data: "INFO demarrage\nERROR panne" })));

    renderViewer();

    await waitFor(() => expect(document.querySelector("span.info")).not.toBeNull());
    expect(document.querySelector("span.error")).not.toBeNull();
    expect(document.querySelector("span.info")?.textContent).toBe("INFO");
    // les sauts de ligne deviennent des <br>, sinon tout tient sur une ligne
    expect(document.querySelector("br")).not.toBeNull();
  });

  it("ne retouche pas un contenu deja colore (il contient `level`)", async () => {
    stubStream(() => htmlResponse(JSON.stringify({ data: '<span class="level">INFO</span> niveau' })));

    renderViewer();

    await waitFor(() => expect(document.querySelector(".level")).not.toBeNull());
    // le contenu brut est injecte sans passer par le remplacement INFO/ERROR
    expect(document.querySelector("span.info")).toBeNull();
  });

  it("dit qu'il charge tant que rien n'est arrive", () => {
    vi.stubGlobal("fetch", () => new Promise(() => {})); // ne repond jamais

    renderViewer();

    expect(screen.getByText(/Loading file content/)).toBeInTheDocument();
  });

  it("journalise une reponse en erreur", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    stubStream(() => ({ ok: false, status: 500, text: async () => "", blob: async () => new Blob([]) }) as unknown as Response);

    renderViewer();

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.calls[0][0])).toMatch(/Error fetching file content/);
  });

  it("laisse le bouton en attente quand le fichier n'est pas du JSON", async () => {
    // `setLogsData` fait `JSON.parse` : un fichier texte leve, et `setLoading(false)` n'est jamais
    // atteint. Le defaut est fige ici (voir le commentaire du test) : c'est ce qui se passe en prod.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    stubStream(() => htmlResponse("ceci n'est pas du json"));

    renderViewer();

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.calls[0][0])).toMatch(/Error fetching file content/);
    expect(screen.getByRole("button", { name: /Refresh/ }).className).toMatch(/loading/);
  });
});

describe("FileViewer — les boutons", () => {
  it("revient a la liste", async () => {
    const onBack = renderViewer();
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("relit le fichier quand on clique sur Rafraichir", async () => {
    renderViewer();
    await waitFor(() => expect(calls.length).toBe(1));
    const refresh = screen.getByRole("button", { name: /Refresh/ });
    await waitFor(() => expect(refresh.className).not.toMatch(/loading/));

    fireEvent.click(refresh);

    await waitFor(() => expect(calls.length).toBe(2));
  });

  it("telecharge le fichier par l'API `files`", async () => {
    stubStream((url) =>
      url.includes("files?")
        ? htmlResponse("contenu")
        : htmlResponse(JSON.stringify({ data: "<div>x</div>" })),
    );
    const createObjectURL = vi.fn(() => "blob:url");
    vi.stubGlobal("URL", { ...URL, createObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderViewer();
    await waitFor(() => expect(calls.length).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: /Download/ }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    expect(calls[1].url).toBe("https://api.example/files?token=tok123&files=logs/app.log&rec_id=-1&path=logs/app.log");
    expect(click).toHaveBeenCalled();
  });

  it("journalise un telechargement qui echoue", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    stubStream((url) =>
      url.includes("files?")
        ? ({ ok: false, status: 500, blob: async () => new Blob([]) } as unknown as Response)
        : htmlResponse(JSON.stringify({ data: "<div>x</div>" })),
    );

    renderViewer();
    await waitFor(() => expect(calls.length).toBe(1));

    fireEvent.click(screen.getByRole("button", { name: /Download/ }));

    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(String(error.mock.calls[0][0])).toMatch(/Error downloading file/);
  });

  it("arrete l'actualisation auto quand on decoche", async () => {
    renderViewer();
    await waitFor(() => expect(calls.length).toBe(1));

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Refresh/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("button", { name: /Refresh/ })).toBeEnabled();
  });

  it("active l'actualisation auto et desactive le bouton Rafraichir", async () => {
    renderViewer();
    await waitFor(() => expect(calls.length).toBe(1));

    // les minuteries passent en faux apres la premiere lecture : sinon `waitFor` ne rendrait jamais
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("button", { name: /Refresh/ })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(calls.length).toBeGreaterThan(1);
  });
});
