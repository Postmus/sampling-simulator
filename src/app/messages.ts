import type { Locale } from "../i18n/LocaleContext";

interface AppMessages {
  loading: string;
  eyebrow: string;
  title: string;
  chooseTheme: string;
  explorationCount: (count: number) => string;
  openTheme: string;
  backToThemes: string;
  explorationsEyebrow: string;
  availableExplorations: string;
  open: string;
}

export const appMessages: Record<Locale, AppMessages> = {
  en: {
    loading: "Loading concept…",
    eyebrow: "Interactive statistics",
    title: "Statistical Concepts Lab",
    chooseTheme: "Choose a theme",
    explorationCount: (count) => `${count} ${count === 1 ? "exploration" : "explorations"}`,
    openTheme: "View theme",
    backToThemes: "All themes",
    explorationsEyebrow: "Teaching sequence",
    availableExplorations: "Explorations",
    open: "Open exploration",
  },
  nl: {
    loading: "Concept laden…",
    eyebrow: "Interactieve statistiek",
    title: "Statistieklab",
    chooseTheme: "Kies een thema",
    explorationCount: (count) => `${count} ${count === 1 ? "verkenning" : "verkenningen"}`,
    openTheme: "Bekijk thema",
    backToThemes: "Alle thema's",
    explorationsEyebrow: "Onderwijsvolgorde",
    availableExplorations: "Verkenningen",
    open: "Open verkenning",
  },
};
