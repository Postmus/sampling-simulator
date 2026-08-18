import type { Locale } from "../../i18n/LocaleContext";

export interface LeastSquaresMessages {
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
    dataset: string;
    teachingScenario: string;
    candidateLine: string;
    moveParameter: string;
    slope: string;
    intercept: string;
    evaluating: string;
    evaluated: string;
    evaluate: string;
    findingMinimum: string;
    bestFitFound: string;
    confirmBestFit: string;
    findBestFit: string;
    reset: string;
    metricsAria: string;
    lineAndError: string;
    candidateEquation: string;
    candidateSse: string;
    minimumSse: string;
  };
  stage: {
    aria: string;
    observations: (count: number) => string;
    svgTitle: string;
    svgDescription: string;
    dataTitle: string;
    dataSubtitle: string;
    meanOfY: string;
    landscapeTitle: string;
    landscapeLine: string;
    landscapeColor: string;
    slope: string;
    intercept: string;
    minimum: string;
    candidate: string;
    mapHelp: string;
    sseTitle: string;
    sseSubtitle: string;
    squaredResidual: string;
    runningSse: string;
    chooseEvaluate: string;
    residualTitle: string;
    residualDefinition: string;
    residualDirection: string;
    residual: string;
    residualPlaceholder: string;
  };
  status: {
    initial: string;
    newDataset: string;
    lineMoved: string;
    revealSquares: string;
    collectResiduals: string;
    collectSse: string;
    fitComplete: string;
    candidateComplete: string;
    search: string;
    minimumFound: string;
    reset: string;
    fullscreenUnavailable: string;
  };
}

export const leastSquaresMessages: Record<Locale, LeastSquaresMessages> = {
  en: {
    backAria: "Back to concept library",
    library: "Library",
    eyebrow: "Relationships and regression",
    title: "How does least squares choose a line?",
    subtitle: "Move a candidate line, inspect its errors, and follow it to the unique minimum.",
    reduceMotion: "Reduce motion",
    presentation: "Presentation mode",
    exitPresentation: "Exit presentation",
    controls: {
      aria: "Regression exploration controls", dataset: "Dataset", teachingScenario: "Teaching scenario",
      candidateLine: "Candidate line", moveParameter: "Move either parameter", slope: "Slope", intercept: "Intercept",
      evaluating: "Evaluating line…", evaluated: "Line evaluated", evaluate: "Evaluate this line",
      findingMinimum: "Finding the minimum…", bestFitFound: "Best fit found",
      confirmBestFit: "Confirm best-fitting line", findBestFit: "Find best-fitting line", reset: "Reset line",
      metricsAria: "Regression metrics", lineAndError: "Line and error", candidateEquation: "Candidate equation",
      candidateSse: "Candidate SSE", minimumSse: "Minimum SSE",
    },
    stage: {
      aria: "Least-squares visualization", observations: (count) => `${count} observations`,
      svgTitle: "Interactive least-squares regression",
      svgDescription: "A scatterplot with a mean line, candidate regression line, residual squares, an animated squared-error accumulator, a slope-intercept error map, and a residual plot for the current line.",
      dataTitle: "Data, deviations, and squared errors",
      dataSubtitle: "The dashed mean line is the reference model; every square has side length |residual|.",
      meanOfY: "mean of y", landscapeTitle: "Squared-error landscape", landscapeLine: "Every location represents one line.",
      landscapeColor: "Darker green means a smaller SSE.", slope: "slope", intercept: "intercept", minimum: "minimum",
      candidate: "candidate", mapHelp: "Move either slider to travel across this map.", sseTitle: "Sum of squared errors",
      sseSubtitle: "Each colored segment contributes one eᵢ² to the running total.", squaredResidual: "Squared residual",
      runningSse: "running SSE", chooseEvaluate: "Choose “Evaluate this line”", residualTitle: "Residuals from the current line",
      residualDefinition: "Residual = observed value − predicted value.",
      residualDirection: "Negative means below the line; positive means above the line.", residual: "Residual",
      residualPlaceholder: "Evaluate the candidate line to collect its signed residuals.",
    },
    status: {
      initial: "Move the candidate line, then evaluate it to collect its squared and signed residuals.",
      newDataset: "A new dataset is ready. Move the candidate line, then evaluate it.",
      lineMoved: "The candidate line moved. Choose “Evaluate this line” when you are satisfied with it.",
      revealSquares: "Each vertical residual is expanding into a square with side length |residual|.",
      collectResiduals: "The current line’s signed residuals are moving onto the residual axis.",
      collectSse: "The residual squares are collecting into the current line’s total SSE.",
      fitComplete: "Best fit complete: the residual plot shows its signed errors, and the bar is the minimum SSE.",
      candidateComplete: "The lower panels now summarize the current candidate line.",
      search: "Searching the slope–intercept landscape for the smallest sum of squared residuals.",
      minimumFound: "Minimum found. Its squared and signed residuals will now be collected automatically.",
      reset: "The candidate line is reset. Adjust it, then choose “Evaluate this line”.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar de conceptbibliotheek", library: "Bibliotheek", eyebrow: "Samenhang en regressie",
    title: "Hoe kiest de kleinste-kwadratenmethode een lijn?",
    subtitle: "Verplaats een kandidaatlijn, bekijk de fouten en volg de lijn naar het unieke minimum.",
    reduceMotion: "Verminder beweging", presentation: "Presentatiemodus", exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening voor regressieverkenning", dataset: "Dataset", teachingScenario: "Onderwijsscenario",
      candidateLine: "Kandidaatlijn", moveParameter: "Pas een van beide parameters aan", slope: "Helling", intercept: "Intercept",
      evaluating: "Lijn evalueren…", evaluated: "Lijn geëvalueerd", evaluate: "Evalueer deze lijn",
      findingMinimum: "Minimum zoeken…", bestFitFound: "Beste lijn gevonden",
      confirmBestFit: "Bevestig best passende lijn", findBestFit: "Vind best passende lijn", reset: "Herstel lijn",
      metricsAria: "Regressiematen", lineAndError: "Lijn en fout", candidateEquation: "Vergelijking kandidaatlijn",
      candidateSse: "SSE kandidaatlijn", minimumSse: "Minimale SSE",
    },
    stage: {
      aria: "Visualisatie van kleinste kwadraten", observations: (count) => `${count} waarnemingen`,
      svgTitle: "Interactieve kleinste-kwadratenregressie",
      svgDescription: "Een spreidingsdiagram met een gemiddelde lijn, kandidaatlijn, residukwadraten, een geanimeerde SSE-balk, een foutenlandschap en een residuplot voor de huidige lijn.",
      dataTitle: "Data, afwijkingen en gekwadrateerde fouten",
      dataSubtitle: "De gestreepte gemiddelde lijn is het referentiemodel; ieder vierkant heeft zijde |residu|.",
      meanOfY: "gemiddelde van y", landscapeTitle: "SSE-landschap", landscapeLine: "Iedere positie stelt één lijn voor.",
      landscapeColor: "Donkergroen betekent een kleinere SSE.", slope: "helling", intercept: "intercept", minimum: "minimum",
      candidate: "kandidaat", mapHelp: "Verplaats een schuifregelaar om door deze kaart te bewegen.",
      sseTitle: "Som van gekwadrateerde fouten", sseSubtitle: "Ieder gekleurd segment draagt één eᵢ² bij aan het totaal.",
      squaredResidual: "Gekwadrateerd residu", runningSse: "lopende SSE", chooseEvaluate: "Kies ‘Evalueer deze lijn’",
      residualTitle: "Residuen van de huidige lijn", residualDefinition: "Residu = waargenomen waarde − voorspelde waarde.",
      residualDirection: "Negatief betekent onder de lijn; positief betekent erboven.", residual: "Residu",
      residualPlaceholder: "Evalueer de kandidaatlijn om de residuen te verzamelen.",
    },
    status: {
      initial: "Verplaats de kandidaatlijn en evalueer deze daarna om de gekwadrateerde residuen en de residuen met teken te verzamelen.",
      newDataset: "Een nieuwe dataset staat klaar. Verplaats de kandidaatlijn en evalueer deze daarna.",
      lineMoved: "De kandidaatlijn is verplaatst. Kies ‘Evalueer deze lijn’ wanneer u tevreden bent.",
      revealSquares: "Ieder verticaal residu wordt een vierkant met zijde |residu|.",
      collectResiduals: "De residuen met teken van de huidige lijn bewegen naar de residuas.",
      collectSse: "De residukwadraten worden verzameld in de totale SSE van de huidige lijn.",
      fitComplete: "Beste lijn voltooid: de residuplot toont de fouten met teken en de balk is de minimale SSE.",
      candidateComplete: "De onderste panelen vatten nu de huidige kandidaatlijn samen.",
      search: "Zoeken in het helling-interceptlandschap naar de kleinste som van gekwadrateerde residuen.",
      minimumFound: "Minimum gevonden. De gekwadrateerde residuen en de residuen met teken worden nu automatisch verzameld.",
      reset: "De kandidaatlijn is hersteld. Pas haar aan en kies daarna ‘Evalueer deze lijn’.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
