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
const DISTRIBUTION_TOP_Y = 546;
const ESTIMATE_BIN_COUNT = 54;

interface Configuration {
  mean: number;
  sd: number;
  sampleSize: number;
}

interface Point {
  x: number;
  y: number;
}

const stage = requireElement<SVGSVGElement>("sampling-stage");
const populationLayer = requireElement<SVGGElement>("population-layer");
const sampleLayer = requireElement<SVGGElement>("sample-layer");
const meanLayer = requireElement<SVGGElement>("mean-layer");
const distributionReferenceLayer = requireElement<SVGGElement>("distribution-reference-layer");
const distributionDotLayer = requireElement<SVGGElement>("distribution-dot-layer");
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

const statusOutput = requireElement<HTMLElement>("status");
const seedOutput = requireElement<HTMLOutputElement>("seed-output");
const latestMeanOutput = requireElement<HTMLElement>("latest-mean");
const sampleCountOutput = requireElement<HTMLElement>("sample-count");
const empiricalSeOutput = requireElement<HTMLElement>("empirical-se");
const theoreticalSeOutput = requireElement<HTMLElement>("theoretical-se");

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
  const se = theoreticalSE();
  return [configuration.mean - 4 * se, configuration.mean + 4 * se];
}

function populationX(value: number) {
  const [min, max] = populationDomain();
  return linearScale(value, min, max);
}

function estimateX(value: number) {
  const [min, max] = estimateDomain();
  return linearScale(value, min, max);
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
    "The population is fixed. Random observations are generated from this distribution.",
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
    "Each dot is the mean from one independent random sample.",
    58,
    552,
    "zone-subtitle",
  );
  const referencePath = svgElement("path", {
    d: densityPath(
      configuration.mean,
      theoreticalSE(),
      estimateRange,
      estimateX,
      DISTRIBUTION_AXIS_Y,
      126,
      false,
    ),
    class: "distribution-reference",
  });
  distributionReferenceLayer.append(referencePath);
  axis(distributionReferenceLayer, DISTRIBUTION_AXIS_Y, estimateRange, estimateX);
  appendText(
    distributionReferenceLayer,
    "Dashed curve: theoretical sampling distribution",
    RIGHT,
    574,
    "annotation-text",
    "end",
  );

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
        y1: DISTRIBUTION_TOP_Y,
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

function estimateBin(value: number) {
  const [min, max] = estimateDomain();
  const proportion = clamp((value - min) / (max - min), 0, 0.999999);
  return Math.floor(proportion * ESTIMATE_BIN_COUNT);
}

function estimateDotStyle(count = estimates.length) {
  if (count > 500) {
    return { radius: 1.8, spacing: 1.8 };
  }
  if (count > 200) {
    return { radius: 2.3, spacing: 2.7 };
  }
  if (count > 70) {
    return { radius: 3, spacing: 4 };
  }
  return { radius: 4.2, spacing: 7.2 };
}

function targetForNewEstimate(value: number): Point {
  const bin = estimateBin(value);
  const currentLevel = estimates.reduce((count, estimate) => count + Number(estimateBin(estimate) === bin), 0);
  const binCenter = LEFT + ((bin + 0.5) / ESTIMATE_BIN_COUNT) * PLOT_WIDTH;
  const style = estimateDotStyle(estimates.length + 1);
  return {
    x: binCenter,
    y: DISTRIBUTION_AXIS_Y - 7 - currentLevel * style.spacing,
  };
}

function renderEstimateDots() {
  clear(distributionDotLayer);
  const levels = new Map<number, number>();
  const style = estimateDotStyle();
  estimates.forEach((estimate) => {
    const bin = estimateBin(estimate);
    const level = levels.get(bin) ?? 0;
    levels.set(bin, level + 1);
    const x = LEFT + ((bin + 0.5) / ESTIMATE_BIN_COUNT) * PLOT_WIDTH;
    const y = DISTRIBUTION_AXIS_Y - 7 - level * style.spacing;
    distributionDotLayer.append(
      svgElement("circle", { cx: x, cy: y, r: style.radius, class: "estimate-dot" }),
    );
  });
}

function renderMeanMarker(estimate: number) {
  clear(meanLayer);
  const x = populationX(estimate);
  meanLayer.append(
    svgElement("line", {
      x1: x,
      y1: 338,
      x2: x,
      y2: SAMPLE_AXIS_Y,
      class: "sample-mean-line",
    }),
  );
  appendText(meanLayer, `sample mean = ${formatValue(estimate)}`, x, 355, "sample-mean-label", "middle");
}

function renderLatestSampleImmediately() {
  clear(sampleLayer);
  latestSample.forEach((value, index) => {
    const target = sampleTarget(value, index);
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
  theoreticalSeOutput.textContent = formatValue(theoreticalSE());
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
  clear(meanLayer);
  clear(transitionLayer);
  statusOutput.textContent = `A new random sample of ${configuration.sampleSize} observations is being drawn.`;

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
    sampleCircles.map(async ({ circle, origin, target, index }) => {
      await animateElement(
        circle,
        [
          { opacity: 0, transform: "translate(0px, 0px)" },
          { opacity: 1, offset: 0.22, transform: "translate(0px, 0px)" },
          { opacity: 1, transform: `translate(${target.x - origin.x}px, ${target.y - origin.y}px)` },
        ],
        {
          duration: 620,
          delay: reduceMotionInput.checked ? 0 : Math.min(index * 12, 220),
          easing: "cubic-bezier(.22,.75,.25,1)",
          fill: "forwards",
        },
      );
      circle.setAttribute("cx", String(target.x));
      circle.setAttribute("cy", String(target.y));
      circle.setAttribute("opacity", "1");
      circle.style.transform = "none";
    }),
  );

  if (token !== runToken) {
    return;
  }

  latestSample = sample;
  latestEstimate = estimate;
  renderMeanMarker(estimate);
  renderMetrics();
  statusOutput.textContent = `This sample produced a mean of ${formatValue(estimate)}. That is one estimate.`;
  await pacedDelay(animationDuration(520), token);

  if (token !== runToken) {
    return;
  }

  const start = { x: populationX(estimate), y: SAMPLE_AXIS_Y + 8 };
  const target = targetForNewEstimate(estimate);
  const movingDot = svgElement("circle", {
    cx: start.x,
    cy: start.y,
    r: 8,
    class: "moving-estimate",
  });
  transitionLayer.append(movingDot);
  statusOutput.textContent = "The sample mean now becomes one point in the sampling distribution.";

  await animateElement(
    movingDot,
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

  movingDot.remove();
  estimates.push(estimate);
  renderEstimateDots();
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
  renderEstimateDots();
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
  clear(meanLayer);
  clear(distributionDotLayer);
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
