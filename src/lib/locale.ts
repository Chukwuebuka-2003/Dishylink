// Interface display language preferences. Follows the same pattern as
// toolbarStyle and theme: persisted in localStorage under dishylink-locale,
// initialized from browser settings if not explicitly chosen, and subscribed
// across UI components.

export type SupportedLocale = "en" | "es" | "fr" | "de" | "pt";

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LOCALES: readonly LocaleOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
] as const;

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_STORAGE_KEY = "dishylink-locale";

const listeners = new Set<() => void>();

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined" || !navigator.language) return DEFAULT_LOCALE;
  const lang = navigator.language.slice(0, 2).toLowerCase();
  const matched = SUPPORTED_LOCALES.find((l) => l.code === lang);
  return matched ? matched.code : DEFAULT_LOCALE;
}

export function readLocale(): SupportedLocale {
  if (typeof localStorage === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
  if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
    return stored;
  }
  return detectBrowserLocale();
}

export function setLocale(locale: SupportedLocale): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
