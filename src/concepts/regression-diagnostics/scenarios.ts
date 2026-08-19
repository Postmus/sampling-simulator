import type { Locale } from "../../i18n/LocaleContext";
import type { RegressionPoint } from "../../domain/regression";
import { createRng } from "../../domain/rng";
import { drawNormal } from "../../domain/distributions/normal";
import { masseterBiteForcePoints } from "../../domain/examples/masseterBiteForce";

export type DiagnosticFocus = "linearity" | "variance" | "normality";

interface ScenarioCopy {
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  finding: string;
  transformedFinding?: string;
}

export interface DiagnosticScenario {
  id: string;
  focus: DiagnosticFocus;
  supportsLog: boolean;
  copy: Record<Locale, ScenarioCopy>;
  points: RegressionPoint[];
  xDomain: [number, number];
  logDomain?: [number, number];
  yDomain: [number, number];
  residualDomain: [number, number];
}

function makeNormalModelPoints(
  prefix: string,
  xs: readonly number[],
  modelXs: readonly number[],
  intercept: number,
  slope: number,
  errorSd: number | ((x: number) => number),
  seed: number,
) {
  const rng = createRng(seed);
  return xs.map((x, index) => ({
    id: `${prefix}${index + 1}`,
    x,
    y: intercept + slope * modelXs[index] + drawNormal({
      mean: 0,
      sd: typeof errorSd === "function" ? errorSd(x) : errorSd,
    }, rng),
  }));
}

function makeSkewedModelPoints(
  prefix: string,
  xs: readonly number[],
  intercept: number,
  slope: number,
  seed: number,
) {
  const rng = createRng(seed);
  return xs.map((x, index) => {
    let gammaDraw = 0;
    for (let draw = 0; draw < 4; draw += 1) {
      gammaDraw += -Math.log(Math.max(rng.next(), Number.EPSILON));
    }
    const centredSkewedError = (gammaDraw - 4) * 2.2;
    return {
      id: `${prefix}${index + 1}`,
      x,
      y: intercept + slope * x + centredSkewedError,
    };
  });
}

const linearXs = Array.from({ length: 32 }, (_, index) => index + 1);
const logXs = Array.from({ length: 32 }, (_, index) => 2 ** ((index * 5) / 31));
const logModelXs = logXs.map((value) => Math.log2(value));

// Fixed seeds make the lecture demonstration repeatable. The observations are nevertheless
// direct draws from the stated error models rather than hand-positioned residual patterns.

export const DEFAULT_DIAGNOSTIC_SCENARIO_ID = "masseter-bite-force";

export const diagnosticScenarios: DiagnosticScenario[] = [
  {
    id: "masseter-bite-force",
    focus: "normality",
    supportsLog: false,
    copy: {
      en: {
        title: "Masseter thickness and maximum bite force",
        description: "Continue with the same 30 adults and fitted equation from the least-squares demonstration.",
        xLabel: "Average masseter thickness (mm)",
        yLabel: "Maximum bite force (N)",
        finding: "There is no strong curved or funnel-shaped pattern. The residual distribution is broadly compatible with the normal reference, although a small sample need not follow it perfectly.",
      },
      nl: {
        title: "Masseterdikte en maximale bijtkracht",
        description: "Ga verder met dezelfde 30 volwassenen en regressievergelijking uit de demonstratie van kleinste kwadraten.",
        xLabel: "Gemiddelde masseterdikte (mm)",
        yLabel: "Maximale bijtkracht (N)",
        finding: "Er is geen sterk gebogen of trechtervormig patroon. De residuverdeling past globaal bij de normale referentie, al hoeft een kleine steekproef die niet perfect te volgen.",
      },
    },
    points: masseterBiteForcePoints,
    xDomain: [8, 16],
    yDomain: [250, 600],
    residualDomain: [-125, 125],
  },
  {
    id: "well-behaved",
    focus: "normality",
    supportsLog: false,
    copy: {
      en: {
        title: "A well-behaved linear model",
        description: "The relationship is linear, the residual spread is stable, and the errors are approximately normal.",
        xLabel: "Analgesic dose (mg/day)",
        yLabel: "Pain reduction score (0–100)",
        finding: "The residuals form an unstructured band with stable spread, and their distribution follows the normal reference reasonably closely.",
      },
      nl: {
        title: "Een goed passend lineair model",
        description: "Het verband is lineair, de residuspreiding is stabiel en de fouten zijn ongeveer normaal verdeeld.",
        xLabel: "Dosis pijnstiller (mg/dag)",
        yLabel: "Afname pijnscore (0–100)",
        finding: "De residuen vormen een structuurloze band met stabiele spreiding en hun verdeling volgt de normale referentie redelijk goed.",
      },
    },
    points: makeNormalModelPoints("b", linearXs, linearXs, 46, 1.4, 4.5, 89007),
    xDomain: [0, 33],
    yDomain: [38, 102],
    residualDomain: [-16, 16],
  },
  {
    id: "log-relationship",
    focus: "linearity",
    supportsLog: true,
    copy: {
      en: {
        title: "A logarithmic relationship",
        description: "Analgesic dose and pain reduction show diminishing returns across successive doublings.",
        xLabel: "Analgesic dose (mg/day)",
        yLabel: "Pain reduction score (0–100)",
        finding: "The curved residual pattern suggests that using x directly misses structure in the mean relationship.",
        transformedFinding: "With log₂(x) in the model, the residuals form a more even band around zero.",
      },
      nl: {
        title: "Een logaritmisch verband",
        description: "De dosis pijnstiller en afname van de pijnscore tonen afnemende meeropbrengsten bij opeenvolgende verdubbelingen.",
        xLabel: "Dosis pijnstiller (mg/dag)",
        yLabel: "Afname pijnscore (0–100)",
        finding: "Het gebogen residupatroon suggereert dat rechtstreeks gebruik van x structuur in het gemiddelde verband mist.",
        transformedFinding: "Met log₂(x) in het model vormen de residuen een gelijkmatigere band rond nul.",
      },
    },
    points: makeNormalModelPoints("l", logXs, logModelXs, 43, 10.2, 3, 86788),
    xDomain: [0, 34],
    logDomain: [0, 5],
    yDomain: [35, 105],
    residualDomain: [-20, 20],
  },
  {
    id: "increasing-spread",
    focus: "variance",
    supportsLog: false,
    copy: {
      en: {
        title: "Increasing residual spread",
        description: "The mean relationship is linear, but observations become more variable at higher fitted values.",
        xLabel: "Analgesic dose (mg/day)",
        yLabel: "Pain reduction score (0–100)",
        finding: "The widening funnel suggests that the error variance changes across the fitted values.",
      },
      nl: {
        title: "Toenemende residuspreiding",
        description: "Het gemiddelde verband is lineair, maar waarnemingen worden variabeler bij hogere voorspelde waarden.",
        xLabel: "Dosis pijnstiller (mg/dag)",
        yLabel: "Afname pijnscore (0–100)",
        finding: "De breder wordende trechter suggereert dat de foutvariantie verandert over de voorspelde waarden.",
      },
    },
    points: makeNormalModelPoints("v", linearXs, linearXs, 46, 1.4, (x) => 1.2 + 0.36 * x, 29),
    xDomain: [0, 33],
    yDomain: [34, 112],
    residualDomain: [-28, 28],
  },
  {
    id: "skewed-errors",
    focus: "normality",
    supportsLog: false,
    copy: {
      en: {
        title: "Right-skewed residuals",
        description: "Most errors are modest, while a longer positive tail makes the distribution asymmetric.",
        xLabel: "Analgesic dose (mg/day)",
        yLabel: "Pain reduction score (0–100)",
        finding: "The residual distribution is asymmetric and extends farther on the positive side than the normal reference shape.",
      },
      nl: {
        title: "Rechtsscheve residuen",
        description: "De meeste fouten zijn beperkt, terwijl een langere positieve staart de verdeling asymmetrisch maakt.",
        xLabel: "Dosis pijnstiller (mg/dag)",
        yLabel: "Afname pijnscore (0–100)",
        finding: "De residuverdeling is asymmetrisch en loopt aan de positieve kant verder door dan de normale referentievorm.",
      },
    },
    points: makeSkewedModelPoints("s", linearXs, 46, 1.4, 3),
    xDomain: [0, 33],
    yDomain: [38, 112],
    residualDomain: [-24, 24],
  },
];

export function getDiagnosticScenario(id: string) {
  return diagnosticScenarios.find((scenario) => scenario.id === id) ??
    diagnosticScenarios.find((scenario) => scenario.id === DEFAULT_DIAGNOSTIC_SCENARIO_ID) ??
    diagnosticScenarios[0];
}
