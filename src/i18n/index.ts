import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { readLocale, subscribeToLocale } from "../lib/locale";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt.json";

export const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: readLocale(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Re-align i18next whenever the user changes the locale setting
subscribeToLocale(() => {
  const next = readLocale();
  if (i18n.language !== next) {
    void i18n.changeLanguage(next);
  }
});

export default i18n;
