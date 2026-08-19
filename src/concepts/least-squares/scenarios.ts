import type { RegressionPoint } from "./model";
import type { Locale } from "../../i18n/LocaleContext";
import { masseterBiteForcePoints } from "../../domain/examples/masseterBiteForce";

export interface RegressionScenarioCopy {
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
}

export interface RegressionScenario {
  id: string;
  copy: Record<Locale, RegressionScenarioCopy>;
  xDomain: [number, number];
  yDomain: [number, number];
  slopeDomain: [number, number];
  interceptDomain: [number, number];
  slopeStep: number;
  interceptStep: number;
  initialSlope: number;
  initialIntercept: number;
  points: RegressionPoint[];
}

export const DEFAULT_REGRESSION_SCENARIO_ID = "masseter-bite-force";

export const regressionScenarios: RegressionScenario[] = [
  {
    id: "study-hours",
    copy: {
      en: { title: "Study hours and exam score", description: "A clear positive linear relationship with ordinary sample-to-sample variation.", xLabel: "Study hours per week", yLabel: "Exam score" },
      nl: { title: "Studie-uren en tentamencijfer", description: "Een duidelijk positief lineair verband met normale variatie tussen steekproeven.", xLabel: "Studie-uren per week", yLabel: "Tentamencijfer" },
    },
    xDomain: [0, 10],
    yDomain: [40, 100],
    slopeDomain: [-2, 10],
    interceptDomain: [25, 90],
    slopeStep: 0.1,
    interceptStep: 0.5,
    initialSlope: 0,
    initialIntercept: 70,
    points: [
      { id: "s1", x: 1, y: 52 },
      { id: "s2", x: 2, y: 58 },
      { id: "s3", x: 3, y: 57 },
      { id: "s4", x: 4, y: 66 },
      { id: "s5", x: 5, y: 72 },
      { id: "s6", x: 6, y: 70 },
      { id: "s7", x: 7, y: 79 },
      { id: "s8", x: 8, y: 83 },
      { id: "s9", x: 9, y: 93 },
    ],
  },
  {
    id: "masseter-bite-force",
    copy: {
      en: {
        title: "Masseter thickness and maximum bite force",
        description: "Measurements from 30 adults show a positive association between masseter thickness and maximum bite force.",
        xLabel: "Average masseter thickness (mm)",
        yLabel: "Maximum bite force (N)",
      },
      nl: {
        title: "Masseterdikte en maximale bijtkracht",
        description: "Metingen bij 30 volwassenen tonen een positief verband tussen masseterdikte en maximale bijtkracht.",
        xLabel: "Gemiddelde masseterdikte (mm)",
        yLabel: "Maximale bijtkracht (N)",
      },
    },
    xDomain: [8, 16],
    yDomain: [250, 600],
    slopeDomain: [-5, 55],
    interceptDomain: [-100, 500],
    slopeStep: 0.5,
    interceptStep: 2,
    initialSlope: 0,
    initialIntercept: 437.7135119698592,
    points: masseterBiteForcePoints,
  },
  {
    id: "screen-sleep",
    copy: {
      en: { title: "Screen time and sleep", description: "A negative relationship with modest noise around the fitted line.", xLabel: "Evening screen time (hours)", yLabel: "Sleep duration (hours)" },
      nl: { title: "Schermtijd en slaap", description: "Een negatief verband met beperkte ruis rond de best passende lijn.", xLabel: "Schermtijd in de avond (uren)", yLabel: "Slaapduur (uren)" },
    },
    xDomain: [0, 10],
    yDomain: [4.5, 10],
    slopeDomain: [-1, 0.5],
    interceptDomain: [4, 11],
    slopeStep: 0.02,
    interceptStep: 0.1,
    initialSlope: 0,
    initialIntercept: 7.3,
    points: [
      { id: "n1", x: 1, y: 8.8 },
      { id: "n2", x: 2, y: 8.2 },
      { id: "n3", x: 3, y: 8.4 },
      { id: "n4", x: 4, y: 7.5 },
      { id: "n5", x: 5, y: 7.6 },
      { id: "n6", x: 6, y: 6.8 },
      { id: "n7", x: 7, y: 6.5 },
      { id: "n8", x: 8, y: 6.2 },
      { id: "n9", x: 9, y: 5.7 },
    ],
  },
];

export function getRegressionScenario(id: string) {
  return regressionScenarios.find((scenario) => scenario.id === id) ??
    regressionScenarios.find((scenario) => scenario.id === DEFAULT_REGRESSION_SCENARIO_ID) ??
    regressionScenarios[0];
}
