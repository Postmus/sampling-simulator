import type { Locale } from "../../i18n/LocaleContext";
import type { AncovaModelKind, AncovaTerm } from "./model";
import type { TreatmentGroup } from "./data";

export interface AncovaMessages {
  backAria: string;
  library: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  reduceMotion: string;
  presentation: string;
  exitPresentation: string;
  controls: {
    aria: string;
    caseTitle: string;
    caseText: string;
    questionTitle: string;
    questionText: string;
    modelPath: string;
    stepOne: string;
    stepOneHint: string;
    stepTwo: string;
    stepTwoHint: string;
    fitUnadjusted: string;
    showUnadjusted: string;
    addBaseline: string;
    showAdjusted: string;
    fitting: string;
    reset: string;
  };
  stage: {
    aria: string;
    observations: (count: number) => string;
    currentModel: string;
    noModel: string;
    modelNames: Record<AncovaModelKind, string>;
    plotTitle: string;
    xLabel: string;
    yLabel: string;
    referenceGroup: string;
    legend: Record<TreatmentGroup, string>;
    modelFormula: Record<AncovaModelKind, string>;
    coefficientTitle: string;
    coefficientSubtitleInitial: string;
    coefficientSubtitleUnadjusted: string;
    coefficientSubtitleAdjusted: string;
    coefficientSubtitleComparison: string;
    estimate: string;
    standardError: string;
    confidenceInterval: string;
    terms: Record<AncovaTerm, string>;
    notYetFit: string;
    statusInitial: string;
    statusUnadjusted: string;
    statusAdjusted: string;
    fullscreenUnavailable: string;
  };
}

export const ancovaMessages: Record<Locale, AncovaMessages> = {
  en: {
    backAria: "Back to Linear regression",
    library: "Linear regression",
    eyebrow: "Multiple-predictor models",
    title: "ANCOVA: comparing at the same baseline",
    subtitle: "Fit a treatment-only model, add baseline pocket depth, and watch the treatment comparisons change.",
    reduceMotion: "Reduce motion",
    presentation: "Presentation mode",
    exitPresentation: "Exit presentation",
    controls: {
      aria: "ANCOVA exploration controls",
      caseTitle: "Periodontal treatment study",
      caseText: "Ninety adults were randomized to three treatments. Pocket depth was measured at baseline and after three months.",
      questionTitle: "Research question",
      questionText: "Do three-month pocket depths differ between treatments when everyone is compared at the same baseline pocket depth?",
      modelPath: "Build the model",
      stepOne: "1 · Treatment only",
      stepOneHint: "Each fitted value is its group mean.",
      stepTwo: "2 · Add baseline",
      stepTwoHint: "One shared slope compares groups at the same baseline.",
      fitUnadjusted: "Fit treatment-only model",
      showUnadjusted: "Show treatment-only model",
      addBaseline: "Add baseline to model",
      showAdjusted: "Show adjusted model",
      fitting: "Fitting model…",
      reset: "Reset exploration",
    },
    stage: {
      aria: "Additive ANCOVA model comparison",
      observations: (count) => `${count} participants · 30 per group`,
      currentModel: "Current model",
      noModel: "No model fitted",
      modelNames: { unadjusted: "Treatment only", adjusted: "Treatment + baseline" },
      plotTitle: "From three group means to three parallel lines",
      xLabel: "Baseline pocket depth (mm)",
      yLabel: "Pocket depth after 3 months (mm)",
      referenceGroup: "Reference: standard treatment",
      legend: { standard: "Standard", rinse: "+ mouth rinse", adjunct: "+ local therapy" },
      modelFormula: {
        unadjusted: "Y_i = beta_0 + beta_1 times d_mond,i + beta_2 times d_aanv,i + epsilon_i",
        adjusted: "Y_i = beta_0 + beta_1 PDstart_i + beta_2 times d_mond,i + beta_3 times d_aanv,i + epsilon_i",
      },
      coefficientTitle: "Key treatment results",
      coefficientSubtitleInitial: "Fit the first model to reveal the treatment differences.",
      coefficientSubtitleUnadjusted: "Treatment differences are unadjusted differences between the observed group means.",
      coefficientSubtitleAdjusted: "Treatment differences are adjusted comparisons at the same baseline pocket depth.",
      coefficientSubtitleComparison: "Model 1 remains visible; Model 2 adds the baseline-adjusted differences underneath.",
      estimate: "Estimate",
      standardError: "SE",
      confidenceInterval: "95% CI",
      terms: {
        intercept: "Intercept / standard",
        baseline: "Baseline pocket depth",
        rinse: "Mouth rinse vs standard",
        adjunct: "Local therapy vs standard",
      },
      notYetFit: "Not fitted",
      statusInitial: "Fit the treatment-only model to place one horizontal line at each group mean.",
      statusUnadjusted: "The three horizontal lines are the fitted group means. Baseline has not entered the model yet.",
      statusAdjusted: "The shared baseline slope turns the group means into parallel lines; Model 2 shows the adjusted treatment differences.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar Lineaire regressie",
    library: "Lineaire regressie",
    eyebrow: "Modellen met meerdere voorspellers",
    title: "ANCOVA: vergelijken bij dezelfde beginwaarde",
    subtitle: "Schat eerst een model met alleen behandeling, voeg de beginwaarde toe en zie hoe de behandelingsvergelijkingen veranderen.",
    reduceMotion: "Verminder beweging",
    presentation: "Presentatiemodus",
    exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening voor de ANCOVA-verkenning",
      caseTitle: "Onderzoek naar parodontale behandeling",
      caseText: "Negentig volwassenen zijn gerandomiseerd over drie behandelingen. De pocketdiepte is bij de start en na drie maanden gemeten.",
      questionTitle: "Onderzoeksvraag",
      questionText: "Verschilt de pocketdiepte na drie maanden tussen de behandelingen wanneer iedereen bij dezelfde pocketdiepte bij de start wordt vergeleken?",
      modelPath: "Bouw het model",
      stepOne: "1 · Alleen behandeling",
      stepOneHint: "Iedere voorspelde waarde is het groepsgemiddelde.",
      stepTwo: "2 · Voeg beginwaarde toe",
      stepTwoHint: "Eén gedeelde helling vergelijkt de groepen bij dezelfde beginwaarde.",
      fitUnadjusted: "Schat model met alleen behandeling",
      showUnadjusted: "Toon model met alleen behandeling",
      addBaseline: "Voeg beginwaarde toe",
      showAdjusted: "Toon gecorrigeerd model",
      fitting: "Model schatten…",
      reset: "Verkenning herstellen",
    },
    stage: {
      aria: "Vergelijking van additieve ANCOVA-modellen",
      observations: (count) => `${count} deelnemers · 30 per groep`,
      currentModel: "Huidig model",
      noModel: "Nog geen model geschat",
      modelNames: { unadjusted: "Alleen behandeling", adjusted: "Behandeling + beginwaarde" },
      plotTitle: "Van drie groepsgemiddelden naar drie parallelle lijnen",
      xLabel: "Pocketdiepte bij de start (mm)",
      yLabel: "Pocketdiepte na 3 maanden (mm)",
      referenceGroup: "Referentie: standaardbehandeling",
      legend: { standard: "Standaard", rinse: "+ mondspoeling", adjunct: "+ lokale therapie" },
      modelFormula: {
        unadjusted: "Y_i = beta_0 + beta_1 maal d_mond,i + beta_2 maal d_aanv,i + epsilon_i",
        adjusted: "Y_i = beta_0 + beta_1 PDstart_i + beta_2 maal d_mond,i + beta_3 maal d_aanv,i + epsilon_i",
      },
      coefficientTitle: "Belangrijkste behandelingsresultaten",
      coefficientSubtitleInitial: "Schat het eerste model om de behandelingsverschillen zichtbaar te maken.",
      coefficientSubtitleUnadjusted: "De behandelingseffecten zijn ongecorrigeerde verschillen tussen de geobserveerde groepsgemiddelden.",
      coefficientSubtitleAdjusted: "De behandelingseffecten zijn gecorrigeerde vergelijkingen bij dezelfde pocketdiepte bij de start.",
      coefficientSubtitleComparison: "Model 1 blijft zichtbaar; Model 2 voegt daaronder de voor beginwaarde gecorrigeerde verschillen toe.",
      estimate: "Schatting",
      standardError: "SE",
      confidenceInterval: "95%-BI",
      terms: {
        intercept: "Intercept / standaard",
        baseline: "Pocketdiepte bij start",
        rinse: "Mondspoeling versus standaard",
        adjunct: "Lokale therapie versus standaard",
      },
      notYetFit: "Niet geschat",
      statusInitial: "Schat het model met alleen behandeling om op ieder groepsgemiddelde een horizontale lijn te plaatsen.",
      statusUnadjusted: "De drie horizontale lijnen zijn de geschatte groepsgemiddelden. De beginwaarde staat nog niet in het model.",
      statusAdjusted: "De gedeelde helling verandert de groepsgemiddelden in parallelle lijnen; Model 2 toont de gecorrigeerde behandelingsverschillen.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
