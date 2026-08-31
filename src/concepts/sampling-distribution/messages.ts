import type { Locale } from "../../i18n/LocaleContext";

export interface SamplingMessages {
  backAria: string;
  library: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  presentation: string;
  exitPresentation: string;
  controls: {
    aria: string;
    populationAndSample: string;
    resetHint: string;
    populationMean: string;
    populationSd: string;
    sampleSize: string;
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
    showTrueMean: string;
    reduceMotion: string;
    seed: string;
    newSeed: string;
    summaryAria: string;
    summary: string;
    latestMean: string;
    repeatedSamples: string;
    empiricalSe: string;
  };
  stage: {
    aria: string;
    initialStatus: string;
    svgTitle: string;
    svgDescription: string;
    populationTitle: string;
    populationSubtitle: string;
    sampleTitle: string;
    sampleSubtitle: (size: number) => string;
    distributionTitle: string;
    distributionSubtitle: (width: string) => string;
    trueMean: string;
    count: string;
    sampleMean: string;
    mean: string;
    squaredRangeTitle: (lower: string, upper: string, count: string, percentage: string, singular: boolean) => string;
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
    sampleSummary: (count: string, singular: boolean) => string;
    batch: (count: string) => string;
    paused: string;
    resumed: string;
    initial: string;
    fullscreenUnavailable: string;
  };
}

export const samplingMessages: Record<Locale, SamplingMessages> = {
  en: {
    backAria: "Back to Sampling distributions", library: "Sampling distributions", eyebrow: "Sampling and estimation",
    title: "Sampling distribution of the sample mean", subtitle: "Variation across repeated samples from a normal population",
    presentation: "Presentation mode", exitPresentation: "Exit presentation",
    controls: {
      aria: "Simulation controls and summary", populationAndSample: "Population and sample", resetHint: "Changing a value resets the run",
      populationMean: "Population mean", populationSd: "Population SD", sampleSize: "Sample size", animationSpeed: "Animation speed",
      slow: "Slow", normal: "Normal", fast: "Fast", veryFast: "Very fast", run: "Run simulation", drawOne: "Draw 1 sample",
      animateTen: "Animate 10", generateHundred: "Generate 100", pause: "Pause", resume: "Resume", resetReplay: "Reset / replay",
      options: "Display and replay options", showTrueMean: "Show true mean", reduceMotion: "Reduce motion", seed: "Seed",
      newSeed: "New seed", summaryAria: "Simulation summary", summary: "Simulation summary", latestMean: "Latest sample mean",
      repeatedSamples: "Repeated samples", empiricalSe: "Empirical SE",
    },
    stage: {
      aria: "Animated sampling process", initialStatus: "Draw one sample to begin.", svgTitle: "Animated sampling journey",
      svgDescription: "A random sample appears in the population panel and moves to the sample panel. Its mean then moves into a histogram of means from repeated samples.",
      populationTitle: "1  Population model", populationSubtitle: "The population is fixed. Outlined orange points retain values from the latest sample.",
      sampleTitle: "2  One random sample", sampleSubtitle: (size) => `The observations vary from sample to sample, even though n = ${size} stays fixed.`,
      distributionTitle: "3  Sampling distribution of the sample mean",
      distributionSubtitle: (width) => `Bars count sample means in intervals of width ${width}. All panels share the same x-axis.`,
      trueMean: "true mean", count: "count", sampleMean: "sample mean", mean: "mean",
      squaredRangeTitle: (lower, upper, count, percentage, singular) => `${lower} to ${upper}: ${count} sample mean${singular ? "" : "s"} (${percentage}%)`,
    },
    status: {
      resetReplay: "Reset complete. The same seed will replay the same samples.", newSeed: "A new random seed is ready. Draw one sample to begin.",
      configurationReset: "The population or sample size changed, so the sampling distribution has been reset.",
      reducedMotion: "Reduced motion is enabled. The same conceptual steps will appear without long movement.",
      step1: (size) => `Step 1 of 4: draw ${size} random observations from the population.`,
      step2: "Step 2 of 4: retain the sampled values above and place the observations in panel 2.",
      step3: (estimate) => `Step 3 of 4: calculate the mean and mark its value, ${estimate}.`,
      step4: "Step 4 of 4: move only the calculated mean into the sampling distribution.",
      sampleSummary: (count, singular) => `${count} sample${singular ? " has" : "s have"} produced ${count} mean${singular ? "" : "s"}.`,
      batch: (count) => `${count} samples were generated quickly. Every sample contributed exactly one mean.`,
      paused: "Animation paused.", resumed: "Animation resumed.", initial: "Draw one sample to begin.",
      fullscreenUnavailable: "Fullscreen mode is not available in this browser.",
    },
  },
  nl: {
    backAria: "Terug naar Steekproevenverdelingen", library: "Steekproevenverdelingen", eyebrow: "Steekproeven en schatten",
    title: "Steekproevenverdeling van het steekproefgemiddelde", subtitle: "Variatie tussen herhaalde steekproeven uit een normale populatie",
    presentation: "Presentatiemodus", exitPresentation: "Presentatie afsluiten",
    controls: {
      aria: "Bediening en samenvatting van de simulatie", populationAndSample: "Populatie en steekproef", resetHint: "Een wijziging herstelt de simulatie",
      populationMean: "Populatiegemiddelde", populationSd: "Populatie-SD", sampleSize: "Steekproefgrootte", animationSpeed: "Animatiesnelheid",
      slow: "Langzaam", normal: "Normaal", fast: "Snel", veryFast: "Zeer snel", run: "Simulatie uitvoeren", drawOne: "Trek 1 steekproef",
      animateTen: "Animeer 10", generateHundred: "Genereer 100", pause: "Pauzeren", resume: "Hervatten", resetReplay: "Herstel / herhaal",
      options: "Weergave- en herhaalopties", showTrueMean: "Toon werkelijk gemiddelde", reduceMotion: "Verminder beweging", seed: "Seed",
      newSeed: "Nieuwe seed", summaryAria: "Samenvatting van de simulatie", summary: "Simulatiesamenvatting", latestMean: "Laatste steekproefgemiddelde",
      repeatedSamples: "Herhaalde steekproeven", empiricalSe: "Empirische SE",
    },
    stage: {
      aria: "Geanimeerd steekproefproces", initialStatus: "Trek één steekproef om te beginnen.", svgTitle: "Geanimeerde steekproefreis",
      svgDescription: "Een aselecte steekproef verschijnt in het populatiepaneel en beweegt naar het steekproefpaneel. Het gemiddelde beweegt daarna naar een histogram van gemiddelden uit herhaalde steekproeven.",
      populationTitle: "1  Populatiemodel", populationSubtitle: "De populatie ligt vast. Oranje omrande punten behouden de waarden uit de laatste steekproef.",
      sampleTitle: "2  Eén aselecte steekproef", sampleSubtitle: (size) => `De waarnemingen variëren per steekproef, terwijl n = ${size} gelijk blijft.`,
      distributionTitle: "3  Steekproevenverdeling van het steekproefgemiddelde",
      distributionSubtitle: (width) => `Balken tellen steekproefgemiddelden in intervallen met breedte ${width}. Alle panelen gebruiken dezelfde x-as.`,
      trueMean: "werkelijk gemiddelde", count: "aantal", sampleMean: "steekproefgemiddelde", mean: "gemiddelde",
      squaredRangeTitle: (lower, upper, count, percentage, singular) => `${lower} tot ${upper}: ${count} steekproefgemiddelde${singular ? "" : "n"} (${percentage}%)`,
    },
    status: {
      resetReplay: "Herstel voltooid. Met dezelfde seed worden dezelfde steekproeven herhaald.", newSeed: "Een nieuwe willekeurige seed staat klaar. Trek één steekproef om te beginnen.",
      configurationReset: "De populatie of steekproefgrootte is gewijzigd; de steekproevenverdeling is daarom hersteld.",
      reducedMotion: "Verminderde beweging is ingeschakeld. Dezelfde conceptuele stappen verschijnen zonder lange bewegingen.",
      step1: (size) => `Stap 1 van 4: trek ${size} aselecte waarnemingen uit de populatie.`,
      step2: "Stap 2 van 4: behoud de getrokken waarden bovenaan en plaats de waarnemingen in paneel 2.",
      step3: (estimate) => `Stap 3 van 4: bereken het gemiddelde en markeer de waarde ${estimate}.`,
      step4: "Stap 4 van 4: verplaats alleen het berekende gemiddelde naar de steekproevenverdeling.",
      sampleSummary: (count, singular) => `${count} steekproef${singular ? " heeft" : "en hebben"} ${count} gemiddelde${singular ? "" : "n"} opgeleverd.`,
      batch: (count) => `${count} steekproeven zijn snel gegenereerd. Iedere steekproef droeg precies één gemiddelde bij.`,
      paused: "Animatie gepauzeerd.", resumed: "Animatie hervat.", initial: "Trek één steekproef om te beginnen.",
      fullscreenUnavailable: "Volledig scherm is niet beschikbaar in deze browser.",
    },
  },
};
