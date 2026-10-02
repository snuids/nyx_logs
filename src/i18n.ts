export type Lang = "en" | "fr" | "el";

export const messages: Record<Lang, Record<string, string>> = {
  en: {
    type: "Type",
    name: "Name",
    creation: "Creation",
    modification: "Modification",
    size: "Size",
    refresh: "Refresh",
    filter_by_name: "Filter by name",
    error_fetching: "Error fetching API:",
    back: "Back",
    viewing_file: "Viewing File:",
    auto_refresh: "Auto Refresh",
    download: "Download",
    loading_file_content: "Loading file content...",
    error_file_content: "Error fetching file content:",
    error_download: "Error downloading file:",
  },
  fr: {
    type: "Type",
    name: "Nom",
    creation: "Création",
    modification: "Modification",
    size: "Taille",
    refresh: "Rafraîchir",
    filter_by_name: "Filtrer par nom",
    error_fetching: "Erreur lors de la récupération de l'API :",
    back: "Retour",
    viewing_file: "Fichier affiché :",
    auto_refresh: "Actualisation auto",
    download: "Télécharger",
    loading_file_content: "Chargement du contenu du fichier...",
    error_file_content: "Erreur lors de la récupération du contenu du fichier :",
    error_download: "Erreur lors du téléchargement du fichier :",
  },
  el: {
    type: "Τύπος",
    name: "Όνομα",
    creation: "Δημιουργία",
    modification: "Τροποποίηση",
    size: "Μέγεθος",
    refresh: "Ανανέωση",
    filter_by_name: "Φιλτράρισμα κατά όνομα",
    error_fetching: "Σφάλμα κατά τη λήψη του API:",
    back: "Πίσω",
    viewing_file: "Προβολή αρχείου:",
    auto_refresh: "Αυτόματη ανανέωση",
    download: "Λήψη",
    loading_file_content: "Φόρτωση περιεχομένου αρχείου...",
    error_file_content: "Σφάλμα κατά τη λήψη του περιεχομένου του αρχείου:",
    error_download: "Σφάλμα κατά τη λήψη του αρχείου:",
  },
};

export function normalizeLang(value: string | null | undefined): Lang {
  const raw = (value || "").trim().toLowerCase();
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("el") || raw.startsWith("gr")) return "el";
  return "en";
}

/** Resolve the language from the URL (?language=, ?lang= or ?locale=). */
export function getLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const params = new URLSearchParams(window.location.search);
  return normalizeLang(
    params.get("language") || params.get("lang") || params.get("locale")
  );
}

export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>
): string {
  const table = messages[lang] || messages.en;
  let text = table[key] ?? messages.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), String(value));
    }
  }
  return text;
}
