import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface ConceptDefinition {
  id: string;
  title: string;
  category: string;
  description: string;
  component: LazyExoticComponent<ComponentType>;
}

export const conceptRegistry: ConceptDefinition[] = [
  {
    id: "sampling-distribution",
    title: "Sampling distribution of the mean",
    category: "Sampling and estimation",
    description:
      "Follow observations from a fixed population into one sample, then watch one mean from every sample build a new distribution.",
    component: lazy(() => import("../concepts/sampling-distribution/SamplingDistributionPage")),
  },
  {
    id: "least-squares",
    title: "How least squares chooses a line",
    category: "Relationships and regression",
    description:
      "Move a candidate line, collect its squared errors into SSE, inspect its residuals, and follow slope and intercept to the minimum.",
    component: lazy(() => import("../concepts/least-squares/LeastSquaresPage")),
  },
];

export function findConcept(id: string | null) {
  if (id === null) {
    return null;
  }
  return conceptRegistry.find((entry) => entry.id === id) ?? null;
}
