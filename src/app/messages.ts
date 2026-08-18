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
  moreSoon: string;
  next: string;
  coverageTitle: string;
  coverageDescription: string;
  planned: string;
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
    moreSoon: "More concepts coming soon",
    next: "Next",
    coverageTitle: "Confidence interval coverage",
    coverageDescription: "Watch repeated intervals succeed and fail to capture a fixed population value.",
    planned: "Planned",
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
    moreSoon: "Binnenkort meer concepten",
    next: "Volgende",
    coverageTitle: "Dekkingsgraad van betrouwbaarheidsintervallen",
    coverageDescription: "Bekijk hoe herhaalde intervallen een vaste populatiewaarde soms wel en soms niet omvatten.",
    planned: "Gepland",
  },
};
