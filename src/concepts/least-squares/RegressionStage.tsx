import { useMemo } from "react";
import { predict, residuals, sumSquaredErrors, type RegressionFit, type RegressionLine } from "./model";
import type { RegressionScenario } from "./scenarios";
import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { leastSquaresMessages } from "./messages";

interface RegressionStageProps {
  scenario: RegressionScenario;
  line: RegressionLine;
  fit: RegressionFit;
  hasRevealedFit: boolean;
  squareRevealProgress: number;
  sseCollectionProgress: number;
  sseCollected: boolean;
  status: string;
}

const PLOT = { x: 100, y: 92, width: 658, height: 350 };
const MAP = { x: 882, y: 150, width: 260, height: 240 };
const ACCUMULATOR = { x: 62, y: 620, width: 1078, height: 23 };

function scale(value: number, domain: readonly [number, number], range: readonly [number, number]) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function ticks(domain: readonly [number, number], count = 5) {
  return Array.from({ length: count }, (_, index) => domain[0] + ((domain[1] - domain[0]) * index) / (count - 1));
}

function format(value: number, locale: Locale) {
  const magnitude = Math.abs(value);
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2;
  return formatNumber(value, locale, digits, digits);
}

function lineEquation(line: RegressionLine, locale: Locale) {
  const sign = line.slope < 0 ? "−" : "+";
  return `ŷ = ${format(line.intercept, locale)} ${sign} ${format(Math.abs(line.slope), locale)}x`;
}

function staggeredProgress(progress: number, index: number, count: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const start = count <= 1 ? 0 : (index / (count - 1)) * 0.42;
  const local = clamp((progress - start) / 0.58);
  return 1 - (1 - local) ** 3;
}

function residualColor(value: number) {
  if (Math.abs(value) < 1e-8) return "#2f8b74";
  return value > 0 ? "#d96825" : "#16708a";
}

export function RegressionStage(props: RegressionStageProps) {
  const { locale } = useLocale();
  const messages = leastSquaresMessages[locale];
  const scenarioCopy = props.scenario.copy[locale];
  const formatValue = (value: number) => format(value, locale);
  const x = (value: number) => scale(value, props.scenario.xDomain, [PLOT.x, PLOT.x + PLOT.width]);
  const y = (value: number) => scale(value, props.scenario.yDomain, [PLOT.y + PLOT.height, PLOT.y]);
  const slopeX = (value: number) => scale(value, props.scenario.slopeDomain, [MAP.x, MAP.x + MAP.width]);
  const interceptY = (value: number) => scale(value, props.scenario.interceptDomain, [MAP.y + MAP.height, MAP.y]);
  const residualItems = residuals(props.scenario.points, props.line);
  const candidateIsFit =
    Math.abs(props.line.slope - props.fit.slope) < 1e-8 &&
    Math.abs(props.line.intercept - props.fit.intercept) < 1e-8;

  const errorCells = useMemo(() => {
    const columns = 28;
    const rows = 24;
    const cells = Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const slope =
        props.scenario.slopeDomain[0] +
        ((column + 0.5) / columns) *
          (props.scenario.slopeDomain[1] - props.scenario.slopeDomain[0]);
      const intercept =
        props.scenario.interceptDomain[1] -
        ((row + 0.5) / rows) *
          (props.scenario.interceptDomain[1] - props.scenario.interceptDomain[0]);
      return { column, row, sse: sumSquaredErrors(props.scenario.points, { slope, intercept }) };
    });
    const minimum = Math.min(...cells.map((cell) => cell.sse));
    const maximum = Math.max(...cells.map((cell) => cell.sse));
    return cells.map((cell) => ({
      ...cell,
      intensity: Math.log1p(cell.sse - minimum) / Math.log1p(maximum - minimum),
      width: MAP.width / columns,
      height: MAP.height / rows,
    }));
  }, [props.scenario]);

  const candidateStart = {
    x: x(props.scenario.xDomain[0]),
    y: y(predict(props.line, props.scenario.xDomain[0])),
  };
  const candidateEnd = {
    x: x(props.scenario.xDomain[1]),
    y: y(predict(props.line, props.scenario.xDomain[1])),
  };
  const fitStart = {
    x: x(props.scenario.xDomain[0]),
    y: y(predict(props.fit, props.scenario.xDomain[0])),
  };
  const fitEnd = {
    x: x(props.scenario.xDomain[1]),
    y: y(predict(props.fit, props.scenario.xDomain[1])),
  };

  const squareGeometry = residualItems.map((item) => {
    const observedY = y(item.point.y);
    const predictedY = y(item.predicted);
    const side = Math.abs(observedY - predictedY);
    const pointX = x(item.point.x);
    const squareX = pointX + side + 7 > PLOT.x + PLOT.width ? pointX - side - 5 : pointX + 5;
    return {
      ...item,
      sourceX: squareX,
      sourceY: Math.min(observedY, predictedY),
      side,
      squaredError: item.residual ** 2,
      color: residualColor(item.residual),
    };
  });

  const effectiveSseMaximum = Math.max(props.fit.sst, 1);
  let accumulatedWidth = 0;
  const accumulatorSegments = squareGeometry.map((item, index) => {
    const width = (item.squaredError / effectiveSseMaximum) * ACCUMULATOR.width;
    const targetX = ACCUMULATOR.x + accumulatedWidth;
    accumulatedWidth += width;
    const progress = staggeredProgress(props.sseCollectionProgress, index, squareGeometry.length);
    return { ...item, targetX, targetWidth: width, progress };
  });
  const runningSse = accumulatorSegments.reduce(
    (sum, item) => sum + item.squaredError * item.progress,
    0,
  );

  return (
    <section className="regression-stage-card" aria-label={messages.stage.aria}>
      <div className="regression-stage-heading">
        <div>
          <span>{messages.stage.observations(props.scenario.points.length)}</span>
          <strong>{lineEquation(props.line, locale)}</strong>
        </div>
        <p role="status" aria-live="polite">{props.status}</p>
      </div>

      <div className="regression-svg-wrap">
        <svg viewBox="0 0 1200 750" role="img" aria-labelledby="regression-title regression-description">
          <title id="regression-title">{messages.stage.svgTitle}</title>
          <desc id="regression-description">{messages.stage.svgDescription}</desc>
          <defs>
            <clipPath id="regression-plot-clip">
              <rect x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} rx="8" />
            </clipPath>
            <clipPath id="sse-accumulator-clip">
              <rect x={ACCUMULATOR.x} y={ACCUMULATOR.y} width={ACCUMULATOR.width} height={ACCUMULATOR.height} rx="5" />
            </clipPath>
          </defs>

          <rect className="regression-panel-background" x="34" y="30" width="760" height="495" rx="24" />
          <text className="regression-zone-title" x="62" y="65">{messages.stage.dataTitle}</text>
          <text className="regression-zone-subtitle" x="62" y="84">
            {messages.stage.dataSubtitle}
          </text>

          {ticks(props.scenario.yDomain).map((value) => (
            <g key={`y-${value}`}>
              <line className="regression-grid-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={y(value)} y2={y(value)} />
              <text className="regression-axis-label" x={PLOT.x - 12} y={y(value) + 4} textAnchor="end">{formatValue(value)}</text>
            </g>
          ))}
          {ticks(props.scenario.xDomain).map((value) => (
            <g key={`x-${value}`}>
              <line className="regression-grid-line vertical" y1={PLOT.y} y2={PLOT.y + PLOT.height} x1={x(value)} x2={x(value)} />
              <text className="regression-axis-label" x={x(value)} y={PLOT.y + PLOT.height + 21} textAnchor="middle">{formatValue(value)}</text>
            </g>
          ))}
          <line className="regression-axis-line" x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
          <line className="regression-axis-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
          <text className="regression-axis-title" x={PLOT.x + PLOT.width / 2} y="495" textAnchor="middle">{scenarioCopy.xLabel}</text>
          <text className="regression-axis-title" transform={`translate(${PLOT.x - 50} ${PLOT.y + PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{scenarioCopy.yLabel}</text>

          <g clipPath="url(#regression-plot-clip)">
            <line
              className="outcome-mean-line"
              x1={PLOT.x}
              x2={PLOT.x + PLOT.width}
              y1={y(props.fit.yMean)}
              y2={y(props.fit.yMean)}
            />
            <text className="outcome-mean-label" x={PLOT.x + PLOT.width - 8} y={y(props.fit.yMean) - 8} textAnchor="end">
              {messages.stage.meanOfY} = {formatValue(props.fit.yMean)}
            </text>

            {props.squareRevealProgress > 0 && squareGeometry.map((item, index) => {
              const localProgress = accumulatorSegments[index].progress;
              return (
                <rect
                  className="residual-square"
                  key={`square-${item.point.id}`}
                  x={item.sourceX}
                  y={item.sourceY}
                  width={item.side * props.squareRevealProgress}
                  height={item.side}
                  fill={item.color}
                  stroke={item.color}
                  opacity={props.squareRevealProgress * (1 - localProgress * 0.72)}
                />
              );
            })}

            {residualItems.map((item, index) => {
              const localProgress = accumulatorSegments[index].progress;
              return (
                <line
                  className="residual-line"
                  key={`residual-${item.point.id}`}
                  x1={x(item.point.x)}
                  x2={x(item.point.x)}
                  y1={y(item.point.y)}
                  y2={y(item.predicted)}
                  stroke={residualColor(item.residual)}
                  opacity={1 - localProgress * 0.75}
                />
              );
            })}

            {props.hasRevealedFit && (
              <line className="fitted-line" x1={fitStart.x} y1={fitStart.y} x2={fitEnd.x} y2={fitEnd.y} />
            )}
            <line
              className={`candidate-line${props.hasRevealedFit && candidateIsFit ? " candidate-line-at-fit" : ""}`}
              x1={candidateStart.x}
              y1={candidateStart.y}
              x2={candidateEnd.x}
              y2={candidateEnd.y}
            />

            {props.scenario.points.map((point) => (
              <g key={point.id}>
                <circle className="observation-halo" cx={x(point.x)} cy={y(point.y)} r="9" />
                <circle className="observation-point" cx={x(point.x)} cy={y(point.y)} r="5.5">
                  <title>{`${scenarioCopy.xLabel}: ${formatValue(point.x)}; ${scenarioCopy.yLabel}: ${formatValue(point.y)}`}</title>
                </circle>
              </g>
            ))}
          </g>

          <g>
              <rect className="regression-panel-background" x="814" y="30" width="354" height="495" rx="24" />
              <text className="regression-zone-title" x="838" y="65">{messages.stage.landscapeTitle}</text>
              <text className="regression-zone-subtitle" x="838" y="84">{messages.stage.landscapeLine}</text>
              <text className="regression-zone-subtitle" x="838" y="103">{messages.stage.landscapeColor}</text>

              {errorCells.map((cell) => {
                const hue = 166 - cell.intensity * 125;
                const lightness = 39 + cell.intensity * 48;
                return (
                  <rect
                    key={`${cell.column}-${cell.row}`}
                    x={MAP.x + cell.column * cell.width}
                    y={MAP.y + cell.row * cell.height}
                    width={cell.width + 0.4}
                    height={cell.height + 0.4}
                    fill={`hsl(${hue} 46% ${lightness}%)`}
                  />
                );
              })}
              <rect className="error-map-border" x={MAP.x} y={MAP.y} width={MAP.width} height={MAP.height} />
              <text className="regression-axis-title" x={MAP.x + MAP.width / 2} y={MAP.y + MAP.height + 42} textAnchor="middle">{messages.stage.slope}</text>
              <text className="regression-axis-label" x={MAP.x} y={MAP.y + MAP.height + 19} textAnchor="middle">{formatValue(props.scenario.slopeDomain[0])}</text>
              <text className="regression-axis-label" x={MAP.x + MAP.width} y={MAP.y + MAP.height + 19} textAnchor="middle">{formatValue(props.scenario.slopeDomain[1])}</text>
              <text className="regression-axis-title" transform={`translate(${MAP.x - 48} ${MAP.y + MAP.height / 2}) rotate(-90)`} textAnchor="middle">{messages.stage.intercept}</text>
              <text className="regression-axis-label" x={MAP.x - 10} y={MAP.y + 4} textAnchor="end">{formatValue(props.scenario.interceptDomain[1])}</text>
              <text className="regression-axis-label" x={MAP.x - 10} y={MAP.y + MAP.height + 4} textAnchor="end">{formatValue(props.scenario.interceptDomain[0])}</text>

              {props.hasRevealedFit && (
                <g className="error-optimum-marker" transform={`translate(${slopeX(props.fit.slope)} ${interceptY(props.fit.intercept)})`}>
                  <circle r="10" />
                  <circle r="3" />
                  <text x="14" y="-12">{messages.stage.minimum}</text>
                </g>
              )}
              <g className="error-candidate-marker" transform={`translate(${slopeX(props.line.slope)} ${interceptY(props.line.intercept)})`}>
                <circle r="8" />
                <line x1="-13" x2="13" />
                <line y1="-13" y2="13" />
                <text x="13" y="21">{messages.stage.candidate}</text>
              </g>
              <text className="error-map-help" x={MAP.x + MAP.width / 2} y="487" textAnchor="middle">
                {messages.stage.mapHelp}
              </text>
          </g>

          <rect className="regression-panel-background" x="34" y="545" width="1134" height="178" rx="24" />

          <text className="regression-zone-title lower-title" x="62" y="575">{messages.stage.sseTitle}</text>
          <text className="regression-zone-subtitle" x="62" y="594">
            {messages.stage.sseSubtitle}
          </text>
          <rect className="sse-accumulator-track" x={ACCUMULATOR.x} y={ACCUMULATOR.y} width={ACCUMULATOR.width} height={ACCUMULATOR.height} rx="5" />
          <g clipPath="url(#sse-accumulator-clip)">
            {accumulatorSegments.map((item) => {
              if (item.progress <= 0) return null;
              const currentX = item.sourceX + (item.targetX - item.sourceX) * item.progress;
              const currentY = item.sourceY + (ACCUMULATOR.y - item.sourceY) * item.progress;
              const currentWidth = item.side + (item.targetWidth - item.side) * item.progress;
              const currentHeight = item.side + (ACCUMULATOR.height - item.side) * item.progress;
              return (
                <rect
                  className="moving-squared-error"
                  key={`moving-square-${item.point.id}`}
                  x={currentX}
                  y={currentY}
                  width={Math.max(0.5, currentWidth)}
                  height={Math.max(0.5, currentHeight)}
                  fill={item.color}
                  opacity={0.82}
                >
                  <title>{`${messages.stage.squaredResidual} ${formatNumber(item.squaredError, locale, 2, 2)}`}</title>
                </rect>
              );
            })}
          </g>
          <text className="sse-total-label" x={ACCUMULATOR.x + ACCUMULATOR.width} y="659" textAnchor="end">
            {props.sseCollectionProgress > 0 ? `${messages.stage.runningSse} = ${formatValue(runningSse)}` : messages.stage.chooseEvaluate}
          </text>
          {props.sseCollected && (
            <text className="sigma-label" x={ACCUMULATOR.x + ACCUMULATOR.width} y="702" textAnchor="end">SSE = Σeᵢ²</text>
          )}
        </svg>
      </div>
    </section>
  );
}
