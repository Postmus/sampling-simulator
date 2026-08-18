import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Locale } from "../i18n/LocaleContext";

interface ConceptCopy {
  title: string;
  category: string;
  description: string;
}

export interface ConceptDefinition {
  id: string;
  copy: Record<Locale, ConceptCopy>;
  component: LazyExoticComponent<ComponentType>;
}

export const conceptRegistry: ConceptDefinition[] = [
  {
    id: "sampling-distribution",
    copy: {
      en: {
        title: "Sampling distribution of the mean",
        category: "Sampling and estimation",
        description: "Follow observations from a fixed population into one sample, then watch one mean from every sample build a new distribution.",
      },
      nl: {
        title: "Steekproevenverdeling van het gemiddelde",
        category: "Steekproeven en schatten",
        description: "Volg waarnemingen uit een vaste populatie naar één steekproef en zie vervolgens hoe het gemiddelde van iedere steekproef een nieuwe verdeling opbouwt.",
      },
    },
    component: lazy(() => import("../concepts/sampling-distribution/SamplingDistributionPage")),
  },
  {
    id: "least-squares",
    copy: {
      en: {
        title: "How least squares chooses a line",
        category: "Relationships and regression",
        description: "Move a candidate line, collect its squared errors into SSE, inspect its residuals, and follow slope and intercept to the minimum.",
      },
      nl: {
        title: "Hoe kleinste kwadraten een lijn kiest",
        category: "Samenhang en regressie",
        description: "Verplaats een kandidaatlijn, verzamel de gekwadrateerde fouten in de SSE, bekijk de residuen en volg helling en intercept naar het minimum.",
      },
    },
    component: lazy(() => import("../concepts/least-squares/LeastSquaresPage")),
  },
];

export function findConcept(id: string | null) {
  if (id === null) {
    return null;
  }
  return conceptRegistry.find((entry) => entry.id === id) ?? null;
}
