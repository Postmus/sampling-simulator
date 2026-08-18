import { normalDensity } from "../../domain/distributions/normal";
import { createRng, randomSeed, type RNG } from "../../domain/rng";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { appendSvgText, clearSvg, svgElement } from "../../visualization/svg";
import { formatNumber, localeTag, type Locale } from "../../i18n/LocaleContext";
import {
  createHistogramPlan,
  histogramBin,
  histogramCounts,
  type HistogramPlan,
} from "./histogram";
import {
  empiricalStandardError,
  simulateBatch,
  simulateSample,
  theoreticalStandardError,
  type SamplingConfiguration,
} from "./model";
import { samplingMessages, type SamplingMessages } from "./messages";

const LEFT = 92;
const RIGHT = 1140;
const PLOT_WIDTH = RIGHT - LEFT;
const POPULATION_AXIS_Y = 224;
const SAMPLE_AXIS_Y = 438;
const DISTRIBUTION_AXIS_Y = 700;
const HISTOGRAM_TOP_Y = 582;
const HISTOGRAM_BOTTOM_Y = DISTRIBUTION_AXIS_Y - 2;

interface Point {
  x: number;
  y: number;
}

interface HistogramBar {
  index: number;
  lower: number;
  upper: number;
  count: number;
  x: number;
  width: number;
  y: number;
  height: number;
}

export class SamplingJourneyController {
  private readonly messages: SamplingMessages;
  private configuration: SamplingConfiguration;
  private seed = 314159;
  private rng: RNG;
  private estimates: number[] = [];
  private latestSample: number[] = [];
  private latestEstimate: number | null = null;
  private busy = false;
  private readonly cleanups: Array<() => void> = [];

  private readonly populationLayer: SVGGElement;
  private readonly populationSampleLayer: SVGGElement;
  private readonly sampleLayer: SVGGElement;
  private readonly meanLayer: SVGGElement;
  private readonly distributionReferenceLayer: SVGGElement;
  private readonly histogramLayer: SVGGElement;
  private readonly transitionLayer: SVGGElement;
  private readonly annotationLayer: SVGGElement;

  private readonly meanInput: HTMLInputElement;
  private readonly sdInput: HTMLInputElement;
  private readonly sampleSizeInput: HTMLSelectElement;
  private readonly speedInput: HTMLSelectElement;
  private readonly showTrueMeanInput: HTMLInputElement;
  private readonly reduceMotionInput: HTMLInputElement;
  private readonly drawOneButton: HTMLButtonElement;
  private readonly animateTenButton: HTMLButtonElement;
  private readonly generateHundredButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly newSeedButton: HTMLButtonElement;
  private readonly fullscreenButton: HTMLButtonElement;
  private readonly statusOutput: HTMLElement;
  private readonly seedOutput: HTMLOutputElement;
  private readonly latestMeanOutput: HTMLElement;
  private readonly sampleCountOutput: HTMLElement;
  private readonly empiricalSeOutput: HTMLElement;
  private readonly runtime: AnimationRuntime;

  constructor(private readonly root: HTMLElement, private readonly locale: Locale) {
    this.messages = samplingMessages[locale];
    this.populationLayer = this.layer("population");
    this.populationSampleLayer = this.layer("population-sample");
    this.sampleLayer = this.layer("sample");
    this.meanLayer = this.layer("mean");
    this.distributionReferenceLayer = this.layer("distribution-reference");
    this.histogramLayer = this.layer("histogram");
    this.transitionLayer = this.layer("transition");
    this.annotationLayer = this.layer("annotation");

    this.meanInput = this.role("population-mean");
    this.sdInput = this.role("population-sd");
    this.sampleSizeInput = this.role("sample-size");
    this.speedInput = this.role("animation-speed");
    this.showTrueMeanInput = this.role("show-true-mean");
    this.reduceMotionInput = this.role("reduce-motion");
    this.drawOneButton = this.role("draw-one");
    this.animateTenButton = this.role("animate-ten");
    this.generateHundredButton = this.role("generate-hundred");
    this.pauseButton = this.role("pause");
    this.resetButton = this.role("reset");
    this.newSeedButton = this.role("new-seed");
    this.fullscreenButton = this.role("fullscreen");
    this.statusOutput = this.role("status");
    this.seedOutput = this.role("seed");
    this.latestMeanOutput = this.role("latest-mean");
    this.sampleCountOutput = this.role("sample-count");
    this.empiricalSeOutput = this.role("empirical-se");

    this.configuration = this.readConfiguration();
    this.rng = createRng(this.seed);
    this.runtime = new AnimationRuntime({
      speed: () => Number(this.speedInput.value),
      reducedMotion: () => this.reduceMotionInput.checked,
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.reduceMotionInput.checked = true;
    }
    this.bindEvents();
    this.resetSimulation();
  }

  destroy() {
    this.runtime.cancel();
    this.cleanups.forEach((cleanup) => cleanup());
  }

  private role<T extends Element>(name: string): T {
    const element = this.root.querySelector(`[data-role="${name}"]`);
    if (element === null) {
      throw new Error(`Missing required sampling-journey element: ${name}`);
    }
    return element as T;
  }

  private layer(name: string): SVGGElement {
    const element = this.root.querySelector(`[data-layer="${name}"]`);
    if (!(element instanceof SVGGElement)) {
      throw new Error(`Missing required sampling-journey layer: ${name}`);
    }
    return element;
  }

  private listen<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ) {
    element.addEventListener(event, handler as EventListener);
    this.cleanups.push(() => element.removeEventListener(event, handler as EventListener));
  }

  private bindEvents() {
    this.listen(this.drawOneButton, "click", () => void this.runAnimatedSequence(1));
    this.listen(this.animateTenButton, "click", () => void this.runAnimatedSequence(10));
    this.listen(this.generateHundredButton, "click", () => this.generateBatch(100));
    this.listen(this.pauseButton, "click", () => this.togglePause());
    this.listen(this.resetButton, "click", () =>
      this.resetSimulation(this.messages.status.resetReplay),
    );
    this.listen(this.newSeedButton, "click", () => {
      this.seed = randomSeed();
      this.resetSimulation(this.messages.status.newSeed);
    });
    this.listen(this.fullscreenButton, "click", () => void this.toggleFullscreen());
    this.listen(document, "fullscreenchange", () => {
      this.fullscreenButton.textContent =
        document.fullscreenElement === null ? this.messages.presentation : this.messages.exitPresentation;
    });

    [this.meanInput, this.sdInput, this.sampleSizeInput].forEach((control) => {
      this.listen(control, "change", () =>
        this.resetSimulation(
          this.messages.status.configurationReset,
        ),
      );
    });
    this.listen(this.showTrueMeanInput, "change", () => this.renderStaticStage());
    this.listen(this.reduceMotionInput, "change", () => {
      if (this.reduceMotionInput.checked) {
        this.runtime.finishActiveAnimations();
        this.setStatus(
          this.messages.status.reducedMotion,
        );
      }
    });
  }

  private readConfiguration(): SamplingConfiguration {
    const mean = Number(this.meanInput.value);
    const sd = Math.max(0.1, Number(this.sdInput.value));
    const sampleSize = Math.max(2, Math.round(Number(this.sampleSizeInput.value)));
    return {
      mean: Number.isFinite(mean) ? mean : 100,
      sd: Number.isFinite(sd) ? sd : 15,
      sampleSize: Number.isFinite(sampleSize) ? sampleSize : 10,
    };
  }

  private populationDomain(): [number, number] {
    return [
      this.configuration.mean - 4 * this.configuration.sd,
      this.configuration.mean + 4 * this.configuration.sd,
    ];
  }

  private scale(value: number) {
    const [minimum, maximum] = this.populationDomain();
    const proportion = (value - minimum) / (maximum - minimum);
    return LEFT + Math.min(1, Math.max(0, proportion)) * PLOT_WIDTH;
  }

  private populationCurveY(value: number) {
    const distribution = { mean: this.configuration.mean, sd: this.configuration.sd };
    const maximumDensity = normalDensity(this.configuration.mean, distribution);
    return POPULATION_AXIS_Y - (normalDensity(value, distribution) / maximumDensity) * 126;
  }

  private densityPath() {
    const domain = this.populationDomain();
    const distribution = { mean: this.configuration.mean, sd: this.configuration.sd };
    const maximumDensity = normalDensity(distribution.mean, distribution);
    const points = Array.from({ length: 121 }, (_, index) => {
      const value = domain[0] + ((domain[1] - domain[0]) * index) / 120;
      return {
        x: this.scale(value),
        y: POPULATION_AXIS_Y - (normalDensity(value, distribution) / maximumDensity) * 126,
      };
    });
    const path = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");
    return `${path} L${RIGHT},${POPULATION_AXIS_Y} L${LEFT},${POPULATION_AXIS_Y} Z`;
  }

  private renderAxis(parent: SVGGElement, y: number) {
    const domain = this.populationDomain();
    parent.append(svgElement("line", { x1: LEFT, y1: y, x2: RIGHT, y2: y, class: "axis-line" }));
    Array.from({ length: 5 }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / 4)
      .forEach((value) => {
        const x = this.scale(value);
        parent.append(svgElement("line", { x1: x, y1: y, x2: x, y2: y + 7, class: "tick-line" }));
        appendSvgText(parent, this.format(value, 1), x, y + 24, "axis-label", "middle");
      });
  }

  private renderStaticStage() {
    clearSvg(this.populationLayer);
    clearSvg(this.distributionReferenceLayer);
    clearSvg(this.annotationLayer);

    appendSvgText(this.populationLayer, this.messages.stage.populationTitle, 58, 62, "zone-title");
    appendSvgText(
      this.populationLayer,
      this.messages.stage.populationSubtitle,
      58,
      84,
      "zone-subtitle",
    );
    this.populationLayer.append(svgElement("path", { d: this.densityPath(), class: "population-curve" }));
    this.renderAxis(this.populationLayer, POPULATION_AXIS_Y);

    appendSvgText(this.annotationLayer, this.messages.stage.sampleTitle, 58, 306, "zone-title");
    appendSvgText(
      this.annotationLayer,
      this.messages.stage.sampleSubtitle(this.configuration.sampleSize),
      58,
      328,
      "zone-subtitle",
    );
    this.renderAxis(this.annotationLayer, SAMPLE_AXIS_Y);

    appendSvgText(
      this.distributionReferenceLayer,
      this.messages.stage.distributionTitle,
      58,
      530,
      "zone-title",
    );
    appendSvgText(
      this.distributionReferenceLayer,
      this.messages.stage.distributionSubtitle(this.formatCompact(this.histogramPlan().binWidth)),
      58,
      552,
      "zone-subtitle",
    );
    this.renderAxis(this.distributionReferenceLayer, DISTRIBUTION_AXIS_Y);

    if (this.showTrueMeanInput.checked) {
      const meanX = this.scale(this.configuration.mean);
      this.populationLayer.append(
        svgElement("line", { x1: meanX, y1: 76, x2: meanX, y2: POPULATION_AXIS_Y, class: "true-mean-line" }),
      );
      appendSvgText(this.populationLayer, this.messages.stage.trueMean, meanX + 8, 96, "true-mean-label");
      this.distributionReferenceLayer.append(
        svgElement("line", {
          x1: meanX,
          y1: HISTOGRAM_TOP_Y,
          x2: meanX,
          y2: DISTRIBUTION_AXIS_Y,
          class: "true-mean-line",
        }),
      );
    }
  }

  private sampleTarget(value: number, index: number): Point {
    const rows = this.configuration.sampleSize > 60 ? 8 : this.configuration.sampleSize > 25 ? 6 : 4;
    return { x: this.scale(value), y: SAMPLE_AXIS_Y - 18 - (index % rows) * 13 };
  }

  private histogramPlan(): HistogramPlan {
    return createHistogramPlan(
      this.populationDomain(),
      this.configuration.mean,
      theoreticalStandardError(this.configuration),
    );
  }

  private histogramLayout(values: readonly number[]) {
    const plan = this.histogramPlan();
    const counts = histogramCounts(values, plan);
    const maximumCount = Math.max(0, ...counts);
    const yMaximum = this.niceCountMaximum(maximumCount);
    const chartHeight = HISTOGRAM_BOTTOM_Y - HISTOGRAM_TOP_Y;
    const [domainMinimum, domainMaximum] = this.populationDomain();
    const bars: HistogramBar[] = counts.map((count, index) => {
      const lower = plan.start + index * plan.binWidth;
      const upper = lower + plan.binWidth;
      const x1 = this.scale(Math.max(domainMinimum, lower));
      const x2 = this.scale(Math.min(domainMaximum, upper));
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
    return { plan, bars, yMaximum };
  }

  private targetForNewEstimate(value: number): Point {
    const layout = this.histogramLayout([...this.estimates, value]);
    const bar = layout.bars[histogramBin(value, layout.plan)];
    return bar === undefined
      ? { x: this.scale(value), y: HISTOGRAM_BOTTOM_Y }
      : { x: bar.x + bar.width / 2, y: bar.y };
  }

  private renderHistogram(highlightedBin: number | null = null) {
    clearSvg(this.histogramLayer);
    const layout = this.histogramLayout(this.estimates);
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
        class: `histogram-bar${bar.index === highlightedBin ? " histogram-bar-highlight" : ""}`,
      });
      const title = svgElement("title");
      const percentage = this.estimates.length === 0 ? 0 : (100 * bar.count) / this.estimates.length;
      title.textContent = this.messages.stage.squaredRangeTitle(
        this.formatCompact(bar.lower),
        this.formatCompact(bar.upper),
        this.formatCount(bar.count),
        this.format(percentage, 1),
        bar.count === 1,
      );
      rectangle.append(title);
      this.histogramLayer.append(rectangle);
    });
    this.histogramLayer.append(
      svgElement("line", { x1: LEFT, y1: HISTOGRAM_TOP_Y, x2: LEFT, y2: HISTOGRAM_BOTTOM_Y, class: "histogram-count-axis" }),
    );
    appendSvgText(this.histogramLayer, this.formatCount(layout.yMaximum), LEFT - 9, HISTOGRAM_TOP_Y + 4, "histogram-count-label", "end");
    appendSvgText(this.histogramLayer, "0", LEFT - 9, HISTOGRAM_BOTTOM_Y + 4, "histogram-count-label", "end");
    appendSvgText(this.histogramLayer, this.messages.stage.count, LEFT - 9, HISTOGRAM_TOP_Y - 8, "histogram-count-title", "end");
  }

  private renderMeanMarker(estimate: number) {
    clearSvg(this.meanLayer);
    const x = this.scale(estimate);
    const line = svgElement("line", { x1: x, y1: 338, x2: x, y2: SAMPLE_AXIS_Y, class: "sample-mean-line" });
    this.meanLayer.append(line);
    const label = appendSvgText(this.meanLayer, `${this.messages.stage.sampleMean} = ${this.format(estimate)}`, x, 355, "sample-mean-label", "middle");
    return { line, label };
  }

  private async animateMeanMarker(estimate: number) {
    const { line, label } = this.renderMeanMarker(estimate);
    await Promise.all([
      this.runtime.animate(
        line,
        [{ opacity: 0, transform: "scaleY(0)" }, { opacity: 1, transform: "scaleY(1)" }],
        { duration: 440, easing: "cubic-bezier(.2,.75,.25,1)", fill: "forwards" },
      ),
      this.runtime.animate(
        label,
        [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0px)" }],
        {
          duration: 330,
          delay: this.reduceMotionInput.checked ? 0 : this.runtime.duration(190),
          easing: "ease-out",
          fill: "forwards",
        },
      ),
    ]);
  }

  private renderLatestSampleImmediately() {
    clearSvg(this.populationSampleLayer);
    clearSvg(this.sampleLayer);
    this.latestSample.forEach((value, index) => {
      const target = this.sampleTarget(value, index);
      this.populationSampleLayer.append(
        svgElement("circle", { cx: this.scale(value), cy: this.populationCurveY(value), r: 6.5, class: "population-sample-point" }),
      );
      this.sampleLayer.append(svgElement("circle", { cx: target.x, cy: target.y, r: 6, class: "sample-point" }));
    });
    if (this.latestEstimate !== null) {
      this.renderMeanMarker(this.latestEstimate);
    }
  }

  private renderMetrics() {
    this.latestMeanOutput.textContent = this.format(this.latestEstimate);
    this.sampleCountOutput.textContent = this.formatCount(this.estimates.length);
    this.empiricalSeOutput.textContent = this.format(empiricalStandardError(this.estimates));
    this.seedOutput.textContent = String(this.seed);
  }

  private async animateOneSample(token: number) {
    const { sample, estimate } = simulateSample(this.configuration, this.rng);
    clearSvg(this.sampleLayer);
    clearSvg(this.populationSampleLayer);
    clearSvg(this.meanLayer);
    clearSvg(this.transitionLayer);
    this.setStatus(this.messages.status.step1(this.configuration.sampleSize));

    const circles = sample.map((value, index) => {
      const origin = { x: this.scale(value), y: this.populationCurveY(value) };
      const target = this.sampleTarget(value, index);
      const circle = svgElement("circle", {
        cx: origin.x,
        cy: origin.y,
        r: this.configuration.sampleSize > 60 ? 4.5 : 6,
        class: "sample-point",
        opacity: 0,
      });
      this.sampleLayer.append(circle);
      return { circle, origin, target, index };
    });

    await Promise.all(
      circles.map(({ circle, index }) =>
        this.runtime.animate(
          circle,
          [{ opacity: 0, transform: "scale(0.35)" }, { opacity: 1, transform: "scale(1)" }],
          {
            duration: 340,
            delay: this.reduceMotionInput.checked ? 0 : Math.min(index * 18, 260),
            easing: "ease-out",
            fill: "forwards",
          },
        ),
      ),
    );
    if (!this.runtime.isCurrent(token)) return;

    await this.runtime.delay(360, token);
    circles.forEach(({ origin }) => {
      this.populationSampleLayer.append(
        svgElement("circle", {
          cx: origin.x,
          cy: origin.y,
          r: this.configuration.sampleSize > 60 ? 5 : 6.5,
          class: "population-sample-point",
        }),
      );
    });
    this.setStatus(this.messages.status.step2);

    await Promise.all(
      circles.map(async ({ circle, origin, target, index }) => {
        await this.runtime.animate(
          circle,
          [
            { opacity: 1, transform: "translate(0px, 0px)" },
            { opacity: 1, transform: `translate(${target.x - origin.x}px, ${target.y - origin.y}px)` },
          ],
          {
            duration: 620,
            delay: this.reduceMotionInput.checked ? 0 : Math.min(index * 8, 100),
            easing: "cubic-bezier(.22,.75,.25,1)",
            fill: "forwards",
          },
        );
        circle.getAnimations().forEach((animation) => animation.cancel());
        circle.setAttribute("cx", String(target.x));
        circle.setAttribute("cy", String(target.y));
        circle.setAttribute("opacity", "1");
        circle.removeAttribute("style");
      }),
    );
    if (!this.runtime.isCurrent(token)) return;

    this.latestSample = sample;
    this.latestEstimate = estimate;
    this.renderMetrics();
    this.setStatus(this.messages.status.step3(this.format(estimate)));
    await this.animateMeanMarker(estimate);
    await this.runtime.delay(600, token);
    if (!this.runtime.isCurrent(token)) return;

    const start = { x: this.scale(estimate), y: 338 };
    const target = this.targetForNewEstimate(estimate);
    const movingMean = svgElement("g", { class: "moving-mean-token" });
    movingMean.append(svgElement("circle", { cx: start.x, cy: start.y, r: 8, class: "moving-estimate" }));
    appendSvgText(
      movingMean,
      `${this.messages.stage.mean} ${this.format(estimate)}`,
      start.x + (start.x > RIGHT - 150 ? -14 : 14),
      start.y + 5,
      "moving-mean-label",
      start.x > RIGHT - 150 ? "end" : "start",
    );
    this.transitionLayer.append(movingMean);
    this.setStatus(this.messages.status.step4);
    await this.runtime.animate(
      movingMean,
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(${target.x - start.x}px, ${target.y - start.y}px)` },
      ],
      { duration: 760, easing: "cubic-bezier(.2,.72,.22,1)", fill: "forwards" },
    );
    if (!this.runtime.isCurrent(token)) return;

    movingMean.remove();
    this.estimates.push(estimate);
    this.renderHistogram(histogramBin(estimate, this.histogramPlan()));
    this.renderMetrics();
    this.setStatus(this.messages.status.sampleSummary(this.formatCount(this.estimates.length), this.estimates.length === 1));
    await this.runtime.delay(220, token);
  }

  private async runAnimatedSequence(count: number) {
    if (this.busy) return;
    this.busy = true;
    const token = this.runtime.beginRun();
    this.updateControlAvailability();
    try {
      for (let index = 0; index < count && this.runtime.isCurrent(token); index += 1) {
        await this.animateOneSample(token);
      }
    } finally {
      if (this.runtime.isCurrent(token)) {
        this.busy = false;
        this.updateControlAvailability();
      }
    }
  }

  private generateBatch(count: number) {
    if (this.busy) return;
    const results = simulateBatch(this.configuration, count, this.rng);
    const latest = results[results.length - 1];
    if (latest === undefined) return;
    this.latestSample = latest.sample;
    this.latestEstimate = latest.estimate;
    this.estimates.push(...results.map((result) => result.estimate));
    this.renderLatestSampleImmediately();
    this.renderHistogram(histogramBin(latest.estimate, this.histogramPlan()));
    this.renderMetrics();
    this.setStatus(this.messages.status.batch(this.formatCount(count)));
  }

  private togglePause() {
    if (!this.busy) return;
    const paused = this.runtime.togglePaused();
    this.pauseButton.textContent = paused ? this.messages.controls.resume : this.messages.controls.pause;
    this.setStatus(paused ? this.messages.status.paused : this.messages.status.resumed);
  }

  private resetSimulation(message = this.messages.status.initial) {
    this.runtime.cancel();
    this.busy = false;
    this.configuration = this.readConfiguration();
    this.meanInput.value = String(this.configuration.mean);
    this.sdInput.value = String(this.configuration.sd);
    this.rng = createRng(this.seed);
    this.estimates = [];
    this.latestSample = [];
    this.latestEstimate = null;
    [this.sampleLayer, this.populationSampleLayer, this.meanLayer, this.histogramLayer, this.transitionLayer]
      .forEach(clearSvg);
    this.renderStaticStage();
    this.renderMetrics();
    this.updateControlAvailability();
    this.setStatus(message);
  }

  private updateControlAvailability() {
    [this.drawOneButton, this.animateTenButton, this.generateHundredButton].forEach((button) => {
      button.disabled = this.busy;
    });
    [this.meanInput, this.sdInput, this.sampleSizeInput, this.newSeedButton].forEach((control) => {
      control.disabled = this.busy;
    });
    this.pauseButton.disabled = !this.busy;
    this.pauseButton.textContent = this.runtime.isPaused ? this.messages.controls.resume : this.messages.controls.pause;
  }

  private async toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) {
        await this.root.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      this.setStatus(this.messages.status.fullscreenUnavailable);
    }
  }

  private setStatus(message: string) {
    this.statusOutput.textContent = message;
  }

  private format(value: number | null, digits = 2) {
    return value === null || !Number.isFinite(value)
      ? "—"
      : formatNumber(value, this.locale, digits, digits);
  }

  private formatCompact(value: number) {
    return new Intl.NumberFormat(localeTag(this.locale), { maximumSignificantDigits: 3 }).format(value);
  }

  private formatCount(value: number) {
    return value.toLocaleString(localeTag(this.locale));
  }

  private niceCountMaximum(value: number) {
    if (value <= 1) return 2;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const increment = Math.max(1, magnitude / 10);
    return Math.ceil((value * 1.08) / increment) * increment;
  }
}
