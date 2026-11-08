/**
 * Resolution du theme (voir `theme.ts`).
 *
 * L'app est ouverte par la console dans une iframe, avec son theme dans l'URL ; ouverte directement,
 * elle suit la preference du systeme. Ces deux regles se testent sans DOM.
 *
 * Lancement : `npm test` (le lanceur de tests de Node, aucune dependance a ajouter).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveTheme, urlTheme, getTheme, applyTheme } from "./theme.ts";

describe("resolveTheme", () => {
  it("suit le parametre quand il est explicite", () => {
    assert.equal(resolveTheme("dark", false), "dark");
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("DARK", false), "dark");
    assert.equal(resolveTheme(" dark ", true), "dark");
  });

  it("accepte les formes 1/0 et true/false d'un lien ecrit a la main", () => {
    assert.equal(resolveTheme("1", false), "dark");
    assert.equal(resolveTheme("true", false), "dark");
    assert.equal(resolveTheme("0", true), "light");
    assert.equal(resolveTheme("false", true), "light");
  });

  it("suit le systeme quand rien n'est demande", () => {
    assert.equal(resolveTheme(null, true), "dark");
    assert.equal(resolveTheme(undefined, false), "light");
    assert.equal(resolveTheme("", true), "dark");
  });

  it("traite `auto` et une valeur inconnue comme « suivre le systeme »", () => {
    assert.equal(resolveTheme("auto", true), "dark");
    assert.equal(resolveTheme("auto", false), "light");
    assert.equal(resolveTheme("bleu", true), "dark");
  });
});

describe("resolveTheme — jeton non remplace", () => {
  it("avertit quand la valeur n'est ni dark ni light (console plus ancienne que THEME)", () => {
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.join(" "));

    try {
      // `THEME` arrive tel quel quand la console n'a pas fait la substitution
      assert.equal(resolveTheme("THEME", false), "light");
    } finally {
      console.warn = original;
    }

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /neither dark nor light/);
    assert.match(warnings[0], /Ctrl\+Shift\+R/);
  });

  it("n'avertit pas pour `auto`, qui est une valeur prevue", () => {
    let warned = 0;
    const original = console.warn;
    console.warn = () => { warned += 1; };

    try {
      resolveTheme("auto", false);
    } finally {
      console.warn = original;
    }

    assert.equal(warned, 0);
  });
});

describe("urlTheme", () => {
  it("lit le parametre `theme` d'une chaine de requete", () => {
    assert.equal(urlTheme("?theme=dark&token=abc"), "dark");
    assert.equal(urlTheme("?token=abc"), null);
    assert.equal(urlTheme(""), null);
  });

  it("ne casse pas sur une chaine malformee", () => {
    assert.equal(urlTheme("??==&"), null);
  });
});

describe("getTheme", () => {
  it("prend le parametre de l'URL avant la preference systeme", () => {
    // hors navigateur, la preference systeme est « clair »
    assert.equal(getTheme("?theme=dark"), "dark");
    assert.equal(getTheme("?theme=light"), "light");
    assert.equal(getTheme(""), "light");
  });
});

describe("applyTheme", () => {
  it("pose la classe, l'attribut et le color-scheme (document absent : rend le theme)", () => {
    // en environnement Node il n'y a pas de `document` : la fonction rend le theme sans rien peindre
    assert.equal(applyTheme("dark"), "dark");
    assert.equal(applyTheme("light"), "light");
  });
});
