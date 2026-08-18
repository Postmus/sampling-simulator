import type { RegressionPoint } from "./model";

export interface RegressionScenario {
  id: string;
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
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

export const regressionScenarios: RegressionScenario[] = [
  {
    id: "study-hours",
    title: "Study hours and exam score",
    description: "A clear positive linear relationship with ordinary sample-to-sample variation.",
    xLabel: "Study hours per week",
    yLabel: "Exam score",
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
    id: "screen-sleep",
    title: "Screen time and sleep",
    description: "A negative relationship with modest noise around the fitted line.",
    xLabel: "Evening screen time (hours)",
    yLabel: "Sleep duration (hours)",
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
  {
    id: "leverage",
    title: "A high-leverage observation",
    description: "One observation far from the others in x has unusual power to rotate the line.",
    xLabel: "Practice sessions",
    yLabel: "Performance score",
    xDomain: [0, 13],
    yDomain: [40, 100],
    slopeDomain: [-2, 8],
    interceptDomain: [25, 90],
    slopeStep: 0.1,
    interceptStep: 0.5,
    initialSlope: 0,
    initialIntercept: 64.5,
    points: [
      { id: "l1", x: 1, y: 51 },
      { id: "l2", x: 2, y: 57 },
      { id: "l3", x: 3, y: 61 },
      { id: "l4", x: 4, y: 67 },
      { id: "l5", x: 5, y: 70 },
      { id: "l6", x: 6, y: 75 },
      { id: "l7", x: 12, y: 70.5 },
    ],
  },
  {
    id: "curved",
    title: "A relationship that is not linear",
    description: "A fitted line can miss a strong relationship when the underlying pattern is curved.",
    xLabel: "Temperature deviation",
    yLabel: "Energy use",
    xDomain: [-5.5, 5.5],
    yDomain: [25, 100],
    slopeDomain: [-8, 8],
    interceptDomain: [20, 90],
    slopeStep: 0.1,
    interceptStep: 0.5,
    initialSlope: 0,
    initialIntercept: 55.5,
    points: [
      { id: "c1", x: -5, y: 88 },
      { id: "c2", x: -4, y: 67 },
      { id: "c3", x: -3, y: 52 },
      { id: "c4", x: -2, y: 41 },
      { id: "c5", x: -1, y: 34 },
      { id: "c6", x: 0, y: 32 },
      { id: "c7", x: 1, y: 36 },
      { id: "c8", x: 2, y: 43 },
      { id: "c9", x: 3, y: 54 },
      { id: "c10", x: 4, y: 70 },
      { id: "c11", x: 5, y: 93.5 },
    ],
  },
];

export function getRegressionScenario(id: string) {
  return regressionScenarios.find((scenario) => scenario.id === id) ?? regressionScenarios[0];
}
