import type { Locale } from "../../i18n/LocaleContext";
import type { InteractionModelKind, InteractionTerm } from "./model";
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
    interpretationTitle: string;
    interpretationInitial: string;
    interpretationAdditive: string;
    interpretationInteraction: string;
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
    modelSummary: string;
    residualSe: string;
    rSquared: string;
    residualDf: string;
    modelFormula: Record<InteractionModelKind, string>;
    coefficientTitle: string;
    coefficientSubtitleInitial: string;
    coefficientSubtitleAdditive: string;
    coefficientSubtitleInteraction: string;
    term: string;
    estimate: string;
    standardError: string;
    confidenceInterval: string;
    pValue: string;
    coefficientTerms: Record<InteractionTerm, string>;
    torquePanelTitle: string;
    torquePanelSubtitle: string;
    openTorquePanel: string;
    closeTorquePanel: string;
    torqueA: string;
    torqueB: string;
    evaluationNote: string;
    predictionsTitle: string;
    predictedIsq: string;
    activePredictions: (model: string) => string;
    jawDifference: string;
    additiveDifference: string;
    interactionDifference: string;
    constantDifference: string;
    changingDifference: string;
    comparisonTitle: string;
    comparisonSubtitle: string;
    additiveModel: string;
    interactionModel: string;
    rSquaredChange: string;
    partialF: string;
    interactionTest: string;
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
      interpretationTitle: "What to notice",
      interpretationInitial: "Start with the additive model. Parallel lines imply one constant lower-versus-upper jaw difference.",
      interpretationAdditive: "The jaw difference is the same at torque A and B because both fitted lines have the same slope.",
      interpretationInteraction: "The product term changes the lower-jaw slope. The jaw difference can therefore change with insertion torque.",
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
      modelSummary: "Model summary",
      residualSe: "Residual SE",
      rSquared: "R²",
      residualDf: "Residual df",
      modelFormula: {
        additive: "ISQ_i = beta_0 + beta_1 T_i + beta_2 times d_lower,i + epsilon_i",
        interaction: "ISQ_i = beta_0 + beta_1 T_i + beta_2 times d_lower,i + beta_3 times open parenthesis T_i times d_lower,i close parenthesis + epsilon_i",
      },
      coefficientTitle: "Estimated regression coefficients",
      coefficientSubtitleInitial: "Fit the additive model to reveal its coefficients and uncertainty.",
      coefficientSubtitleAdditive: "The additive model forces the insertion-torque slope to be equal in both jaws.",
      coefficientSubtitleInteraction: "The product term estimates how much the lower-jaw slope differs from the upper-jaw slope.",
      term: "Term", estimate: "Estimate", standardError: "SE", confidenceInterval: "95% CI", pValue: "p-value",
      coefficientTerms: { intercept: "(Constant)", torque: "Insertion torque", lower: "d_lower", interaction: "Torque × d_lower" },
      torquePanelTitle: "Compare two insertion-torque values",
      torquePanelSubtitle: "See whether the lower-versus-upper jaw difference stays constant or changes.",
      openTorquePanel: "Open comparison", closeTorquePanel: "Collapse comparison",
      torqueA: "Torque A", torqueB: "Torque B",
      evaluationNote: "Changing the sliders evaluates the fitted models; it does not refit them.",
      predictionsTitle: "Predicted ISQ and jaw differences",
      predictedIsq: "Predicted ISQ",
      activePredictions: (model) => `Predictions from the ${model.toLowerCase()} model`,
      jawDifference: "Lower − upper jaw",
      additiveDifference: "Additive model: lower − upper",
      interactionDifference: "Interaction model: lower − upper",
      constantDifference: "Same at A and B: parallel lines imply a constant jaw difference",
      changingDifference: "Different at A and B: the interaction makes the jaw difference depend on torque",
      comparisonTitle: "Does the product term improve the model?",
      comparisonSubtitle: "The partial F-test compares the additive model with the model that also contains the interaction term.",
      additiveModel: "Additive", interactionModel: "Interaction", rSquaredChange: "Change in R²", partialF: "Partial F-test", interactionTest: "Interaction term",
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
      interpretationTitle: "Let hierop",
      interpretationInitial: "Begin met het additieve model. Parallelle lijnen betekenen één constant verschil tussen onder- en bovenkaak.",
      interpretationAdditive: "Het kaakverschil is gelijk bij koppel A en B omdat beide lijnen dezelfde helling hebben.",
      interpretationInteraction: "De productterm verandert de helling voor de onderkaak. Het kaakverschil kan daardoor veranderen met het insertiekoppel.",
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
      modelSummary: "Modelsamenvatting",
      residualSe: "Residuele SE",
      rSquared: "R²",
      residualDf: "Residuele df",
      modelFormula: {
        additive: "ISQ_i = beta_0 + beta_1 T_i + beta_2 maal d_onder,i + epsilon_i",
        interaction: "ISQ_i = beta_0 + beta_1 T_i + beta_2 maal d_onder,i + beta_3 maal open haakje T_i maal d_onder,i sluit haakje + epsilon_i",
      },
      coefficientTitle: "Geschatte regressiecoëfficiënten",
      coefficientSubtitleInitial: "Schat het additieve model om de coëfficiënten en hun onzekerheid zichtbaar te maken.",
      coefficientSubtitleAdditive: "Het additieve model dwingt dezelfde helling voor insertiekoppel in beide kaken af.",
      coefficientSubtitleInteraction: "De productterm schat hoeveel de helling in de onderkaak verschilt van die in de bovenkaak.",
      term: "Term", estimate: "Schatting", standardError: "SE", confidenceInterval: "95%-BI", pValue: "p-waarde",
      coefficientTerms: { intercept: "(Constante)", torque: "Insertiekoppel", lower: "d_onder", interaction: "Insertiekoppel × d_onder" },
      torquePanelTitle: "Vergelijk twee waarden van het insertiekoppel",
      torquePanelSubtitle: "Bekijk of het verschil tussen onder- en bovenkaak constant blijft of verandert.",
      openTorquePanel: "Vergelijking openen", closeTorquePanel: "Vergelijking inklappen",
      torqueA: "Koppel A", torqueB: "Koppel B",
      evaluationNote: "De schuifregelaars evalueren de geschatte modellen; ze schatten deze niet opnieuw.",
      predictionsTitle: "Voorspelde ISQ en kaakverschillen",
      predictedIsq: "Voorspelde ISQ",
      activePredictions: (model) => `Voorspellingen uit huidig model: ${model}`,
      jawDifference: "Onderkaak − bovenkaak",
      additiveDifference: "Additief model: onder − boven",
      interactionDifference: "Interactiemodel: onder − boven",
      constantDifference: "Gelijk bij A en B: parallelle lijnen geven een constant kaakverschil",
      changingDifference: "Verschillend bij A en B: door interactie hangt het kaakverschil af van het koppel",
      comparisonTitle: "Verbetert de productterm het model?",
      comparisonSubtitle: "De partiële F-toets vergelijkt het additieve model met het model dat ook de interactieterm bevat.",
      additiveModel: "Additief", interactionModel: "Interactie", rSquaredChange: "Verandering in R²", partialF: "Partiële F-toets", interactionTest: "Interactieterm",
      statusInitial: "Schat het additieve model om twee parallelle regressielijnen te tekenen.",
      statusAdditive: "De geschatte lijnen zijn parallel; vergelijk hun verticale afstand bij koppel A en B.",
      statusInteraction: "De hellingen verschillen nu; vergelijk hoe het kaakverschil verandert tussen koppel A en B.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
