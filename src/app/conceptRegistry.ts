import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Locale } from "../i18n/LocaleContext";

interface ConceptCopy {
  title: string;
  description: string;
}

interface ThemeCopy {
  title: string;
  description: string;
}

export interface ThemeDefinition {
  id: string;
  copy: Record<Locale, ThemeCopy>;
}

export interface ConceptDefinition {
  id: string;
  themeId: string;
  order: number;
  copy: Record<Locale, ConceptCopy>;
  component: LazyExoticComponent<ComponentType>;
}

export const themeRegistry: ThemeDefinition[] = [
  {
    id: "sampling-estimation",
    copy: {
      en: {
        title: "Sampling distributions",
        description: "See how repeated samples turn individual sample means into a sampling distribution.",
      },
      nl: {
        title: "Steekproevenverdelingen",
        description: "Zie hoe herhaalde steekproeven afzonderlijke steekproefgemiddelden vormen tot een steekproevenverdeling.",
      },
    },
  },
  {
    id: "linear-regression",
    copy: {
      en: {
        title: "Linear regression",
        description: "Build a fitted line, examine its assumptions, adjust group comparisons, and allow groups to have different slopes.",
      },
      nl: {
        title: "Lineaire regressie",
        description: "Bouw een regressielijn, onderzoek de aannames, corrigeer groepsvergelijkingen en sta verschillende hellingen toe.",
      },
    },
  },
];

export const conceptRegistry: ConceptDefinition[] = [
  {
    id: "sampling-distribution",
    themeId: "sampling-estimation",
    order: 1,
    copy: {
      en: {
        title: "Sampling distribution of the mean",
        description: "Follow observations from a fixed population into one sample, then watch one mean from every sample build a new distribution.",
      },
      nl: {
        title: "Steekproevenverdeling van het gemiddelde",
        description: "Volg waarnemingen uit een vaste populatie naar één steekproef en zie vervolgens hoe het gemiddelde van iedere steekproef een nieuwe verdeling opbouwt.",
      },
    },
    component: lazy(() => import("../concepts/sampling-distribution/SamplingDistributionPage")),
  },
  {
    id: "least-squares",
    themeId: "linear-regression",
    order: 1,
    copy: {
      en: {
        title: "How least squares chooses a line",
        description: "Move a candidate line, collect its squared errors into SSE, inspect its residuals, and follow slope and intercept to the minimum.",
      },
      nl: {
        title: "Hoe kleinste kwadraten een lijn kiest",
        description: "Verplaats een kandidaatlijn, verzamel de gekwadrateerde fouten in de SSE, bekijk de residuen en volg helling en intercept naar het minimum.",
      },
    },
    component: lazy(() => import("../concepts/least-squares/LeastSquaresPage")),
  },
  {
    id: "regression-diagnostics",
    themeId: "linear-regression",
    order: 2,
    copy: {
      en: {
        title: "Can we trust the fitted line?",
        description: "Release residuals into two diagnostic plots, compare their patterns, and see how using log₂(x) can reveal a linear relationship.",
      },
      nl: {
        title: "Kunnen we de regressielijn vertrouwen?",
        description: "Verplaats residuen naar twee diagnostische plots, vergelijk hun patronen en zie hoe log₂(x) een lineair verband zichtbaar kan maken.",
      },
    },
    component: lazy(() => import("../concepts/regression-diagnostics/RegressionDiagnosticsPage")),
  },
  {
    id: "ancova-additive",
    themeId: "linear-regression",
    order: 3,
    copy: {
      en: {
        title: "ANCOVA: comparing at the same baseline",
        description: "Fit three group means, add a shared baseline slope, and compare how adjustment changes treatment estimates, SEs, confidence intervals, and p-values.",
      },
      nl: {
        title: "ANCOVA: vergelijken bij dezelfde beginwaarde",
        description: "Schat drie groepsgemiddelden, voeg een gedeelde helling voor de beginwaarde toe en vergelijk wat de correctie doet met schattingen, standaardfouten, betrouwbaarheidsintervallen en p-waarden.",
      },
    },
    component: lazy(() => import("../concepts/ancova-additive/AncovaAdditivePage")),
  },
  {
    id: "interaction-model",
    themeId: "linear-regression",
    order: 4,
    copy: {
      en: {
        title: "Interaction: when groups have different slopes",
        description: "Move from parallel lines to different slopes, then compare the jaw difference at two insertion-torque values and test the product term.",
      },
      nl: {
        title: "Interactie: wanneer groepen verschillende hellingen hebben",
        description: "Ga van parallelle lijnen naar verschillende hellingen, vergelijk het kaakverschil bij twee waarden van het insertiekoppel en toets de productterm.",
      },
    },
    component: lazy(() => import("../concepts/interaction-model/InteractionModelPage")),
  },
];

export function findConcept(id: string | null) {
  if (id === null) {
    return null;
  }
  return conceptRegistry.find((entry) => entry.id === id) ?? null;
}

export function findTheme(id: string | null) {
  if (id === null) return null;
  return themeRegistry.find((entry) => entry.id === id) ?? null;
}

export function conceptsForTheme(themeId: string) {
  return conceptRegistry
    .filter((entry) => entry.themeId === themeId)
    .sort((first, second) => first.order - second.order);
}
