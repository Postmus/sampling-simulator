import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { diagnosticsMessages } from "./messages";
import { fitDiagnosticModel, normalDensity } from "./model";
import type { DiagnosticScenario } from "./scenarios";

interface DiagnosticsStageProps {
  scenario: DiagnosticScenario;
  modelMix: number;
  fitProgress: number;
  residualProgress: number;
  fittedPlotProgress: number;
  distributionProgress: number;
  referenceProgress: number;
  equation: string;
  status: string;
}

const TOP = { x: 30, y: 25, width: 1140, height: 405 };
const TOP_PLOT = { x: 92, y: 82, width: 1015, height: 270 };
const DISTRIBUTION = { x: 30, y: 450, width: 555, height: 315 };
const DISTRIBUTION_PLOT = { x: 92, y: 530, width: 438, height: 170 };
const FITTED = { x: 615, y: 450, width: 555, height: 315 };
const FITTED_PLOT = { x: 677, y: 530, width: 438, height: 170 };
const DISTRIBUTION_BIN_COUNT = 11;

function scale(value: number, domain: readonly [number, number], range: readonly [number, number]) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

function mix(first: number, second: number, progress: number) {
  return first + (second - first) * progress;
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function ticks(domain: readonly [number, number], count = 5) {
  return Array.from({ length: count }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / (count - 1));
}

function format(value: number, locale: Locale) {
  const absolute = Math.abs(value);
  const digits = absolute >= 100 ? 0 : absolute >= 10 ? 1 : 2;
  return formatNumber(value, locale, digits, digits);
}

function residualColor(value: number) {
  return value >= 0 ? "#d96825" : "#16708a";
}

function niceResidualExtent(residuals: readonly { residual: number }[]) {
  const maximum = Math.max(1, ...residuals.map((item) => Math.abs(item.residual))) * 1.12;
  const step = maximum <= 8 ? 2 : maximum <= 20 ? 4 : maximum <= 40 ? 5 : 10;
  return Math.max(4, Math.ceil(maximum / step) * step);
}

function buildDotLayout(
  residuals: readonly { point: { id: string }; residual: number }[],
  extent: number,
) {
  const counts = Array.from({ length: DISTRIBUTION_BIN_COUNT }, () => 0);
  const binWidth = (2 * extent) / DISTRIBUTION_BIN_COUNT;
  const assignments = residuals.map((item) => {
    const bin = Math.min(
      DISTRIBUTION_BIN_COUNT - 1,
      Math.max(0, Math.floor((item.residual + extent) / binWidth)),
    );
    const level = counts[bin];
    counts[bin] += 1;
    return { id: item.point.id, bin, level };
  });
  const maximumCount = Math.max(...counts);
  const axisMaximum = Math.max(4, Math.ceil((maximumCount + 1) / 2) * 2);
  const targets = new Map<string, { x: number; y: number }>();
  assignments.forEach((assignment) => {
    const binCentre = -extent + (assignment.bin + 0.5) * binWidth;
    targets.set(assignment.id, {
      x: scale(binCentre, [-extent, extent], [DISTRIBUTION_PLOT.x, DISTRIBUTION_PLOT.x + DISTRIBUTION_PLOT.width]),
      y: scale(
        assignment.level + 1,
        [0, axisMaximum],
        [DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height, DISTRIBUTION_PLOT.y],
      ),
    });
  });
  return { extent, axisMaximum, targets };
}

function staggeredProgress(progress: number, index: number, count: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const start = count <= 1 ? 0 : (index / (count - 1)) * 0.38;
  const local = clamp((progress - start) / 0.62);
  return 1 - (1 - local) ** 3;
}

export function DiagnosticsStage(props: DiagnosticsStageProps) {
  const { locale } = useLocale();
  const messages = diagnosticsMessages[locale];
  const copy = props.scenario.copy[locale];
  const rawModel = fitDiagnosticModel(props.scenario.points, "raw");
  const logModel = props.scenario.supportsLog
    ? fitDiagnosticModel(props.scenario.points, "log")
    : rawModel;
  const modelMix = props.scenario.supportsLog ? props.modelMix : 0;
  const rawDomain = props.scenario.xDomain;
  const logDomain = props.scenario.logDomain ?? rawDomain;
  const formatValue = (value: number) => format(value, locale);
  const topY = (value: number) => scale(value, props.scenario.yDomain, [TOP_PLOT.y + TOP_PLOT.height, TOP_PLOT.y]);
  const residualY = (value: number) => scale(value, props.scenario.residualDomain, [FITTED_PLOT.y + FITTED_PLOT.height, FITTED_PLOT.y]);
  const fittedX = (value: number) => scale(value, props.scenario.yDomain, [FITTED_PLOT.x, FITTED_PLOT.x + FITTED_PLOT.width]);
  const pointX = (rawX: number, logX: number) => mix(
    scale(rawX, rawDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width]),
    scale(logX, logDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width]),
    modelMix,
  );

  const items = props.scenario.points.map((point, index) => {
    const raw = rawModel.residuals[index];
    const logged = logModel.residuals[index];
    const predicted = mix(raw.predicted, logged.predicted, modelMix);
    const residual = point.y - predicted;
    return {
      point,
      rawModelX: raw.modelX,
      logModelX: logged.modelX,
      predicted,
      residual,
      sourceX: pointX(raw.modelX, logged.modelX),
      sourceY: (topY(point.y) + topY(predicted)) / 2,
    };
  });

  const rawDotLayout = buildDotLayout(
    rawModel.residuals,
    niceResidualExtent(rawModel.residuals),
  );
  const logDotLayout = buildDotLayout(
    logModel.residuals,
    niceResidualExtent(logModel.residuals),
  );
  const distributionExtent = mix(rawDotLayout.extent, logDotLayout.extent, modelMix);
  const distributionDomain: [number, number] = [-distributionExtent, distributionExtent];
  const distributionAxisMaximum = mix(
    rawDotLayout.axisMaximum,
    logDotLayout.axisMaximum,
    modelMix,
  );
  const distributionX = (value: number) => scale(
    value,
    distributionDomain,
    [DISTRIBUTION_PLOT.x, DISTRIBUTION_PLOT.x + DISTRIBUTION_PLOT.width],
  );
  const distributionY = (value: number) => scale(
    value,
    [0, distributionAxisMaximum],
    [DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height, DISTRIBUTION_PLOT.y],
  );

  const xMinimum = TOP_PLOT.x;
  const xMaximum = TOP_PLOT.x + TOP_PLOT.width;
  const rawStartPrediction = rawModel.fit.intercept + rawModel.fit.slope * rawDomain[0];
  const rawEndPrediction = rawModel.fit.intercept + rawModel.fit.slope * rawDomain[1];
  const logStartPrediction = logModel.fit.intercept + logModel.fit.slope * logDomain[0];
  const logEndPrediction = logModel.fit.intercept + logModel.fit.slope * logDomain[1];
  const fittedStartY = topY(mix(rawStartPrediction, logStartPrediction, modelMix));
  const fittedEndY = topY(mix(rawEndPrediction, logEndPrediction, modelMix));
  const lineEndX = mix(xMinimum, xMaximum, props.fitProgress);
  const lineEndY = mix(fittedStartY, fittedEndY, props.fitProgress);

  const residualStandardDeviation = Math.sqrt(
    items.reduce((sum, item) => sum + item.residual ** 2, 0) / Math.max(1, items.length - 2),
  );
  const distributionBinWidth = (2 * distributionExtent) / DISTRIBUTION_BIN_COUNT;
  const normalPath = Array.from({ length: 61 }, (_, index) => {
    const value = distributionDomain[0] +
      (index / 60) * (distributionDomain[1] - distributionDomain[0]);
    const x = distributionX(value);
    const density = normalDensity(value, residualStandardDeviation);
    const expectedCount = items.length * distributionBinWidth * density;
    const y = distributionY(expectedCount);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <section className="diagnostics-stage-card" aria-label={messages.stage.aria}>
      <div className="diagnostics-stage-heading">
        <div>
          <span>{messages.stage.observations(props.scenario.points.length)}</span>
          <strong>{props.equation}</strong>
        </div>
        <p role="status" aria-live="polite">{props.status}</p>
      </div>

      <div className="diagnostics-svg-wrap">
        <svg viewBox="0 0 1200 790" role="img" aria-labelledby="diagnostics-title diagnostics-description">
          <title id="diagnostics-title">{messages.stage.svgTitle}</title>
          <desc id="diagnostics-description">{messages.stage.svgDescription}</desc>
          <defs>
            <clipPath id="diagnostics-top-clip">
              <rect x={TOP_PLOT.x} y={TOP_PLOT.y} width={TOP_PLOT.width} height={TOP_PLOT.height} />
            </clipPath>
            <clipPath id="diagnostics-distribution-clip">
              <rect x={DISTRIBUTION_PLOT.x} y={DISTRIBUTION_PLOT.y - 3} width={DISTRIBUTION_PLOT.width} height={DISTRIBUTION_PLOT.height + 6} />
            </clipPath>
          </defs>

          <rect className="diagnostics-panel-background" {...TOP} rx="22" />
          <text className="diagnostics-zone-title" x="54" y="56">{messages.stage.dataTitle}</text>
          <text className="diagnostics-zone-subtitle" x="54" y="74">{messages.stage.dataSubtitle}</text>

          {ticks(props.scenario.yDomain).map((value) => (
            <g key={`top-y-${value}`}>
              <line className="diagnostics-grid-line" x1={TOP_PLOT.x} x2={TOP_PLOT.x + TOP_PLOT.width} y1={topY(value)} y2={topY(value)} />
              <text className="diagnostics-axis-label" x={TOP_PLOT.x - 10} y={topY(value) + 4} textAnchor="end">{formatValue(value)}</text>
            </g>
          ))}

          <g opacity={1 - modelMix}>
            {ticks(rawDomain, 6).map((value) => (
              <g key={`raw-x-${value}`}>
                <line className="diagnostics-grid-line vertical" x1={scale(value, rawDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} x2={scale(value, rawDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} y1={TOP_PLOT.y} y2={TOP_PLOT.y + TOP_PLOT.height} />
                <text className="diagnostics-axis-label" x={scale(value, rawDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} y={TOP_PLOT.y + TOP_PLOT.height + 19} textAnchor="middle">{formatValue(value)}</text>
              </g>
            ))}
            <text className="diagnostics-axis-title" x={TOP_PLOT.x + TOP_PLOT.width / 2} y="402" textAnchor="middle">{copy.xLabel}</text>
          </g>
          {props.scenario.supportsLog && (
            <g opacity={modelMix}>
              {ticks(logDomain, 6).map((value) => (
                <g key={`log-x-${value}`}>
                  <line className="diagnostics-grid-line vertical" x1={scale(value, logDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} x2={scale(value, logDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} y1={TOP_PLOT.y} y2={TOP_PLOT.y + TOP_PLOT.height} />
                  <text className="diagnostics-axis-label" x={scale(value, logDomain, [TOP_PLOT.x, TOP_PLOT.x + TOP_PLOT.width])} y={TOP_PLOT.y + TOP_PLOT.height + 19} textAnchor="middle">{formatValue(value)}</text>
                </g>
              ))}
              <text className="diagnostics-axis-title" x={TOP_PLOT.x + TOP_PLOT.width / 2} y="402" textAnchor="middle">{`log₂(${copy.xLabel})`}</text>
            </g>
          )}
          <line className="diagnostics-axis-line" x1={TOP_PLOT.x} x2={TOP_PLOT.x} y1={TOP_PLOT.y} y2={TOP_PLOT.y + TOP_PLOT.height} />
          <line className="diagnostics-axis-line" x1={TOP_PLOT.x} x2={TOP_PLOT.x + TOP_PLOT.width} y1={TOP_PLOT.y + TOP_PLOT.height} y2={TOP_PLOT.y + TOP_PLOT.height} />
          <text className="diagnostics-axis-title" transform={`translate(${TOP_PLOT.x - 53} ${TOP_PLOT.y + TOP_PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{copy.yLabel}</text>

          <g clipPath="url(#diagnostics-top-clip)">
            {props.fitProgress > 0 && (
              <line className="diagnostics-fitted-line" x1={xMinimum} y1={fittedStartY} x2={lineEndX} y2={lineEndY} />
            )}
            {props.residualProgress > 0 && items.map((item, index) => {
              const local = staggeredProgress(props.residualProgress, index, items.length);
              return (
                <line
                  className="diagnostics-residual-line"
                  key={`residual-${item.point.id}`}
                  x1={item.sourceX}
                  x2={item.sourceX}
                  y1={topY(item.predicted)}
                  y2={mix(topY(item.predicted), topY(item.point.y), local)}
                  stroke={residualColor(item.residual)}
                />
              );
            })}
            {items.map((item) => (
              <g key={`point-${item.point.id}`}>
                <circle className="diagnostics-observation-halo" cx={item.sourceX} cy={topY(item.point.y)} r="8.5" />
                <circle className="diagnostics-observation-point" cx={item.sourceX} cy={topY(item.point.y)} r="5.2">
                  <title>{`${copy.xLabel}: ${formatValue(item.point.x)}; ${copy.yLabel}: ${formatValue(item.point.y)}`}</title>
                </circle>
              </g>
            ))}
          </g>

          <rect className="diagnostics-panel-background" {...FITTED} rx="22" />
          <text className="diagnostics-zone-title lower" x="639" y="482">{messages.stage.fittedTitle}</text>
          <text className="diagnostics-zone-subtitle" x="639" y="503">{messages.stage.fittedSubtitle}</text>
          {ticks(props.scenario.residualDomain).map((value) => (
            <g key={`left-y-${value}`}>
              <line className={Math.abs(value) < 1e-8 ? "diagnostics-zero-line" : "diagnostics-grid-line"} x1={FITTED_PLOT.x} x2={FITTED_PLOT.x + FITTED_PLOT.width} y1={residualY(value)} y2={residualY(value)} />
              <text className="diagnostics-axis-label" x={FITTED_PLOT.x - 9} y={residualY(value) + 4} textAnchor="end">{formatValue(value)}</text>
            </g>
          ))}
          {ticks(props.scenario.yDomain).map((value) => (
            <text className="diagnostics-axis-label" key={`fitted-x-${value}`} x={fittedX(value)} y={FITTED_PLOT.y + FITTED_PLOT.height + 18} textAnchor="middle">{formatValue(value)}</text>
          ))}
          <line className="diagnostics-axis-line" x1={FITTED_PLOT.x} x2={FITTED_PLOT.x} y1={FITTED_PLOT.y} y2={FITTED_PLOT.y + FITTED_PLOT.height} />
          <line className="diagnostics-axis-line" x1={FITTED_PLOT.x} x2={FITTED_PLOT.x + FITTED_PLOT.width} y1={FITTED_PLOT.y + FITTED_PLOT.height} y2={FITTED_PLOT.y + FITTED_PLOT.height} />
          <text className="diagnostics-axis-title" x={FITTED_PLOT.x + FITTED_PLOT.width / 2} y="746" textAnchor="middle">{messages.stage.fittedAxis}</text>
          <text className="diagnostics-axis-title" transform={`translate(${FITTED_PLOT.x - 48} ${FITTED_PLOT.y + FITTED_PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{messages.stage.residualAxis}</text>
          <g>
            {props.fittedPlotProgress > 0 && items.map((item, index) => {
              const local = staggeredProgress(props.fittedPlotProgress, index, items.length);
              return (
                <circle
                  className="diagnostics-residual-token"
                  key={`fitted-token-${item.point.id}`}
                  cx={mix(item.sourceX, fittedX(item.predicted), local)}
                  cy={mix(item.sourceY, residualY(item.residual), local)}
                  r="5.2"
                  fill={residualColor(item.residual)}
                  opacity={clamp(local * 1.5)}
                />
              );
            })}
          </g>

          <rect className="diagnostics-panel-background" {...DISTRIBUTION} rx="22" />
          <text className="diagnostics-zone-title lower" x="54" y="482">{messages.stage.distributionTitle}</text>
          <text className="diagnostics-zone-subtitle" x="54" y="503">{messages.stage.distributionSubtitle}</text>
          <line className="diagnostics-axis-line" x1={DISTRIBUTION_PLOT.x} x2={DISTRIBUTION_PLOT.x + DISTRIBUTION_PLOT.width} y1={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height} y2={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height} />
          <line className="diagnostics-axis-line" x1={DISTRIBUTION_PLOT.x} x2={DISTRIBUTION_PLOT.x} y1={DISTRIBUTION_PLOT.y} y2={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height} />
          <line className="diagnostics-zero-line vertical" x1={distributionX(0)} x2={distributionX(0)} y1={DISTRIBUTION_PLOT.y} y2={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height} />
          {ticks(distributionDomain).map((value) => (
            <g key={`distribution-x-${value}`}>
              <line className="diagnostics-axis-tick" x1={distributionX(value)} x2={distributionX(value)} y1={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height} y2={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height + 5} />
              <text className="diagnostics-axis-label" x={distributionX(value)} y={DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height + 18} textAnchor="middle">{formatValue(value)}</text>
            </g>
          ))}
          {[0, distributionAxisMaximum / 2, distributionAxisMaximum].map((value) => (
            <g key={`distribution-y-${value}`}>
              <line className="diagnostics-axis-tick" x1={DISTRIBUTION_PLOT.x - 5} x2={DISTRIBUTION_PLOT.x} y1={distributionY(value)} y2={distributionY(value)} />
              <text className="diagnostics-axis-label" x={DISTRIBUTION_PLOT.x - 9} y={distributionY(value) + 4} textAnchor="end">{formatNumber(value, locale, 0)}</text>
            </g>
          ))}
          <text className="diagnostics-axis-title" x={DISTRIBUTION_PLOT.x + DISTRIBUTION_PLOT.width / 2} y="746" textAnchor="middle">{messages.stage.residualAxis}</text>
          <text className="diagnostics-axis-title" transform={`translate(${DISTRIBUTION_PLOT.x - 45} ${DISTRIBUTION_PLOT.y + DISTRIBUTION_PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{messages.stage.countAxis}</text>
          <g clipPath="url(#diagnostics-distribution-clip)">
            <path className="diagnostics-normal-reference" d={normalPath} opacity={props.referenceProgress} />
          </g>
          <g>
            {props.distributionProgress > 0 && items.map((item, index) => {
              const local = staggeredProgress(props.distributionProgress, index, items.length);
              const rawTarget = rawDotLayout.targets.get(item.point.id)!;
              const logTarget = logDotLayout.targets.get(item.point.id)!;
              return (
                <circle
                  className="diagnostics-residual-token"
                  key={`distribution-token-${item.point.id}`}
                  cx={mix(item.sourceX, mix(rawTarget.x, logTarget.x, modelMix), local)}
                  cy={mix(item.sourceY, mix(rawTarget.y, logTarget.y, modelMix), local)}
                  r="5.2"
                  fill={residualColor(item.residual)}
                  opacity={clamp(local * 1.5)}
                />
              );
            })}
          </g>
          <g className="diagnostics-normal-key" opacity={props.referenceProgress}>
            <line x1="397" x2="427" y1="482" y2="482" />
            <text x="434" y="486">{messages.stage.normalReference}</text>
          </g>
        </svg>
      </div>
    </section>
  );
}
