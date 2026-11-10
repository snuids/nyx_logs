/**
 * Les trois langues de l'app (`i18n.ts`).
 *
 * La langue arrive par l'URL (`?language=`, `?lang=` ou `?locale=`) : c'est la console qui la
 * remplace dans le lien de l'iframe. Ces tests tiennent les deux choses qu'on ne voit pas a l'oeil —
 * une table incomplete (une cle traduite en francais, oubliee en grec) et une cle inconnue, qui doit
 * s'afficher telle quelle plutot que de laisser un trou dans l'ecran.
 */

import { describe, expect, it } from "vitest";

import { getLanguage, messages, normalizeLang, translate } from "../src/i18n";

describe("normalizeLang", () => {
  it("accepte un code de langue avec sa region", () => {
    expect(normalizeLang("fr")).toBe("fr");
    expect(normalizeLang("FR")).toBe("fr");
    expect(normalizeLang("fr-BE")).toBe("fr");
    expect(normalizeLang("el-GR")).toBe("el");
    expect(normalizeLang("en-US")).toBe("en");
  });

  it("accepte `gr`, qui est ce qu'on tape quand on ne connait pas le grec", () => {
    expect(normalizeLang("gr")).toBe("el");
  });

  it("retombe sur l'anglais pour tout le reste", () => {
    expect(normalizeLang(null)).toBe("en");
    expect(normalizeLang(undefined)).toBe("en");
    expect(normalizeLang("")).toBe("en");
    expect(normalizeLang("   ")).toBe("en");
    expect(normalizeLang("de")).toBe("en");
  });
});

describe("getLanguage", () => {
  it("lit `language`, puis `lang`, puis `locale`", () => {
    window.history.replaceState({}, "", "/logs/?language=fr");
    expect(getLanguage()).toBe("fr");

    window.history.replaceState({}, "", "/logs/?lang=el");
    expect(getLanguage()).toBe("el");

    window.history.replaceState({}, "", "/logs/?locale=fr");
    expect(getLanguage()).toBe("fr");
  });

  it("donne la priorite a `language` quand les trois sont la", () => {
    window.history.replaceState({}, "", "/logs/?language=el&lang=fr&locale=fr");
    expect(getLanguage()).toBe("el");
  });

  it("retombe sur l'anglais sans parametre", () => {
    window.history.replaceState({}, "", "/logs/");
    expect(getLanguage()).toBe("en");
  });
});

describe("translate", () => {
  it("traduit dans les trois langues", () => {
    expect(translate("en", "refresh")).toBe("Refresh");
    expect(translate("fr", "refresh")).toBe("Rafraîchir");
    expect(translate("el", "refresh")).toBe("Ανανέωση");
  });

  it("remplace les parametres d'un message, plusieurs fois s'il le faut", () => {
    // aucune cle livree n'utilise de parametre : on en pose une le temps du test
    messages.en.received = "{n} fichiers recus, {n} a traiter par {user}";
    try {
      expect(translate("en", "received", { n: 3, user: "Arnaud" }))
        .toBe("3 fichiers recus, 3 a traiter par Arnaud");
    } finally {
      delete messages.en.received;
    }
  });

  it("complete une table incomplete par l'anglais", () => {
    const saved = messages.fr.refresh;
    delete messages.fr.refresh;
    try {
      expect(translate("fr", "refresh")).toBe("Refresh");
    } finally {
      messages.fr.refresh = saved;
    }
  });

  it("rend la cle quand aucune langue ne la connait", () => {
    expect(translate("el", "inconnue")).toBe("inconnue");
  });

  it("n'a pas de trou entre les trois tables", () => {
    const keys = Object.keys(messages.en).sort();
    expect(Object.keys(messages.fr).sort()).toEqual(keys);
    expect(Object.keys(messages.el).sort()).toEqual(keys);
    for (const key of keys) {
      expect(messages.fr[key], "cle fr vide : " + key).toBeTruthy();
      expect(messages.el[key], "cle el vide : " + key).toBeTruthy();
    }
  });
});
