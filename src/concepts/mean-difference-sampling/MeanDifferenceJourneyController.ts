import { normalDensity } from "../../domain/distributions/normal";
import { createRng, randomSeed, type RNG } from "../../domain/rng";
import { formatNumber, localeTag, type Locale } from "../../i18n/LocaleContext";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { appendSvgText, clearSvg, svgElement } from "../../visualization/svg";
import {
  createHistogramPlan,
  histogramBin,
  histogramCounts,
  type HistogramPlan,
} from "../sampling-distribution/histogram";
import { meanDifferenceMessages, type MeanDifferenceMessages } from "./messages";
import {
  empiricalMeanDifferenceStandardError,
  gelXPopulationMean,
  simulateExperiment,
  simulateExperimentBatch,
  theoreticalMeanDifferenceStandardError,
  type MeanDifferenceConfiguration,
  type MeanDifferenceResult,
} from "./model";

const OUTCOME_LEFT = 150;
const OUTCOME_RIGHT = 1135;
const OUTCOME_WIDTH = OUTCOME_RIGHT - OUTCOME_LEFT;
const POPULATION_AXIS_Y = 225;
const VEHICLE_ROW_Y = 435;
const GELX_ROW_Y = 495;
const DIFFERENCE_AXIS_Y = 780;
const HISTOGRAM_TOP_Y = 650;
const HISTOGRAM_BOTTOM_Y = DIFFERENCE_AXIS_Y - 2;

type Group = "vehicle" | "gelX";

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

export class MeanDifferenceJourneyController {
  private readonly messages: MeanDifferenceMessages;
  private configuration: MeanDifferenceConfiguration;
  private seed = 271828;
  private rng: RNG;
  private estimates: number[] = [];
  private latestResult: MeanDifferenceResult | null = null;
  private busy = false;
  private readonly cleanups: Array<() => void> = [];

  private readonly populationLayer: SVGGElement;
  private readonly populationSampleLayer: SVGGElement;
  private readonly experimentLayer: SVGGElement;
  private readonly meansLayer: SVGGElement;
  private readonly distributionReferenceLayer: SVGGElement;
  private readonly histogramLayer: SVGGElement;
  private readonly transitionLayer: SVGGElement;
  private readonly annotationLayer: SVGGElement;

  private readonly vehicleMeanInput: HTMLInputElement;
  private readonly trueEffectInput: HTMLInputElement;
  private readonly sdInput: HTMLInputElement;
  private readonly sampleSizeInput: HTMLSelectElement;
  private readonly speedInput: HTMLSelectElement;
  private readonly showTrueValuesInput: HTMLInputElement;
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
  private readonly latestDifferenceOutput: HTMLElement;
  private readonly experimentCountOutput: HTMLElement;
  private readonly empiricalSeOutput: HTMLElement;
  private readonly theoreticalSeOutput: HTMLElement;
  private readonly runtime: AnimationRuntime;

  constructor(private readonly root: HTMLElement, private readonly locale: Locale) {
    this.messages = meanDifferenceMessages[locale];
    this.populationLayer = this.layer("population");
    this.populationSampleLayer = this.layer("population-sample");
    this.experimentLayer = this.layer("experiment");
    this.meansLayer = this.layer("means");
    this.distributionReferenceLayer = this.layer("distribution-reference");
    this.histogramLayer = this.layer("histogram");
    this.transitionLayer = this.layer("transition");
    this.annotationLayer = this.layer("annotation");

    this.vehicleMeanInput = this.role("vehicle-mean");
    this.trueEffectInput = this.role("true-effect");
    this.sdInput = this.role("population-sd");
    this.sampleSizeInput = this.role("sample-size");
    this.speedInput = this.role("animation-speed");
    this.showTrueValuesInput = this.role("show-true-values");
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
    this.latestDifferenceOutput = this.role("latest-difference");
    this.experimentCountOutput = this.role("experiment-count");
    this.empiricalSeOutput = this.role("empirical-se");
    this.theoreticalSeOutput = this.role("theoretical-se");

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
    if (element === null) throw new Error(`Missing required mean-difference element: ${name}`);
    return element as T;
  }

  private layer(name: string): SVGGElement {
    const element = this.root.querySelector(`[data-layer="${name}"]`);
    if (!(element instanceof SVGGElement)) {
      throw new Error(`Missing required mean-difference layer: ${name}`);
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
    this.listen(this.resetButton, "click", () => this.resetSimulation(this.messages.status.resetReplay));
    this.listen(this.newSeedButton, "click", () => {
      this.seed = randomSeed();
      this.resetSimulation(this.messages.status.newSeed);
    });
    this.listen(this.fullscreenButton, "click", () => void this.toggleFullscreen());
    this.listen(document, "fullscreenchange", () => {
      this.fullscreenButton.textContent = document.fullscreenElement === null
        ? this.messages.presentation
        : this.messages.exitPresentation;
    });
    [this.vehicleMeanInput, this.trueEffectInput, this.sdInput, this.sampleSizeInput]
      .forEach((control) => this.listen(control, "change", () => {
        this.resetSimulation(this.messages.status.configurationReset);
      }));
    this.listen(this.showTrueValuesInput, "change", () => this.renderStaticStage());
    this.listen(this.reduceMotionInput, "change", () => {
      if (this.reduceMotionInput.checked) {
        this.runtime.finishActiveAnimations();
        this.setStatus(this.messages.status.reducedMotion);
      }
    });
  }

  private readConfiguration(): MeanDifferenceConfiguration {
    const vehicleMean = Number(this.vehicleMeanInput.value);
    const trueEffect = Number(this.trueEffectInput.value);
    const sd = Math.max(0.1, Number(this.sdInput.value));
    const sampleSizePerGroup = Math.max(2, Math.round(Number(this.sampleSizeInput.value)));
    return {
      vehicleMean: Number.isFinite(vehicleMean) ? vehicleMean : 56,
      trueEffect: Number.isFinite(trueEffect) ? trueEffect : 10,
      sd: Number.isFinite(sd) ? sd : 13.2,
      sampleSizePerGroup: Number.isFinite(sampleSizePerGroup) ? sampleSizePerGroup : 12,
    };
  }

  private outcomeDomain(): [number, number] {
    const gelXMean = gelXPopulationMean(this.configuration);
    return [
      Math.min(this.configuration.vehicleMean, gelXMean) - 4 * this.configuration.sd,
      Math.max(this.configuration.vehicleMean, gelXMean) + 4 * this.configuration.sd,
    ];
  }

  private differenceDomain(): [number, number] {
    const standardError = theoreticalMeanDifferenceStandardError(this.configuration);
    return [
      Math.min(0, this.configuration.trueEffect - 4.5 * standardError),
      Math.max(0, this.configuration.trueEffect + 4.5 * standardError),
    ];
  }

  private outcomeScale(value: number) {
    const [minimum, maximum] = this.outcomeDomain();
    return OUTCOME_LEFT + this.clamp((value - minimum) / (maximum - minimum)) * OUTCOME_WIDTH;
  }

  private differenceScale(value: number) {
    const [minimum, maximum] = this.differenceDomain();
    return OUTCOME_LEFT + this.clamp((value - minimum) / (maximum - minimum)) * OUTCOME_WIDTH;
  }

  private clamp(value: number) {
    return Math.min(1, Math.max(0, value));
  }

  private populationCurveY(value: number, group: Group) {
    const mean = group === "vehicle"
      ? this.configuration.vehicleMean
      : gelXPopulationMean(this.configuration);
    const distribution = { mean, sd: this.configuration.sd };
    const maximumDensity = normalDensity(mean, distribution);
    return POPULATION_AXIS_Y - (normalDensity(value, distribution) / maximumDensity) * 95;
  }

  private densityPath(group: Group) {
    const domain = this.outcomeDomain();
    const mean = group === "vehicle"
      ? this.configuration.vehicleMean
      : gelXPopulationMean(this.configuration);
    const distribution = { mean, sd: this.configuration.sd };
    const maximumDensity = normalDensity(mean, distribution);
    const points = Array.from({ length: 121 }, (_, index) => {
      const value = domain[0] + ((domain[1] - domain[0]) * index) / 120;
      return {
        x: this.outcomeScale(value),
        y: POPULATION_AXIS_Y - (normalDensity(value, distribution) / maximumDensity) * 95,
      };
    });
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  }

  private renderAxis(
    parent: SVGGElement,
    y: number,
    domain: readonly [number, number],
    scale: (value: number) => number,
    digits = 0,
  ) {
    parent.append(svgElement("line", {
      x1: OUTCOME_LEFT,
      y1: y,
      x2: OUTCOME_RIGHT,
      y2: y,
      class: "mean-difference-axis-line",
    }));
    Array.from({ length: 5 }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / 4)
      .forEach((value) => {
        const x = scale(value);
        parent.append(svgElement("line", {
          x1: x,
          y1: y,
          x2: x,
          y2: y + 7,
          class: "mean-difference-tick-line",
        }));
        appendSvgText(parent, this.format(value, digits), x, y + 25, "mean-difference-axis-label", "middle");
      });
  }

  private renderStaticStage() {
    clearSvg(this.populationLayer);
    clearSvg(this.distributionReferenceLayer);
    clearSvg(this.annotationLayer);

    appendSvgText(this.populationLayer, this.messages.stage.populationTitle, 58, 58, "mean-difference-zone-title");
    appendSvgText(this.populationLayer, this.messages.stage.populationSubtitle, 58, 86, "mean-difference-zone-subtitle");
    this.populationLayer.append(svgElement("path", {
      d: this.densityPath("vehicle"),
      class: "mean-difference-population-curve vehicle",
    }));
    this.populationLayer.append(svgElement("path", {
      d: this.densityPath("gelX"),
      class: "mean-difference-population-curve gelx",
    }));
    this.renderAxis(this.populationLayer, POPULATION_AXIS_Y, this.outcomeDomain(), (value) => this.outcomeScale(value));

    const populationMeans: Array<{ group: Group; label: string; value: number }> = [
      { group: "vehicle", label: this.messages.stage.vehicle, value: this.configuration.vehicleMean },
      { group: "gelX", label: this.messages.stage.gelX, value: gelXPopulationMean(this.configuration) },
    ];
    populationMeans.forEach(({ group, label, value }) => {
      const x = this.outcomeScale(value);
      if (this.showTrueValuesInput.checked) {
        this.populationLayer.append(svgElement("line", {
          x1: x,
          y1: 108,
          x2: x,
          y2: POPULATION_AXIS_Y,
          class: `mean-difference-true-mean-line ${group}`,
        }));
        appendSvgText(
          this.populationLayer,
          `${label}: μ = ${this.format(value, 1)}`,
          x + (group === "vehicle" ? -9 : 9),
          116,
          `mean-difference-population-label ${group}`,
          group === "vehicle" ? "end" : "start",
        );
      }
    });

    appendSvgText(this.annotationLayer, this.messages.stage.experimentTitle, 58, 315, "mean-difference-zone-title");
    appendSvgText(
      this.annotationLayer,
      this.messages.stage.experimentSubtitle(this.configuration.sampleSizePerGroup),
      58,
      343,
      "mean-difference-zone-subtitle",
    );
    this.renderGroupBaseline(this.annotationLayer, "vehicle", VEHICLE_ROW_Y);
    this.renderGroupBaseline(this.annotationLayer, "gelX", GELX_ROW_Y);

    appendSvgText(
      this.distributionReferenceLayer,
      this.messages.stage.distributionTitle,
      58,
      585,
      "mean-difference-zone-title",
    );
    appendSvgText(
      this.distributionReferenceLayer,
      this.messages.stage.distributionSubtitle(this.formatCompact(this.histogramPlan().binWidth)),
      58,
      613,
      "mean-difference-zone-subtitle",
    );
    this.renderAxis(
      this.distributionReferenceLayer,
      DIFFERENCE_AXIS_Y,
      this.differenceDomain(),
      (value) => this.differenceScale(value),
      1,
    );
    appendSvgText(
      this.distributionReferenceLayer,
      this.messages.stage.estimatedDifference,
      (OUTCOME_LEFT + OUTCOME_RIGHT) / 2,
      820,
      "mean-difference-axis-title",
      "middle",
    );
    if (this.showTrueValuesInput.checked) {
      const effectX = this.differenceScale(this.configuration.trueEffect);
      this.distributionReferenceLayer.append(svgElement("line", {
        x1: effectX,
        y1: HISTOGRAM_TOP_Y - 5,
        x2: effectX,
        y2: DIFFERENCE_AXIS_Y,
        class: "mean-difference-true-effect-line",
      }));
      appendSvgText(
        this.distributionReferenceLayer,
        `${this.messages.stage.trueEffect} Δ = ${this.format(this.configuration.trueEffect, 1)} pp`,
        effectX + 9,
        HISTOGRAM_TOP_Y - 13,
        "mean-difference-true-effect-label",
      );
    }
  }

  private renderGroupBaseline(parent: SVGGElement, group: Group, y: number) {
    appendSvgText(
      parent,
      group === "vehicle" ? this.messages.stage.vehicle : this.messages.stage.gelX,
      58,
      y + 6,
      `mean-difference-group-label ${group}`,
    );
    parent.append(svgElement("line", {
      x1: OUTCOME_LEFT,
      y1: y,
      x2: OUTCOME_RIGHT,
      y2: y,
      class: "mean-difference-group-baseline",
    }));
  }

  private sampleTarget(value: number, index: number, group: Group): Point {
    const rowY = group === "vehicle" ? VEHICLE_ROW_Y : GELX_ROW_Y;
    const rows = this.configuration.sampleSizePerGroup > 24 ? 4 : 3;
    return {
      x: this.outcomeScale(value),
      y: rowY + (index % rows - (rows - 1) / 2) * 11,
    };
  }

  private histogramPlan(): HistogramPlan {
    return createHistogramPlan(
      this.differenceDomain(),
      this.configuration.trueEffect,
      theoreticalMeanDifferenceStandardError(this.configuration),
    );
  }

  private histogramLayout(values: readonly number[]) {
    const plan = this.histogramPlan();
    const counts = histogramCounts(values, plan);
    const maximumCount = Math.max(0, ...counts);
    const yMaximum = this.niceCountMaximum(maximumCount);
    const chartHeight = HISTOGRAM_BOTTOM_Y - HISTOGRAM_TOP_Y;
    const [domainMinimum, domainMaximum] = this.differenceDomain();
    const bars: HistogramBar[] = counts.map((count, index) => {
      const lower = plan.start + index * plan.binWidth;
      const upper = lower + plan.binWidth;
      const x1 = this.differenceScale(Math.max(domainMinimum, lower));
      const x2 = this.differenceScale(Math.min(domainMaximum, upper));
      const height = (count / yMaximum) * chartHeight;
      return {
        index,
        lower,
        upper,
        count,
        x: x1 + 0.7,
        width: Math.max(1, x2 - x1 - 1.4),
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
      ? { x: this.differenceScale(value), y: HISTOGRAM_BOTTOM_Y }
      : { x: bar.x + bar.width / 2, y: bar.y };
  }

  private renderHistogram(highlightedBin: number | null = null) {
    clearSvg(this.histogramLayer);
    const layout = this.histogramLayout(this.estimates);
    layout.bars.forEach((bar) => {
      if (bar.count === 0) return;
      const rectangle = svgElement("rect", {
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: Math.max(1, bar.height),
        rx: Math.min(2, bar.width / 4),
        class: `mean-difference-histogram-bar${bar.index === highlightedBin ? " highlighted" : ""}`,
      });
      const title = svgElement("title");
      const percentage = this.estimates.length === 0 ? 0 : (100 * bar.count) / this.estimates.length;
      title.textContent = this.messages.stage.rangeTitle(
        this.formatCompact(bar.lower),
        this.formatCompact(bar.upper),
        this.formatCount(bar.count),
        this.format(percentage, 1),
        bar.count === 1,
      );
      rectangle.append(title);
      this.histogramLayer.append(rectangle);
    });
    this.histogramLayer.append(svgElement("line", {
      x1: OUTCOME_LEFT,
      y1: HISTOGRAM_TOP_Y,
      x2: OUTCOME_LEFT,
      y2: HISTOGRAM_BOTTOM_Y,
      class: "mean-difference-count-axis",
    }));
    appendSvgText(this.histogramLayer, this.formatCount(layout.yMaximum), OUTCOME_LEFT - 10, HISTOGRAM_TOP_Y + 6, "mean-difference-count-label", "end");
    appendSvgText(this.histogramLayer, "0", OUTCOME_LEFT - 10, HISTOGRAM_BOTTOM_Y + 5, "mean-difference-count-label", "end");
    appendSvgText(this.histogramLayer, this.messages.stage.count, OUTCOME_LEFT - 10, HISTOGRAM_TOP_Y - 10, "mean-difference-count-title", "end");
  }

  private renderMeans(result: MeanDifferenceResult) {
    clearSvg(this.meansLayer);
    const markers: Array<{ group: Group; value: number; y: number }> = [
      { group: "vehicle", value: result.vehicleSampleMean, y: VEHICLE_ROW_Y },
      { group: "gelX", value: result.gelXSampleMean, y: GELX_ROW_Y },
    ];
    markers.forEach(({ group, value, y }) => {
      const x = this.outcomeScale(value);
      this.meansLayer.append(svgElement("line", {
        x1: x,
        y1: y - 28,
        x2: x,
        y2: y + 28,
        class: `mean-difference-sample-mean-line ${group}`,
      }));
      appendSvgText(
        this.meansLayer,
        `x̄ = ${this.format(value, 1)}`,
        x,
        y - 34,
        `mean-difference-sample-mean-label ${group}`,
        "middle",
      );
    });
    return this.appendDeltaHatText(
      this.meansLayer,
      this.messages.stage.differenceFormula(
        this.format(result.gelXSampleMean, 1),
        this.format(result.vehicleSampleMean, 1),
        this.format(result.estimate, 1),
      ),
      58,
      380,
      "mean-difference-formula",
      "formula",
    );
  }

  private appendDeltaHatText(
    parent: SVGElement,
    suffix: string,
    x: number,
    y: number,
    textClass: string,
    size: "formula" | "moving",
  ) {
    const group = svgElement("g", { class: "mean-difference-delta-hat-group" });
    appendSvgText(group, `Δ${suffix}`, x, y, textClass);
    const isFormula = size === "formula";
    const centerX = x + (isFormula ? 7.5 : 6.5);
    const hatY = y - (isFormula ? 22 : 18);
    const halfWidth = isFormula ? 6 : 5;
    group.append(svgElement("path", {
      d: `M${centerX - halfWidth},${hatY + 4} L${centerX},${hatY} L${centerX + halfWidth},${hatY + 4}`,
      class: `mean-difference-delta-hat ${size}`,
    }));
    parent.append(group);
    return group;
  }

  private async animateMeans(result: MeanDifferenceResult) {
    const formula = this.renderMeans(result);
    const lines = [...this.meansLayer.querySelectorAll(".mean-difference-sample-mean-line")];
    await Promise.all([
      ...lines.map((line) => this.runtime.animate(
        line,
        [{ opacity: 0, transform: "scaleY(0)" }, { opacity: 1, transform: "scaleY(1)" }],
        { duration: 420, easing: "cubic-bezier(.2,.75,.25,1)", fill: "forwards" },
      )),
      this.runtime.animate(
        formula,
        [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0px)" }],
        { duration: 430, easing: "ease-out", fill: "forwards" },
      ),
    ]);
  }

  private renderLatestExperimentImmediately() {
    clearSvg(this.experimentLayer);
    clearSvg(this.populationSampleLayer);
    if (this.latestResult === null) return;
    this.groupSamples(this.latestResult).forEach(({ group, values }) => {
      values.forEach((value, index) => {
        const target = this.sampleTarget(value, index, group);
        this.experimentLayer.append(svgElement("circle", {
          cx: target.x,
          cy: target.y,
          r: this.configuration.sampleSizePerGroup > 24 ? 4.5 : 6,
          class: `mean-difference-sample-point ${group}`,
        }));
      });
    });
    this.renderMeans(this.latestResult);
  }

  private groupSamples(result: MeanDifferenceResult): Array<{ group: Group; values: number[] }> {
    return [
      { group: "vehicle", values: result.vehicleSample },
      { group: "gelX", values: result.gelXSample },
    ];
  }

  private renderMetrics() {
    this.latestDifferenceOutput.textContent = this.format(this.latestResult?.estimate ?? null, 1);
    this.experimentCountOutput.textContent = this.formatCount(this.estimates.length);
    this.empiricalSeOutput.textContent = this.format(empiricalMeanDifferenceStandardError(this.estimates), 1);
    this.theoreticalSeOutput.textContent = this.format(theoreticalMeanDifferenceStandardError(this.configuration), 1);
    this.seedOutput.textContent = String(this.seed);
  }

  private async animateOneExperiment(token: number) {
    const result = simulateExperiment(this.configuration, this.rng);
    clearSvg(this.experimentLayer);
    clearSvg(this.populationSampleLayer);
    clearSvg(this.meansLayer);
    clearSvg(this.transitionLayer);
    this.setStatus(this.messages.status.step1(this.configuration.sampleSizePerGroup));

    const circles = this.groupSamples(result).flatMap(({ group, values }) => values.map((value, index) => {
      const origin = { x: this.outcomeScale(value), y: this.populationCurveY(value, group) };
      const target = this.sampleTarget(value, index, group);
      const circle = svgElement("circle", {
        cx: origin.x,
        cy: origin.y,
        r: this.configuration.sampleSizePerGroup > 24 ? 4.5 : 6,
        class: `mean-difference-sample-point ${group}`,
        opacity: 0,
      });
      this.experimentLayer.append(circle);
      return { circle, origin, target, group, index };
    }));

    await Promise.all(circles.map(({ circle, index }) => this.runtime.animate(
      circle,
      [{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "scale(1)" }],
      {
        duration: 320,
        delay: this.reduceMotionInput.checked ? 0 : Math.min(index * 14, 180),
        easing: "ease-out",
        fill: "forwards",
      },
    )));
    if (!this.runtime.isCurrent(token)) return;

    circles.forEach(({ origin, group }) => {
      this.populationSampleLayer.append(svgElement("circle", {
        cx: origin.x,
        cy: origin.y,
        r: this.configuration.sampleSizePerGroup > 24 ? 4 : 5.5,
        class: `mean-difference-population-sample-point ${group}`,
      }));
    });
    this.setStatus(this.messages.status.step2);

    await Promise.all(circles.map(async ({ circle, origin, target }) => {
      await this.runtime.animate(
        circle,
        [
          { opacity: 1, transform: "translate(0px, 0px)" },
          { opacity: 1, transform: `translate(${target.x - origin.x}px, ${target.y - origin.y}px)` },
        ],
        { duration: 620, easing: "cubic-bezier(.22,.75,.25,1)", fill: "forwards" },
      );
      circle.getAnimations().forEach((animation) => animation.cancel());
      circle.setAttribute("cx", String(target.x));
      circle.setAttribute("cy", String(target.y));
      circle.setAttribute("opacity", "1");
      circle.removeAttribute("style");
    }));
    if (!this.runtime.isCurrent(token)) return;

    this.latestResult = result;
    this.renderMetrics();
    this.setStatus(this.messages.status.step3(this.format(result.estimate, 1)));
    await this.animateMeans(result);
    await this.runtime.delay(560, token);
    if (!this.runtime.isCurrent(token)) return;

    const start = { x: 300, y: 370 };
    const target = this.targetForNewEstimate(result.estimate);
    const movingEstimate = svgElement("g", { class: "mean-difference-moving-token" });
    movingEstimate.append(svgElement("circle", {
      cx: start.x,
      cy: start.y,
      r: 9,
      class: "mean-difference-moving-estimate",
    }));
    this.appendDeltaHatText(
      movingEstimate,
      ` ${this.format(result.estimate, 1)}`,
      start.x + 16,
      start.y + 6,
      "mean-difference-moving-label",
      "moving",
    );
    this.transitionLayer.append(movingEstimate);
    this.setStatus(this.messages.status.step4);
    await this.runtime.animate(
      movingEstimate,
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(${target.x - start.x}px, ${target.y - start.y}px)` },
      ],
      { duration: 760, easing: "cubic-bezier(.2,.72,.22,1)", fill: "forwards" },
    );
    if (!this.runtime.isCurrent(token)) return;

    movingEstimate.remove();
    this.estimates.push(result.estimate);
    this.renderHistogram(histogramBin(result.estimate, this.histogramPlan()));
    this.renderMetrics();
    this.setStatus(this.messages.status.experimentSummary(
      this.formatCount(this.estimates.length),
      this.estimates.length === 1,
    ));
    await this.runtime.delay(220, token);
  }

  private async runAnimatedSequence(count: number) {
    if (this.busy) return;
    this.busy = true;
    const token = this.runtime.beginRun();
    this.updateControlAvailability();
    try {
      for (let index = 0; index < count && this.runtime.isCurrent(token); index += 1) {
        await this.animateOneExperiment(token);
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
    const results = simulateExperimentBatch(this.configuration, count, this.rng);
    const latest = results[results.length - 1];
    if (latest === undefined) return;
    this.latestResult = latest;
    this.estimates.push(...results.map((result) => result.estimate));
    this.renderLatestExperimentImmediately();
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
    this.vehicleMeanInput.value = String(this.configuration.vehicleMean);
    this.trueEffectInput.value = String(this.configuration.trueEffect);
    this.sdInput.value = String(this.configuration.sd);
    this.rng = createRng(this.seed);
    this.estimates = [];
    this.latestResult = null;
    [
      this.populationSampleLayer,
      this.experimentLayer,
      this.meansLayer,
      this.histogramLayer,
      this.transitionLayer,
    ].forEach(clearSvg);
    this.renderStaticStage();
    this.renderMetrics();
    this.updateControlAvailability();
    this.setStatus(message);
  }

  private updateControlAvailability() {
    [this.drawOneButton, this.animateTenButton, this.generateHundredButton]
      .forEach((button) => { button.disabled = this.busy; });
    [this.vehicleMeanInput, this.trueEffectInput, this.sdInput, this.sampleSizeInput, this.newSeedButton]
      .forEach((control) => { control.disabled = this.busy; });
    this.pauseButton.disabled = !this.busy;
    this.pauseButton.textContent = this.runtime.isPaused
      ? this.messages.controls.resume
      : this.messages.controls.pause;
  }

  private async toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) await this.root.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      this.setStatus(this.messages.status.fullscreenUnavailable);
    }
  }

  private setStatus(message: string) {
    this.statusOutput.textContent = message;
  }

  private format(value: number | null, digits = 1) {
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
