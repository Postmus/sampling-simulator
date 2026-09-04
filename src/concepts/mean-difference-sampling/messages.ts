import type { Locale } from "../../i18n/LocaleContext";

export interface MeanDifferenceMessages {
  backAria: string;
  library: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  presentation: string;
  exitPresentation: string;
  controls: {
    aria: string;
    model: string;
    resetHint: string;
    vehicleMean: string;
    trueEffect: string;
    populationSd: string;
    sampleSize: string;
    animals: (size: number) => string;
    animationSpeed: string;
    slow: string;
    normal: string;
    fast: string;
    veryFast: string;
    run: string;
    drawOne: string;
    animateTen: string;
    generateHundred: string;
    pause: string;
    resume: string;
    resetReplay: string;
    options: string;
    showTrueValues: string;
    reduceMotion: string;
    seed: string;
    newSeed: string;
    summaryAria: string;
    summary: string;
    latestDifference: string;
    repeatedExperiments: string;
    empiricalSe: string;
    theoreticalSe: string;
  };
  stage: {
    aria: string;
    initialStatus: string;
    svgTitle: string;
    svgDescription: string;
    populationTitle: string;
    populationSubtitle: string;
    experimentTitle: string;
    experimentSubtitle: (size: number) => string;
    distributionTitle: string;
    distributionSubtitle: (width: string) => string;
    vehicle: string;
    gelX: string;
    trueMean: string;
    trueEffect: string;
    count: string;
    estimatedDifference: string;
    differenceFormula: (gelXMean: string, vehicleMean: string, estimate: string) => string;
    rangeTitle: (lower: string, upper: string, count: string, percentage: string, singular: boolean) => string;
  };
  status: {
    resetReplay: string;
    newSeed: string;
    configurationReset: string;
    reducedMotion: string;
    step1: (size: number) => string;
    step2: string;
    step3: (estimate: string) => string;
    step4: string;
    experimentSummary: (count: string, singular: boolean) => string;
    batch: (count: string) => string;
    paused: string;
    resumed: string;
    initial: string;
    fullscreenUnavailable: string;
  };
}

export const meanDifferenceMessages: Record<Locale, MeanDifferenceMessages> = {
  en: {
    backAria: "Back to Sampling distributions",
    library: "Sampling distributions",
    eyebrow: "Gel X animal experiment",
    title: "Sampling distribution of a mean difference",
    subtitle: "Repeat the same 12-versus-12 experiment and follow each estimated treatment effect",
    presentation: "Presentation mode",
    exitPresentation: "Exit presentation",
    controls: {
      aria: "Gel X simulation controls and summary",
      model: "Population model",
      resetHint: "Changing a value resets the run",
      vehicleMean: "Vehicle mean (%)",
      trueEffect: "True Gel X effect (pp)",
      populationSd: "Within-group SD (pp)",
      sampleSize: "Animals per group",
      animals: (size) => `n = ${size}`,
      animationSpeed: "Animation speed",
      slow: "Slow",
      normal: "Normal",
      fast: "Fast",
      veryFast: "Very fast",
      run: "Repeat experiment",
      drawOne: "Run 1 experiment",
      animateTen: "Animate 10",
      generateHundred: "Generate 100",
      pause: "Pause",
      resume: "Resume",
      resetReplay: "Reset / replay",
      options: "Display and replay options",
      showTrueValues: "Show true means and effect",
      reduceMotion: "Reduce motion",
      seed: "Seed",
      newSeed: "New seed",
      summaryAria: "Simulation summary",
      summary: "Simulation summary",
      latestDifference: "Latest mean difference",
      repeatedExperiments: "Repeated experiments",
      empiricalSe: "Empirical SE",
      theoreticalSe: "Model-based SE",
    },
    stage: {
      aria: "Animated Gel X experiments and sampling distribution",
      initialStatus: "Run one experiment to begin.",
      svgTitle: "Sampling distribution of the Gel X mean difference",
      svgDescription: "Vehicle and Gel X outcomes are drawn from two fixed Normal populations. Each experiment produces two group means and one mean difference, which moves into a histogram of repeated treatment-effect estimates.",
      populationTitle: "1  Two fixed treatment populations",
      populationSubtitle: "Only the treatment differs; both groups have the same within-group spread.",
      experimentTitle: "2  One Gel X experiment",
      experimentSubtitle: (size) => `${size} new animals receive vehicle and ${size} new animals receive Gel X.`,
      distributionTitle: "3  Sampling distribution of the estimated mean difference",
      distributionSubtitle: (width) => `Each experiment contributes one estimated difference to intervals of width ${width} percentage points.`,
      vehicle: "Vehicle",
      gelX: "Gel X",
      trueMean: "population mean",
      trueEffect: "true effect",
      count: "count",
      estimatedDifference: "estimated mean difference",
      differenceFormula: (gelXMean, vehicleMean, estimate) => ` = ${gelXMean} − ${vehicleMean} = ${estimate} pp`,
      rangeTitle: (lower, upper, count, percentage, singular) => `${lower} to ${upper}: ${count} estimate${singular ? "" : "s"} (${percentage}%)`,
    },
    status: {
      resetReplay: "Reset complete. The same seed will replay the same experiments.",
      newSeed: "A new random seed is ready. Run one experiment to begin.",
      configurationReset: "The population model or group size changed, so the sampling distribution has been reset.",
      reducedMotion: "Reduced motion is enabled. The same conceptual steps will appear without long movement.",
      step1: (size) => `Step 1 of 4: draw ${size} outcomes from each fixed treatment population.`,
      step2: "Step 2 of 4: place the new animals into the two observed treatment groups.",
      step3: (estimate) => `Step 3 of 4: subtract the vehicle mean from the Gel X mean. This experiment gives an estimated difference of ${estimate} percentage points.`,
      step4: "Step 4 of 4: move this experiment’s estimated effect into the sampling distribution.",
      experimentSummary: (count, singular) => `${count} repeated experiment${singular ? " has" : "s have"} produced ${count} treatment-effect estimate${singular ? "" : "s"}.`,
      batch: (count) => `${count} experiments were generated quickly. Every experiment contributed exactly one mean difference.`,
      paused: "Animation paused.",
      resumed: "Animation resumed.",
      initial: "Run one experiment to begin.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar Steekproevenverdelingen",
    library: "Steekproevenverdelingen",
    eyebrow: "Gel X-dierexperiment",
    title: "Steekproevenverdeling van een verschil tussen gemiddelden",
    subtitle: "Herhaal hetzelfde 12-tegen-12-experiment en volg ieder geschat behandelingseffect",
    presentation: "Presentatiemodus",
    exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening en samenvatting van de Gel X-simulatie",
      model: "Populatiemodel",
      resetHint: "Een wijziging herstelt de simulatie",
      vehicleMean: "Vehicle-gemiddelde (%)",
      trueEffect: "Werkelijk Gel X-effect (pp)",
      populationSd: "SD binnen groepen (pp)",
      sampleSize: "Dieren per groep",
      animals: (size) => `n = ${size}`,
      animationSpeed: "Animatiesnelheid",
      slow: "Langzaam",
      normal: "Normaal",
      fast: "Snel",
      veryFast: "Zeer snel",
      run: "Experiment herhalen",
      drawOne: "Voer 1 experiment uit",
      animateTen: "Animeer 10",
      generateHundred: "Genereer 100",
      pause: "Pauzeren",
      resume: "Hervatten",
      resetReplay: "Herstel / herhaal",
      options: "Weergave- en herhaalopties",
      showTrueValues: "Toon werkelijke gemiddelden en effect",
      reduceMotion: "Verminder beweging",
      seed: "Seed",
      newSeed: "Nieuwe seed",
      summaryAria: "Simulatiesamenvatting",
      summary: "Simulatiesamenvatting",
      latestDifference: "Laatste verschil",
      repeatedExperiments: "Herhaalde experimenten",
      empiricalSe: "Empirische SE",
      theoreticalSe: "Modelgebaseerde SE",
    },
    stage: {
      aria: "Geanimeerde Gel X-experimenten en steekproevenverdeling",
      initialStatus: "Voer één experiment uit om te beginnen.",
      svgTitle: "Steekproevenverdeling van het gemiddelde Gel X-verschil",
      svgDescription: "Uit twee vaste Normale populaties worden uitkomsten voor vehicle en Gel X getrokken. Elk experiment levert twee groepsgemiddelden en één verschil op, dat naar een histogram met herhaalde effectschattingen beweegt.",
      populationTitle: "1  Twee vaste behandelingspopulaties",
      populationSubtitle: "Alleen de behandeling verschilt; beide groepen hebben dezelfde spreiding binnen de groep.",
      experimentTitle: "2  Eén Gel X-experiment",
      experimentSubtitle: (size) => `${size} nieuwe dieren krijgen vehicle en ${size} nieuwe dieren krijgen Gel X.`,
      distributionTitle: "3  Steekproevenverdeling van het geschatte verschil",
      distributionSubtitle: (width) => `Elk experiment draagt één geschat verschil bij aan intervallen van ${width} procentpunt breed.`,
      vehicle: "Vehicle",
      gelX: "Gel X",
      trueMean: "populatiegemiddelde",
      trueEffect: "werkelijk effect",
      count: "aantal",
      estimatedDifference: "geschat verschil tussen gemiddelden",
      differenceFormula: (gelXMean, vehicleMean, estimate) => ` = ${gelXMean} − ${vehicleMean} = ${estimate} pp`,
      rangeTitle: (lower, upper, count, percentage, singular) => `${lower} tot ${upper}: ${count} schatting${singular ? "" : "en"} (${percentage}%)`,
    },
    status: {
      resetReplay: "Herstel voltooid. Met dezelfde seed worden dezelfde experimenten herhaald.",
      newSeed: "Een nieuwe willekeurige seed staat klaar. Voer één experiment uit om te beginnen.",
      configurationReset: "Het populatiemodel of de groepsgrootte is gewijzigd; de steekproevenverdeling is daarom hersteld.",
      reducedMotion: "Verminderde beweging is ingeschakeld. Dezelfde conceptuele stappen verschijnen zonder lange bewegingen.",
      step1: (size) => `Stap 1 van 4: trek ${size} uitkomsten uit iedere vaste behandelingspopulatie.`,
      step2: "Stap 2 van 4: plaats de nieuwe dieren in de twee waargenomen behandelingsgroepen.",
      step3: (estimate) => `Stap 3 van 4: trek het vehicle-gemiddelde af van het Gel X-gemiddelde. Dit experiment geeft een geschat verschil van ${estimate} procentpunt.`,
      step4: "Stap 4 van 4: verplaats het geschatte effect van dit experiment naar de steekproevenverdeling.",
      experimentSummary: (count, singular) => `${count} herhaald experiment${singular ? " heeft" : "en hebben"} ${count} effectschatting${singular ? "" : "en"} opgeleverd.`,
      batch: (count) => `${count} experimenten zijn snel gegenereerd. Ieder experiment droeg precies één verschil tussen gemiddelden bij.`,
      paused: "Animatie gepauzeerd.",
      resumed: "Animatie hervat.",
      initial: "Voer één experiment uit om te beginnen.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
