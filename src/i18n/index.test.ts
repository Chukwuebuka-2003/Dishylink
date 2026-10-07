import { beforeEach, describe, expect, it } from "vitest";

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

const { default: i18n } = await import("./index");
const { setLocale } = await import("../lib/locale");

describe("i18n setup", () => {
  beforeEach(() => {
    store.clear();
    setLocale("en");
  });

  it("loads English translations by default", () => {
    expect(i18n.t("common.settings")).toBe("Settings");
    expect(i18n.t("settings.language")).toBe("Language");
  });

  it("switches to Spanish when locale is changed", async () => {
    setLocale("es");
    expect(i18n.language).toBe("es");
    expect(i18n.t("common.settings")).toBe("Configuración");
    expect(i18n.t("settings.language")).toBe("Idioma");
  });

  it("switches to French when locale is changed", async () => {
    setLocale("fr");
    expect(i18n.language).toBe("fr");
    expect(i18n.t("common.settings")).toBe("Paramètres");
    expect(i18n.t("settings.language")).toBe("Langue");
  });

  it("switches to German when locale is changed", async () => {
    setLocale("de");
    expect(i18n.language).toBe("de");
    expect(i18n.t("common.settings")).toBe("Einstellungen");
    expect(i18n.t("settings.language")).toBe("Sprache");
  });

  it("switches to Portuguese when locale is changed", async () => {
    setLocale("pt");
    expect(i18n.language).toBe("pt");
    expect(i18n.t("common.settings")).toBe("Configurações");
    expect(i18n.t("settings.language")).toBe("Idioma");
  });
});
