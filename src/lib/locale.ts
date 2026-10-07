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

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.some((option) => option.code === locale);
}

function publishLocaleChange(): void {
  for (const listener of listeners) listener();
}

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined" || !navigator.language) return DEFAULT_LOCALE;
  const lang = navigator.language.slice(0, 2).toLowerCase();
  return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}

export function readLocale(): SupportedLocale {
  if (typeof localStorage === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null;
  if (stored && isSupportedLocale(stored)) {
    return stored;
  }
  return detectBrowserLocale();
}

export function setLocale(locale: SupportedLocale): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
  publishLocaleChange();
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Keep multiple Dishylink windows in step. The window that performs the write
// is notified by setLocale; every other window receives the storage event.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === LOCALE_STORAGE_KEY) publishLocaleChange();
  });
}
