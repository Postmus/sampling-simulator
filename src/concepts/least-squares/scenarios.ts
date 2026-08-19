import type { RegressionPoint } from "./model";
import type { Locale } from "../../i18n/LocaleContext";

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
    points: [
      { id: "m1", x: 15.0511976962909, y: 552.423296480984 },
      { id: "m2", x: 14.0924045001157, y: 466.985134635298 },
      { id: "m3", x: 12.1649219653569, y: 547.244922603042 },
      { id: "m4", x: 11.1430156271905, y: 400.840992392189 },
      { id: "m5", x: 11.8628042879514, y: 431.261931090661 },
      { id: "m6", x: 15.0301869284362, y: 549.698844653414 },
      { id: "m7", x: 15.6672804920003, y: 476.522667202443 },
      { id: "m8", x: 12.9346448236145, y: 455.932138655518 },
      { id: "m9", x: 11.3610318870284, y: 394.072223226367 },
      { id: "m10", x: 14.2756469685584, y: 525.919263046889 },
      { id: "m11", x: 12.833512787614, y: 413.903610923807 },
      { id: "m12", x: 14.1936178611591, y: 528.786111116211 },
      { id: "m13", x: 11.0019582275301, y: 368.691953334192 },
      { id: "m14", x: 9.03110194662586, y: 322.037072548144 },
      { id: "m15", x: 11.834818326775, y: 427.411364189743 },
      { id: "m16", x: 11.2306612959132, y: 398.706915236378 },
      { id: "m17", x: 14.9058254544623, y: 448.250030297675 },
      { id: "m18", x: 9.64561858186498, y: 310.411879171614 },
      { id: "m19", x: 15.0405586079694, y: 489.021050272755 },
      { id: "m20", x: 9.70379156414419, y: 356.222729281472 },
      { id: "m21", x: 11.1119343685918, y: 408.537097136974 },
      { id: "m22", x: 10.896671886649, y: 407.74019923598 },
      { id: "m23", x: 9.56985897896811, y: 369.039417602456 },
      { id: "m24", x: 15.5047603926621, y: 548.054603793768 },
      { id: "m25", x: 9.29089233772829, y: 353.304150797072 },
      { id: "m26", x: 8.66743954028934, y: 323.309205573569 },
      { id: "m27", x: 12.1848133163527, y: 426.451291277419 },
      { id: "m28", x: 12.3514034015127, y: 499.010518958657 },
      { id: "m29", x: 10.4506413607858, y: 445.465928671487 },
      { id: "m30", x: 12.4248410584405, y: 486.148815689602 },
    ],
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
