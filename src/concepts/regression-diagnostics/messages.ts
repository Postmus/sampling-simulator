import type { Locale } from "../../i18n/LocaleContext";

export interface DiagnosticsMessages {
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
    example: string;
    teachingExample: string;
    model: string;
    predictor: string;
    rawPredictor: string;
    logPredictor: string;
    equation: string;
    animation: string;
    previous: string;
    next: string;
    play: string;
    pause: string;
    resume: string;
    replay: string;
    reset: string;
  };
  stage: {
    aria: string;
    svgTitle: string;
    svgDescription: string;
    observations: (count: number) => string;
    dataTitle: string;
    dataSubtitle: string;
    fittedTitle: string;
    fittedSubtitle: string;
    fittedAxis: string;
    residualAxis: string;
    countAxis: string;
    distributionTitle: string;
    distributionSubtitle: string;
    normalReference: string;
    zero: string;
    waiting: string;
  };
  status: {
    initial: string;
    fitted: string;
    residuals: string;
    fittedPlot: string;
    distribution: string;
    reference: string;
    transforming: string;
    transformed: string;
    newExample: string;
    reset: string;
    fullscreenUnavailable: string;
  };
}

export const diagnosticsMessages: Record<Locale, DiagnosticsMessages> = {
  en: {
    backAria: "Back to Linear regression",
    library: "Linear regression",
    eyebrow: "Relationships and regression",
    title: "Can we trust the fitted line?",
    subtitle: "Fit the model, release its residuals, and inspect the patterns they form.",
    reduceMotion: "Reduce motion",
    presentation: "Presentation mode",
    exitPresentation: "Exit presentation",
    controls: {
      aria: "Regression diagnostic demonstration controls",
      example: "Example",
      teachingExample: "Teaching example",
      model: "Model",
      predictor: "Predictor used in the model",
      rawPredictor: "x",
      logPredictor: "log₂(x)",
      equation: "Fitted equation",
      animation: "Animation",
      previous: "Previous",
      next: "Next",
      play: "Play",
      pause: "Pause",
      resume: "Resume",
      replay: "Replay",
      reset: "Reset",
    },
    stage: {
      aria: "Animated regression diagnostic visualization",
      svgTitle: "Regression residual diagnostic demonstration",
      svgDescription: "A scatterplot with its fitted equation and residuals above a residual dot plot with a normal reference curve and a residual-versus-fitted plot.",
      observations: (count) => `${count} observations`,
      dataTitle: "Data and fitted equation",
      dataSubtitle: "Each vertical segment is observed value − fitted value.",
      fittedTitle: "Residuals versus fitted values",
      fittedSubtitle: "Look for structure around the horizontal zero line.",
      fittedAxis: "Fitted value",
      residualAxis: "Residual",
      countAxis: "Count",
      distributionTitle: "Residual distribution",
      distributionSubtitle: "The same residuals are collected by signed value.",
      normalReference: "normal reference",
      zero: "zero",
      waiting: "Advance the animation to release the residuals into both diagnostic plots.",
    },
    status: {
      initial: "Begin with the observations, then build the fitted equation and its diagnostics.",
      fitted: "The least-squares equation is now fitted to the observations.",
      residuals: "Each vertical segment shows one observed value minus its fitted value.",
      fittedPlot: "A second copy of every residual is now moving to its fitted value and signed error.",
      distribution: "The first copy of every residual is collecting into the residual distribution.",
      reference: "The normal reference curve is added to help assess the shape of the residual distribution.",
      transforming: "The predictor scale and fitted equation are changing together.",
      transformed: "The model now uses log₂(x); equal horizontal steps represent successive doublings of x.",
      newExample: "A new teaching example is ready.",
      reset: "The demonstration has returned to the observations.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar Lineaire regressie",
    library: "Lineaire regressie",
    eyebrow: "Samenhang en regressie",
    title: "Kunnen we de regressielijn vertrouwen?",
    subtitle: "Pas het model, maak de residuen zichtbaar en onderzoek de patronen die ze vormen.",
    reduceMotion: "Verminder beweging",
    presentation: "Presentatiemodus",
    exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening voor de demonstratie van regressiediagnostiek",
      example: "Voorbeeld",
      teachingExample: "Onderwijsvoorbeeld",
      model: "Model",
      predictor: "Voorspeller in het model",
      rawPredictor: "x",
      logPredictor: "log₂(x)",
      equation: "Regressievergelijking",
      animation: "Animatie",
      previous: "Vorige",
      next: "Volgende",
      play: "Afspelen",
      pause: "Pauzeren",
      resume: "Hervatten",
      replay: "Opnieuw",
      reset: "Herstellen",
    },
    stage: {
      aria: "Geanimeerde visualisatie van regressiediagnostiek",
      svgTitle: "Demonstratie van diagnostiek met regressieresiduen",
      svgDescription: "Een spreidingsdiagram met regressievergelijking en residuen boven een residustippenplot met een normale referentiecurve en een plot van residuen tegen voorspelde waarden.",
      observations: (count) => `${count} waarnemingen`,
      dataTitle: "Data en regressievergelijking",
      dataSubtitle: "Elk verticaal lijnstuk is waargenomen waarde − voorspelde waarde.",
      fittedTitle: "Residuen tegen voorspelde waarden",
      fittedSubtitle: "Zoek naar structuur rond de horizontale nullijn.",
      fittedAxis: "Voorspelde waarde",
      residualAxis: "Residu",
      countAxis: "Aantal",
      distributionTitle: "Residuverdeling",
      distributionSubtitle: "Dezelfde residuen worden verzameld op basis van hun waarde met teken.",
      normalReference: "normale referentie",
      zero: "nul",
      waiting: "Ga verder met de animatie om de residuen naar beide diagnostische plots te verplaatsen.",
    },
    status: {
      initial: "Begin met de waarnemingen en bouw daarna de regressievergelijking en diagnostiek op.",
      fitted: "De kleinste-kwadratenvergelijking is nu aan de waarnemingen aangepast.",
      residuals: "Elk verticaal lijnstuk toont één waargenomen waarde min de voorspelde waarde.",
      fittedPlot: "Een tweede kopie van elk residu beweegt nu naar de bijbehorende voorspelde waarde en fout met teken.",
      distribution: "De eerste kopie van elk residu wordt verzameld in de residuverdeling.",
      reference: "De normale referentiecurve wordt toegevoegd om de vorm van de residuverdeling te beoordelen.",
      transforming: "De schaal van de voorspeller en de regressievergelijking veranderen samen.",
      transformed: "Het model gebruikt nu log₂(x); gelijke horizontale stappen stellen opeenvolgende verdubbelingen van x voor.",
      newExample: "Een nieuw onderwijsvoorbeeld staat klaar.",
      reset: "De demonstratie is teruggekeerd naar de waarnemingen.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
