import type { Locale } from "../i18n/LocaleContext";

interface AppMessages {
  loading: string;
  eyebrow: string;
  title: string;
  intro: string;
  libraryEyebrow: string;
  available: string;
  conceptCount: (count: number) => string;
  open: string;
}

export const appMessages: Record<Locale, AppMessages> = {
  en: {
    loading: "Loading concept…",
    eyebrow: "Interactive statistics",
    title: "Statistical Concepts Lab",
    intro: "Explore statistical ideas by changing a model, watching each step, and comparing a single run with its long-run behavior.",
    libraryEyebrow: "Concept library",
    available: "Available explorations",
    conceptCount: (count) => `${count} ${count === 1 ? "concept" : "concepts"}`,
    open: "Open exploration",
  },
  nl: {
    loading: "Concept laden…",
    eyebrow: "Interactieve statistiek",
    title: "Statistieklab",
    intro: "Verken statistische ideeën door een model te veranderen, elke stap te volgen en één simulatie te vergelijken met het gedrag op de lange termijn.",
    libraryEyebrow: "Conceptbibliotheek",
    available: "Beschikbare verkenningen",
    conceptCount: (count) => `${count} ${count === 1 ? "concept" : "concepten"}`,
    open: "Open verkenning",
  },
};
