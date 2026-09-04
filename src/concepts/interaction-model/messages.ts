import type { Locale } from "../../i18n/LocaleContext";
import type { InteractionModelKind } from "./model";
import type { JawGroup } from "./data";

export interface InteractionMessages {
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
    fitAdditive: string;
    showAdditive: string;
    addInteraction: string;
    showInteraction: string;
    fitting: string;
    reset: string;
  };
  stage: {
    aria: string;
    observations: (count: number) => string;
    currentModel: string;
    noModel: string;
    modelNames: Record<InteractionModelKind, string>;
    plotTitle: string;
    xLabel: string;
    yLabel: string;
    referenceGroup: string;
    legend: Record<JawGroup, string>;
    modelFormula: Record<InteractionModelKind, string>;
    coefficientTitle: string;
    coefficientSubtitleInitial: string;
    coefficientSubtitleAdditive: string;
    coefficientSubtitleInteraction: string;
    coefficientSubtitleComparison: string;
    estimatedDifference: string;
    torquePanelTitle: string;
    torquePanelSubtitle: string;
    torqueA: string;
    torqueB: string;
    evaluationNote: string;
    constantDifference: string;
    changingDifference: string;
    statusInitial: string;
    statusAdditive: string;
    statusInteraction: string;
    fullscreenUnavailable: string;
  };
}

export const interactionMessages: Record<Locale, InteractionMessages> = {
  en: {
    backAria: "Back to Linear regression",
    library: "Linear regression",
    eyebrow: "Multiple-predictor models",
    title: "Interaction: when groups have different slopes",
    subtitle: "Fit parallel lines, add a product term, and compare the jaw difference at two insertion-torque values.",
    reduceMotion: "Reduce motion",
    presentation: "Presentation mode",
    exitPresentation: "Exit presentation",
    controls: {
      aria: "Interaction-model exploration controls",
      caseTitle: "Implant stability study",
      caseText: "Ninety-six adults received one implant in the upper or lower jaw. Insertion torque and primary implant stability were measured.",
      questionTitle: "Research question",
      questionText: "Does the mean ISQ increase per 1 Ncm higher insertion torque differ between the upper and lower jaw?",
      modelPath: "Build the model",
      stepOne: "1 · Additive model",
      stepOneHint: "One torque slope produces two parallel fitted lines.",
      stepTwo: "2 · Add interaction",
      stepTwoHint: "The product term allows the two torque slopes to differ.",
      fitAdditive: "Fit additive model",
      showAdditive: "Show additive model",
      addInteraction: "Add interaction term",
      showInteraction: "Show interaction model",
      fitting: "Fitting model…",
      reset: "Reset exploration",
    },
    stage: {
      aria: "Additive and interaction model comparison",
      observations: (count) => `${count} participants · 48 per jaw`,
      currentModel: "Current model",
      noModel: "No model fitted",
      modelNames: { additive: "Additive", interaction: "Interaction" },
      plotTitle: "From parallel lines to different slopes",
      xLabel: "Insertion torque (Ncm)",
      yLabel: "Primary implant stability (ISQ)",
      referenceGroup: "Reference: upper jaw",
      legend: { upper: "Upper jaw", lower: "Lower jaw" },
      modelFormula: {
        additive: "ISQ_i = beta_0 + beta_1 T_i + beta_2 times d_lower,i + epsilon_i",
        interaction: "ISQ_i = beta_0 + beta_1 T_i + beta_2 times d_lower,i + beta_3 times open parenthesis T_i times d_lower,i close parenthesis + epsilon_i",
      },
      coefficientTitle: "Jaw differences at A and B",
      coefficientSubtitleInitial: "Fit the additive model to reveal the estimated jaw differences.",
      coefficientSubtitleAdditive: "Model 1 compares the jaws at both selected torque values.",
      coefficientSubtitleInteraction: "Model 2 lets the jaw difference change with insertion torque.",
      coefficientSubtitleComparison: "Model 1 remains visible; Model 2 adds torque-dependent jaw differences underneath.",
      estimatedDifference: "Estimated difference",
      torquePanelTitle: "Choose two insertion-torque values",
      torquePanelSubtitle: "See whether the lower-versus-upper jaw difference stays constant or changes.",
      torqueA: "Torque A", torqueB: "Torque B",
      evaluationNote: "Changing the sliders evaluates the fitted models; it does not refit them.",
      constantDifference: "Same at A and B: parallel lines imply a constant jaw difference",
      changingDifference: "Different at A and B: the interaction makes the jaw difference depend on torque",
      statusInitial: "Fit the additive model to draw two parallel regression lines.",
      statusAdditive: "The fitted lines are parallel; compare their vertical gap at torque A and B.",
      statusInteraction: "The slopes now differ; compare how the jaw difference changes between torque A and B.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar Lineaire regressie",
    library: "Lineaire regressie",
    eyebrow: "Modellen met meerdere voorspellers",
    title: "Interactie: wanneer groepen verschillende hellingen hebben",
    subtitle: "Schat parallelle lijnen, voeg een productterm toe en vergelijk het kaakverschil bij twee waarden van het insertiekoppel.",
    reduceMotion: "Verminder beweging",
    presentation: "Presentatiemodus",
    exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening voor de interactieverkenning",
      caseTitle: "Onderzoek naar implantaatstabiliteit",
      caseText: "Zesennegentig volwassenen kregen één implantaat in de boven- of onderkaak. Het insertiekoppel en de primaire implantaatstabiliteit zijn gemeten.",
      questionTitle: "Onderzoeksvraag",
      questionText: "Verschilt de gemiddelde ISQ-toename per 1 Ncm hoger insertiekoppel tussen de bovenkaak en onderkaak?",
      modelPath: "Bouw het model",
      stepOne: "1 · Additief model",
      stepOneHint: "Eén helling voor insertiekoppel geeft twee parallelle lijnen.",
      stepTwo: "2 · Voeg interactie toe",
      stepTwoHint: "De productterm staat verschillende hellingen per kaak toe.",
      fitAdditive: "Schat additief model",
      showAdditive: "Toon additief model",
      addInteraction: "Voeg interactieterm toe",
      showInteraction: "Toon interactiemodel",
      fitting: "Model schatten…",
      reset: "Verkenning herstellen",
    },
    stage: {
      aria: "Vergelijking van additief model en interactiemodel",
      observations: (count) => `${count} deelnemers · 48 per kaak`,
      currentModel: "Huidig model",
      noModel: "Nog geen model geschat",
      modelNames: { additive: "Additief", interaction: "Interactie" },
      plotTitle: "Van parallelle lijnen naar verschillende hellingen",
      xLabel: "Insertiekoppel (Ncm)",
      yLabel: "Primaire implantaatstabiliteit (ISQ)",
      referenceGroup: "Referentie: bovenkaak",
      legend: { upper: "Bovenkaak", lower: "Onderkaak" },
      modelFormula: {
        additive: "ISQ_i = beta_0 + beta_1 T_i + beta_2 maal d_onder,i + epsilon_i",
        interaction: "ISQ_i = beta_0 + beta_1 T_i + beta_2 maal d_onder,i + beta_3 maal open haakje T_i maal d_onder,i sluit haakje + epsilon_i",
      },
      coefficientTitle: "Kaakverschillen bij A en B",
      coefficientSubtitleInitial: "Schat het additieve model om de geschatte kaakverschillen zichtbaar te maken.",
      coefficientSubtitleAdditive: "Model 1 vergelijkt de kaken bij beide gekozen koppelwaarden.",
      coefficientSubtitleInteraction: "Model 2 laat het kaakverschil veranderen met het insertiekoppel.",
      coefficientSubtitleComparison: "Model 1 blijft zichtbaar; Model 2 voegt daaronder koppelafhankelijke kaakverschillen toe.",
      estimatedDifference: "Geschat verschil",
      torquePanelTitle: "Kies twee waarden van het insertiekoppel",
      torquePanelSubtitle: "Bekijk of het verschil tussen onder- en bovenkaak constant blijft of verandert.",
      torqueA: "Koppel A", torqueB: "Koppel B",
      evaluationNote: "De schuifregelaars evalueren de geschatte modellen; ze schatten deze niet opnieuw.",
      constantDifference: "Gelijk bij A en B: parallelle lijnen geven een constant kaakverschil",
      changingDifference: "Verschillend bij A en B: door interactie hangt het kaakverschil af van het koppel",
      statusInitial: "Schat het additieve model om twee parallelle regressielijnen te tekenen.",
      statusAdditive: "De geschatte lijnen zijn parallel; vergelijk hun verticale afstand bij koppel A en B.",
      statusInteraction: "De hellingen verschillen nu; vergelijk hoe het kaakverschil verandert tussen koppel A en B.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
