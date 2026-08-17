import { drawSample } from "../src/core/populations";
import { createRng, randomSeed, type RNG } from "../src/core/rng";
import { sampleMean, standardDeviation } from "../src/core/statistics";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 1200;
const LEFT = 92;
const RIGHT = 1140;
const PLOT_WIDTH = RIGHT - LEFT;
const POPULATION_AXIS_Y = 224;
const SAMPLE_AXIS_Y = 438;
const DISTRIBUTION_AXIS_Y = 700;
const HISTOGRAM_TOP_Y = 582;
const HISTOGRAM_BOTTOM_Y = DISTRIBUTION_AXIS_Y - 2;

interface Configuration {
  mean: number;
  sd: number;
  sampleSize: number;
}

interface Point {
  x: number;
  y: number;
}

interface HistogramPlan {
  binWidth: number;
  start: number;
  binCount: number;
}

const stage = requireElement<SVGSVGElement>("sampling-stage");
const populationLayer = requireElement<SVGGElement>("population-layer");
const populationSampleLayer = requireElement<SVGGElement>("population-sample-layer");
const sampleLayer = requireElement<SVGGElement>("sample-layer");
const meanLayer = requireElement<SVGGElement>("mean-layer");
const distributionReferenceLayer = requireElement<SVGGElement>("distribution-reference-layer");
const histogramLayer = requireElement<SVGGElement>("histogram-layer");
const transitionLayer = requireElement<SVGGElement>("transition-layer");
const annotationLayer = requireElement<SVGGElement>("annotation-layer");

const meanInput = requireElement<HTMLInputElement>("population-mean");
const sdInput = requireElement<HTMLInputElement>("population-sd");
const sampleSizeInput = requireElement<HTMLSelectElement>("sample-size");
const speedInput = requireElement<HTMLSelectElement>("animation-speed");
const showTrueMeanInput = requireElement<HTMLInputElement>("show-true-mean");
const reduceMotionInput = requireElement<HTMLInputElement>("reduce-motion");

const drawOneButton = requireElement<HTMLButtonElement>("draw-one");
const animateTenButton = requireElement<HTMLButtonElement>("animate-ten");
const generateHundredButton = requireElement<HTMLButtonElement>("generate-hundred");
const pauseButton = requireElement<HTMLButtonElement>("pause");
const resetButton = requireElement<HTMLButtonElement>("reset");
const newSeedButton = requireElement<HTMLButtonElement>("new-seed");
const fullscreenButton = requireElement<HTMLButtonElement>("fullscreen-button");

const statusOutput = requireElement<HTMLElement>("status");
const seedOutput = requireElement<HTMLOutputElement>("seed-output");
const latestMeanOutput = requireElement<HTMLElement>("latest-mean");
const sampleCountOutput = requireElement<HTMLElement>("sample-count");
const empiricalSeOutput = requireElement<HTMLElement>("empirical-se");

let configuration: Configuration = readConfiguration();
let seed = 314159;
let rng: RNG = createRng(seed);
let estimates: number[] = [];
let latestSample: number[] = [];
let latestEstimate: number | null = null;
let busy = false;
let paused = false;
let runToken = 0;
const activeAnimations = new Set<Animation>();

function requireElement<T extends Element>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as unknown as T;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function clear(element: Element) {
  element.replaceChildren();
}

function appendText(
  parent: SVGElement,
  text: string,
  x: number,
  y: number,
  className: string,
  anchor: "start" | "middle" | "end" = "start",
) {
  const node = svgElement("text", { x, y, class: className, "text-anchor": anchor });
  node.textContent = text;
  parent.append(node);
  return node;
}

function readConfiguration(): Configuration {
  const mean = Number(meanInput.value);
  const sd = Math.max(0.1, Number(sdInput.value));
  const sampleSize = Math.max(2, Math.round(Number(sampleSizeInput.value)));
  return {
    mean: Number.isFinite(mean) ? mean : 100,
    sd: Number.isFinite(sd) ? sd : 15,
    sampleSize: Number.isFinite(sampleSize) ? sampleSize : 10,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function linearScale(value: number, domainMin: number, domainMax: number) {
  const proportion = (value - domainMin) / (domainMax - domainMin);
  return LEFT + clamp(proportion, 0, 1) * PLOT_WIDTH;
}

function populationDomain(): [number, number] {
  return [configuration.mean - 4 * configuration.sd, configuration.mean + 4 * configuration.sd];
}

function estimateDomain(): [number, number] {
  return populationDomain();
}

function populationX(value: number) {
  const [min, max] = populationDomain();
  return linearScale(value, min, max);
}

function estimateX(value: number) {
  return populationX(value);
}

function theoreticalSE() {
  return configuration.sd / Math.sqrt(configuration.sampleSize);
}

function normalDensity(value: number, mean: number, sd: number) {
  const z = (value - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

function populationCurveY(value: number) {
  const maxDensity = normalDensity(configuration.mean, configuration.mean, configuration.sd);
  const density = normalDensity(value, configuration.mean, configuration.sd);
  return POPULATION_AXIS_Y - (density / maxDensity) * 126;
}

function formatValue(value: number | null, digits = 2) {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

function tickValues(min: number, max: number) {
  return Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4);
}

function axis(
  parent: SVGGElement,
  y: number,
  domain: [number, number],
  scale: (value: number) => number,
) {
  parent.append(svgElement("line", { x1: LEFT, y1: y, x2: RIGHT, y2: y, class: "axis-line" }));
  tickValues(...domain).forEach((value) => {
    const x = scale(value);
    parent.append(svgElement("line", { x1: x, y1: y, x2: x, y2: y + 7, class: "tick-line" }));
    appendText(parent, value.toFixed(1), x, y + 24, "axis-label", "middle");
  });
}

function densityPath(
  mean: number,
  sd: number,
  domain: [number, number],
  scale: (value: number) => number,
  baseline: number,
  height: number,
  closePath: boolean,
) {
  const maxDensity = normalDensity(mean, mean, sd);
  const points = Array.from({ length: 121 }, (_, index) => {
    const value = domain[0] + ((domain[1] - domain[0]) * index) / 120;
    const density = normalDensity(value, mean, sd);
    return { x: scale(value), y: baseline - (density / maxDensity) * height };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  return closePath ? `${path} L${RIGHT},${baseline} L${LEFT},${baseline} Z` : path;
}

function renderStaticStage() {
  clear(populationLayer);
  clear(distributionReferenceLayer);
  clear(annotationLayer);

  const populationRange = populationDomain();
  const estimateRange = estimateDomain();

  appendText(populationLayer, "1  Population model", 58, 62, "zone-title");
  appendText(
    populationLayer,
    "The population is fixed. Outlined orange points retain the values from the latest sample.",
    58,
    84,
    "zone-subtitle",
  );
  const populationPath = svgElement("path", {
    d: densityPath(
      configuration.mean,
      configuration.sd,
      populationRange,
      populationX,
      POPULATION_AXIS_Y,
      126,
      true,
    ),
    class: "population-curve",
  });
  populationLayer.append(populationPath);
  axis(populationLayer, POPULATION_AXIS_Y, populationRange, populationX);

  appendText(annotationLayer, "2  One random sample", 58, 306, "zone-title");
  appendText(
    annotationLayer,
    `The observations vary from sample to sample, even though n = ${configuration.sampleSize} stays fixed.`,
    58,
    328,
    "zone-subtitle",
  );
  axis(annotationLayer, SAMPLE_AXIS_Y, populationRange, populationX);

  appendText(distributionReferenceLayer, "3  Sampling distribution of the sample mean", 58, 530, "zone-title");
  appendText(
    distributionReferenceLayer,
    `Bars count sample means in fixed intervals of width ${formatCompactNumber(histogramPlan().binWidth)}. The x-axis matches panels 1 and 2.`,
    58,
    552,
    "zone-subtitle",
  );
  axis(distributionReferenceLayer, DISTRIBUTION_AXIS_Y, estimateRange, estimateX);

  if (showTrueMeanInput.checked) {
    const popMeanX = populationX(configuration.mean);
    populationLayer.append(
      svgElement("line", {
        x1: popMeanX,
        y1: 76,
        x2: popMeanX,
        y2: POPULATION_AXIS_Y,
        class: "true-mean-line",
      }),
    );
    appendText(populationLayer, "true mean", popMeanX + 8, 96, "true-mean-label");

    const distributionMeanX = estimateX(configuration.mean);
    distributionReferenceLayer.append(
      svgElement("line", {
        x1: distributionMeanX,
        y1: HISTOGRAM_TOP_Y,
        x2: distributionMeanX,
        y2: DISTRIBUTION_AXIS_Y,
        class: "true-mean-line",
      }),
    );
  }

  const definitions = svgElement("defs");
  const marker = svgElement("marker", {
    id: "arrowhead",
    markerWidth: 8,
    markerHeight: 8,
    refX: 7,
    refY: 4,
    orient: "auto",
  });
  marker.append(svgElement("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#9db2ba" }));
  definitions.append(marker);
  annotationLayer.append(definitions);
}

function sampleTarget(value: number, index: number): Point {
  const rows = configuration.sampleSize > 60 ? 8 : configuration.sampleSize > 25 ? 6 : 4;
  return {
    x: populationX(value),
    y: SAMPLE_AXIS_Y - 18 - (index % rows) * 13,
  };
}

function formatCompactNumber(value: number) {
  return Number(value.toPrecision(3)).toString();
}

function readableBinWidth(rawWidth: number) {
  const exponent = Math.floor(Math.log10(rawWidth));
  const magnitude = 10 ** exponent;
  const scaled = rawWidth / magnitude;
  const candidates = [1, 2, 2.5, 5, 10];
  const closest = candidates.reduce((best, candidate) =>
    Math.abs(candidate - scaled) < Math.abs(best - scaled) ? candidate : best,
  );
  return closest * magnitude;
}

function histogramPlan(): HistogramPlan {
  const [domainMin, domainMax] = estimateDomain();
  const binWidth = readableBinWidth(0.5 * theoreticalSE());
  let start = configuration.mean - binWidth / 2;
  while (start > domainMin) {
    start -= binWidth;
  }
  const binCount = Math.ceil((domainMax - start) / binWidth);
  return { binWidth, start, binCount };
}

function histogramBin(value: number, plan = histogramPlan()) {
  return clamp(Math.floor((value - plan.start) / plan.binWidth), 0, plan.binCount - 1);
}

function niceCountMaximum(value: number) {
  if (value <= 1) {
    return 2;
  }
  const target = value * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const increment = Math.max(1, magnitude / 10);
  return Math.ceil(target / increment) * increment;
}

function histogramLayout(values: number[]) {
  const plan = histogramPlan();
  const counts = Array.from({ length: plan.binCount }, () => 0);
  values.forEach((value) => {
    counts[histogramBin(value, plan)] += 1;
  });
  const maximumCount = Math.max(0, ...counts);
  const yMaximum = niceCountMaximum(maximumCount);
  const chartHeight = HISTOGRAM_BOTTOM_Y - HISTOGRAM_TOP_Y;
  const [domainMin, domainMax] = estimateDomain();
  const bars = counts.map((count, index) => {
    const lower = plan.start + index * plan.binWidth;
    const upper = lower + plan.binWidth;
    const x1 = estimateX(Math.max(domainMin, lower));
    const x2 = estimateX(Math.min(domainMax, upper));
    const height = (count / yMaximum) * chartHeight;
    return {
      index,
      lower,
      upper,
      count,
      x: x1 + 0.6,
      width: Math.max(0.8, x2 - x1 - 1.2),
      y: HISTOGRAM_BOTTOM_Y - height,
      height,
    };
  });
  return { plan, counts, maximumCount, yMaximum, bars };
}

function targetForNewEstimate(value: number): Point {
  const layout = histogramLayout([...estimates, value]);
  const bar = layout.bars[histogramBin(value, layout.plan)];
  return bar === undefined
    ? { x: estimateX(value), y: HISTOGRAM_BOTTOM_Y }
    : { x: bar.x + bar.width / 2, y: bar.y };
}

function renderHistogram(highlightedBin: number | null = null) {
  clear(histogramLayer);
  const layout = histogramLayout(estimates);
  const total = estimates.length;

  layout.bars.forEach((bar) => {
    if (bar.count === 0) {
      return;
    }
    const rectangle = svgElement("rect", {
      x: bar.x,
      y: bar.y,
      width: bar.width,
      height: Math.max(1, bar.height),
      rx: Math.min(2, bar.width / 4),
      "data-bin-index": bar.index,
      "data-count": bar.count,
      "data-lower": bar.lower,
      "data-upper": bar.upper,
      class: `histogram-bar${bar.index === highlightedBin ? " histogram-bar-highlight" : ""}`,
    });
    const title = svgElement("title");
    const percentage = total > 0 ? (100 * bar.count) / total : 0;
    title.textContent = `${formatCompactNumber(bar.lower)} to ${formatCompactNumber(bar.upper)}: ${bar.count.toLocaleString()} sample mean${bar.count === 1 ? "" : "s"} (${percentage.toFixed(1)}%)`;
    rectangle.append(title);
    histogramLayer.append(rectangle);
  });

  histogramLayer.append(
    svgElement("line", {
      x1: LEFT,
      y1: HISTOGRAM_TOP_Y,
      x2: LEFT,
      y2: HISTOGRAM_BOTTOM_Y,
      class: "histogram-count-axis",
    }),
  );
  appendText(histogramLayer, layout.yMaximum.toLocaleString(), LEFT - 9, HISTOGRAM_TOP_Y + 4, "histogram-count-label", "end");
  appendText(histogramLayer, "0", LEFT - 9, HISTOGRAM_BOTTOM_Y + 4, "histogram-count-label", "end");
  appendText(histogramLayer, "count", LEFT - 9, HISTOGRAM_TOP_Y - 8, "histogram-count-title", "end");
}

function renderMeanMarker(estimate: number) {
  clear(meanLayer);
  const x = populationX(estimate);
  const line = svgElement("line", {
    x1: x,
    y1: 338,
    x2: x,
    y2: SAMPLE_AXIS_Y,
    class: "sample-mean-line",
  });
  meanLayer.append(line);
  const label = appendText(
    meanLayer,
    `sample mean = ${formatValue(estimate)}`,
    x,
    355,
    "sample-mean-label",
    "middle",
  );
  return { line, label };
}

async function animateMeanMarker(estimate: number) {
  const { line, label } = renderMeanMarker(estimate);
  await Promise.all([
    animateElement(
      line,
      [
        { opacity: 0, transform: "scaleY(0)" },
        { opacity: 1, transform: "scaleY(1)" },
      ],
      {
        duration: 440,
        easing: "cubic-bezier(.2,.75,.25,1)",
        fill: "forwards",
      },
    ),
    animateElement(
      label,
      [
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration: 330,
        delay: reduceMotionInput.checked ? 0 : animationDuration(190),
        easing: "ease-out",
        fill: "forwards",
      },
    ),
  ]);
}

function renderLatestSampleImmediately() {
  clear(populationSampleLayer);
  clear(sampleLayer);
  latestSample.forEach((value, index) => {
    const target = sampleTarget(value, index);
    populationSampleLayer.append(
      svgElement("circle", {
        cx: populationX(value),
        cy: populationCurveY(value),
        r: 6.5,
        class: "population-sample-point",
      }),
    );
    sampleLayer.append(
      svgElement("circle", { cx: target.x, cy: target.y, r: 6, class: "sample-point" }),
    );
  });
  if (latestEstimate !== null) {
    renderMeanMarker(latestEstimate);
  }
}

function renderMetrics() {
  latestMeanOutput.textContent = formatValue(latestEstimate);
  sampleCountOutput.textContent = estimates.length.toLocaleString();
  empiricalSeOutput.textContent = estimates.length > 1 ? formatValue(standardDeviation(estimates)) : "—";
  seedOutput.textContent = String(seed);
}

function animationDuration(base: number) {
  if (reduceMotionInput.checked) {
    return 1;
  }
  return Math.max(1, base / Number(speedInput.value));
}

async function animateElement(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  const animation = element.animate(keyframes, {
    ...options,
    duration: animationDuration(Number(options.duration ?? 1)),
  });
  activeAnimations.add(animation);
  if (paused) {
    animation.pause();
  }
  try {
    await animation.finished;
  } catch {
    // Cancellation is an expected part of resetting the prototype.
  } finally {
    activeAnimations.delete(animation);
  }
}

async function pacedDelay(milliseconds: number, token: number) {
  if (reduceMotionInput.checked) {
    return;
  }
  let elapsed = 0;
  while (elapsed < milliseconds && token === runToken) {
    if (!paused) {
      const slice = Math.min(30, milliseconds - elapsed);
      await new Promise<void>((resolve) => window.setTimeout(resolve, slice));
      elapsed += slice;
    } else {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 30));
    }
  }
}

async function animateOneSample(token: number) {
  const sample = drawSample(
    { kind: "normal", params: { mean: configuration.mean, sd: configuration.sd } },
    configuration.sampleSize,
    rng,
  );
  const estimate = sampleMean(sample);

  clear(sampleLayer);
  clear(populationSampleLayer);
  clear(meanLayer);
  clear(transitionLayer);
  statusOutput.textContent = `Step 1 of 4: draw ${configuration.sampleSize} random observations from the population.`;

  const sampleCircles = sample.map((value, index) => {
    const origin = { x: populationX(value), y: populationCurveY(value) };
    const target = sampleTarget(value, index);
    const circle = svgElement("circle", {
      cx: origin.x,
      cy: origin.y,
      r: configuration.sampleSize > 60 ? 4.5 : 6,
      class: "sample-point",
      opacity: 0,
    });
    sampleLayer.append(circle);
    return { circle, origin, target, index };
  });

  await Promise.all(
    sampleCircles.map(async ({ circle, index }) => {
      await animateElement(
        circle,
        [
          { opacity: 0, transform: "scale(0.35)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: 340,
          delay: reduceMotionInput.checked ? 0 : Math.min(index * 18, 260),
          easing: "ease-out",
          fill: "forwards",
        },
      );
    }),
  );

  if (token !== runToken) {
    return;
  }

  await pacedDelay(animationDuration(360), token);
  sampleCircles.forEach(({ origin }) => {
    populationSampleLayer.append(
      svgElement("circle", {
        cx: origin.x,
        cy: origin.y,
        r: configuration.sampleSize > 60 ? 5 : 6.5,
        class: "population-sample-point",
      }),
    );
  });
  statusOutput.textContent = "Step 2 of 4: retain the sampled values above and place the observations in panel 2.";

  await Promise.all(
    sampleCircles.map(async ({ circle, origin, target, index }) => {
      await animateElement(
        circle,
        [
          { opacity: 1, transform: "translate(0px, 0px)" },
          { opacity: 1, transform: `translate(${target.x - origin.x}px, ${target.y - origin.y}px)` },
        ],
        {
          duration: 620,
          delay: reduceMotionInput.checked ? 0 : Math.min(index * 8, 100),
          easing: "cubic-bezier(.22,.75,.25,1)",
          fill: "forwards",
        },
      );
      // The final position is stored in the SVG attributes. Remove both completed
      // fill-forwards animations so their transforms are not applied a second time.
      circle.getAnimations().forEach((animation) => animation.cancel());
      circle.setAttribute("cx", String(target.x));
      circle.setAttribute("cy", String(target.y));
      circle.setAttribute("opacity", "1");
      circle.removeAttribute("style");
    }),
  );

  if (token !== runToken) {
    return;
  }

  latestSample = sample;
  latestEstimate = estimate;
  renderMetrics();
  statusOutput.textContent = `Step 3 of 4: calculate the mean and mark its value, ${formatValue(estimate)}.`;
  await animateMeanMarker(estimate);
  await pacedDelay(animationDuration(600), token);

  if (token !== runToken) {
    return;
  }

  const start = { x: populationX(estimate), y: 338 };
  const target = targetForNewEstimate(estimate);
  const movingMean = svgElement("g", { class: "moving-mean-token" });
  const movingDot = svgElement("circle", {
    cx: start.x,
    cy: start.y,
    r: 8,
    class: "moving-estimate",
  });
  movingMean.append(movingDot);
  appendText(
    movingMean,
    `mean ${formatValue(estimate)}`,
    start.x + (start.x > RIGHT - 150 ? -14 : 14),
    start.y + 5,
    "moving-mean-label",
    start.x > RIGHT - 150 ? "end" : "start",
  );
  transitionLayer.append(movingMean);
  statusOutput.textContent = "Step 4 of 4: move only the calculated mean into the sampling distribution.";

  await animateElement(
    movingMean,
    [
      { transform: "translate(0px, 0px)" },
      {
        transform: `translate(${target.x - start.x}px, ${target.y - start.y}px)`,
      },
    ],
    {
      duration: 760,
      easing: "cubic-bezier(.2,.72,.22,1)",
      fill: "forwards",
    },
  );

  if (token !== runToken) {
    return;
  }

  movingMean.remove();
  estimates.push(estimate);
  renderHistogram(histogramBin(estimate));
  renderMetrics();
  statusOutput.textContent = `${estimates.length.toLocaleString()} sample${estimates.length === 1 ? " has" : "s have"} produced ${estimates.length.toLocaleString()} mean${estimates.length === 1 ? "" : "s"}.`;
  await pacedDelay(animationDuration(220), token);
}

async function runAnimatedSequence(count: number) {
  if (busy) {
    return;
  }
  busy = true;
  paused = false;
  const token = ++runToken;
  updateControlAvailability();

  try {
    for (let index = 0; index < count && token === runToken; index += 1) {
      await animateOneSample(token);
    }
  } finally {
    if (token === runToken) {
      busy = false;
      paused = false;
      updateControlAvailability();
    }
  }
}

function generateBatch(count: number) {
  if (busy) {
    return;
  }
  const newEstimates: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const sample = drawSample(
      { kind: "normal", params: { mean: configuration.mean, sd: configuration.sd } },
      configuration.sampleSize,
      rng,
    );
    latestSample = sample;
    latestEstimate = sampleMean(sample);
    newEstimates.push(latestEstimate);
  }
  estimates.push(...newEstimates);
  renderLatestSampleImmediately();
  renderHistogram(latestEstimate === null ? null : histogramBin(latestEstimate));
  renderMetrics();
  statusOutput.textContent = `${count} samples were generated quickly. Every sample still contributed exactly one mean.`;
}

function updateControlAvailability() {
  drawOneButton.disabled = busy;
  animateTenButton.disabled = busy;
  generateHundredButton.disabled = busy;
  meanInput.disabled = busy;
  sdInput.disabled = busy;
  sampleSizeInput.disabled = busy;
  newSeedButton.disabled = busy;
  pauseButton.disabled = !busy;
  pauseButton.textContent = paused ? "Resume" : "Pause";
}

function cancelAnimations() {
  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations.clear();
}

function resetSimulation(message = "Draw one sample to begin.") {
  runToken += 1;
  busy = false;
  paused = false;
  cancelAnimations();
  configuration = readConfiguration();
  meanInput.value = String(configuration.mean);
  sdInput.value = String(configuration.sd);
  rng = createRng(seed);
  estimates = [];
  latestSample = [];
  latestEstimate = null;
  clear(sampleLayer);
  clear(populationSampleLayer);
  clear(meanLayer);
  clear(histogramLayer);
  clear(transitionLayer);
  renderStaticStage();
  renderMetrics();
  updateControlAvailability();
  statusOutput.textContent = message;
}

drawOneButton.addEventListener("click", () => void runAnimatedSequence(1));
animateTenButton.addEventListener("click", () => void runAnimatedSequence(10));
generateHundredButton.addEventListener("click", () => generateBatch(100));

pauseButton.addEventListener("click", () => {
  if (!busy) {
    return;
  }
  paused = !paused;
  activeAnimations.forEach((animation) => (paused ? animation.pause() : animation.play()));
  pauseButton.textContent = paused ? "Resume" : "Pause";
  statusOutput.textContent = paused ? "Animation paused." : "Animation resumed.";
});

resetButton.addEventListener("click", () => resetSimulation("Reset complete. The same seed will replay the same samples."));

newSeedButton.addEventListener("click", () => {
  seed = randomSeed();
  resetSimulation("A new random seed is ready. Draw one sample to begin.");
});

fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement === null) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    statusOutput.textContent = "Fullscreen mode is not available in this browser.";
  }
});

document.addEventListener("fullscreenchange", () => {
  fullscreenButton.textContent = document.fullscreenElement === null ? "Presentation mode" : "Exit presentation";
});

[meanInput, sdInput, sampleSizeInput].forEach((control) => {
  control.addEventListener("change", () => {
    resetSimulation("The population or sample size changed, so the sampling distribution has been reset.");
  });
});

showTrueMeanInput.addEventListener("change", () => renderStaticStage());

reduceMotionInput.addEventListener("change", () => {
  if (reduceMotionInput.checked) {
    activeAnimations.forEach((animation) => animation.finish());
    statusOutput.textContent = "Reduced motion is enabled. The same conceptual steps will appear without long movement.";
  }
});

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  reduceMotionInput.checked = true;
}

// Keep the width constant in the shared SVG coordinate system while allowing the browser to scale it responsively.
stage.setAttribute("viewBox", `0 0 ${WIDTH} 760`);
resetSimulation();
