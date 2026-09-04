import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { periodontalData, TREATMENT_GROUPS, type TreatmentGroup } from "./data";
import { ancovaMessages } from "./messages";
import { predictGroup, type AncovaFit, type AncovaModelKind, type CoefficientInference } from "./model";

interface AncovaStageProps {
  unadjusted: AncovaFit;
  adjusted: AncovaFit;
  activeModel: AncovaModelKind | null;
  adjustedRevealed: boolean;
  lineRevealProgress: number;
  modelMix: number;
  status: string;
}

const PLOT = { x: 86, y: 58, width: 650, height: 370 };
const X_DOMAIN: readonly [number, number] = [3.5, 7.8];
const Y_DOMAIN: readonly [number, number] = [1.8, 6.2];
const GROUP_COLORS: Record<TreatmentGroup, string> = {
  standard: "#0b5c66",
  rinse: "#2f9da2",
  adjunct: "#df7a5d",
};

function scale(value: number, domain: readonly [number, number], range: readonly [number, number]) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

function coefficient(fit: AncovaFit, term: "rinse" | "adjunct") {
  return fit.coefficients.find((entry) => entry.term === term)!;
}

function formatEstimate(value: number, locale: Locale) {
  return formatNumber(value, locale, 2, 2);
}

function interval(entry: CoefficientInference, locale: Locale) {
  return `[${formatEstimate(entry.confidenceLow, locale)}; ${formatEstimate(entry.confidenceHigh, locale)}]`;
}

function TreatmentResultCards({ fit }: { fit: AncovaFit }) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  return (
    <div className="ancova-key-results">
      {(["rinse", "adjunct"] as const).map((term) => {
        const entry = coefficient(fit, term);
        return (
          <article className="ancova-key-result" key={term}>
            <span>{messages.terms[term]}</span>
            <div className="ancova-estimate-se">
              <span>
                <small>{messages.estimate}</small>
                <strong>{formatEstimate(entry.estimate, locale)} mm</strong>
              </span>
              <span>
                <small>{messages.standardError}</small>
                <strong>{formatEstimate(entry.standardError, locale)} mm</strong>
              </span>
            </div>
            <small>{messages.confidenceInterval}: {interval(entry, locale)}</small>
          </article>
        );
      })}
    </div>
  );
}

function ModelFormula({ kind }: { kind: AncovaModelKind }) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  const rinseCoefficient = kind === "adjusted" ? 2 : 1;
  const adjunctCoefficient = kind === "adjusted" ? 3 : 2;
  return (
    <div className="ancova-formula" aria-label={messages.modelFormula[kind]}>
      <span aria-hidden="true">
        <span className="formula-term"><var>Y</var><sub>i</sub></span>
        <span className="formula-operator"> = </span>
        <span className="formula-term">β<sub>0</sub></span>
        {kind === "adjusted" && <>
          <span className="formula-operator"> + </span>
          <span className="formula-term">β<sub>1</sub><span className="formula-variable">PDstart</span><sub>i</sub></span>
        </>}
        <span className="formula-operator"> + </span>
        <span className="formula-term">β<sub>{rinseCoefficient}</sub> × d<sub>mond,i</sub></span>
        <span className="formula-operator"> + </span>
        <span className="formula-term">β<sub>{adjunctCoefficient}</sub> × d<sub>aanv,i</sub></span>
        <span className="formula-operator"> + </span>
        <span className="formula-term">ε<sub>i</sub></span>
      </span>
    </div>
  );
}

function ModelResultBlock(props: {
  fit: AncovaFit;
  kind: AncovaModelKind;
  active: boolean;
  step: number;
}) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  return (
    <section className={`ancova-model-result-block${props.active ? " active" : ""}`}>
      <h3><span>{props.step}</span>{messages.modelNames[props.kind]}</h3>
      <ModelFormula kind={props.kind} />
      <TreatmentResultCards fit={props.fit} />
    </section>
  );
}

export function AncovaStage(props: AncovaStageProps) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  const x = (value: number) => scale(value, X_DOMAIN, [PLOT.x, PLOT.x + PLOT.width]);
  const y = (value: number) => scale(value, Y_DOMAIN, [PLOT.y + PLOT.height, PLOT.y]);
  const xTicks = [4, 5, 6, 7];
  const yTicks = [2, 3, 4, 5, 6];

  function mixedPrediction(group: TreatmentGroup, baseline: number) {
    const before = predictGroup(props.unadjusted, group, baseline);
    const after = predictGroup(props.adjusted, group, baseline);
    return before + (after - before) * props.modelMix;
  }

  return (
    <section className="ancova-stage-card" aria-label={messages.aria}>
      <div className="ancova-stage-heading">
        <div>
          <span>{messages.observations(periodontalData.length)}</span>
          <strong>{messages.currentModel}: {props.activeModel === null ? messages.noModel : messages.modelNames[props.activeModel]}</strong>
        </div>
        <p role="status" aria-live="polite">{props.status}</p>
      </div>

      <div className="ancova-main-grid">
        <section className="ancova-plot-panel">
          <div className="ancova-panel-title">
            <div><h2>{messages.plotTitle}</h2><p>{messages.referenceGroup}</p></div>
            <div className="ancova-legend">
              {TREATMENT_GROUPS.map((group) => <span key={group}><i style={{ background: GROUP_COLORS[group] }} />{messages.legend[group]}</span>)}
            </div>
          </div>
          <div className="ancova-svg-wrap">
            <svg viewBox="0 0 800 480" role="img" aria-labelledby="ancova-plot-title ancova-plot-description">
              <title id="ancova-plot-title">{messages.plotTitle}</title>
              <desc id="ancova-plot-description">{messages.coefficientSubtitleAdjusted}</desc>
              <defs><clipPath id="ancova-plot-clip"><rect x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} /></clipPath></defs>
              {yTicks.map((value) => <g key={`y-${value}`}>
                <line className="ancova-grid-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={y(value)} y2={y(value)} />
                <text className="ancova-axis-label" x={PLOT.x - 12} y={y(value) + 4} textAnchor="end">{formatNumber(value, locale, 0)}</text>
              </g>)}
              {xTicks.map((value) => <g key={`x-${value}`}>
                <line className="ancova-grid-line vertical" y1={PLOT.y} y2={PLOT.y + PLOT.height} x1={x(value)} x2={x(value)} />
                <text className="ancova-axis-label" x={x(value)} y={PLOT.y + PLOT.height + 23} textAnchor="middle">{formatNumber(value, locale, 0)}</text>
              </g>)}
              <line className="ancova-axis-line" x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
              <line className="ancova-axis-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
              <text className="ancova-axis-title" x={PLOT.x + PLOT.width / 2} y="474" textAnchor="middle">{messages.xLabel}</text>
              <text className="ancova-axis-title" transform={`translate(24 ${PLOT.y + PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{messages.yLabel}</text>

              <g clipPath="url(#ancova-plot-clip)">
                {periodontalData.map((observation) => (
                  <circle
                    className="ancova-observation-point"
                    key={observation.id}
                    cx={x(observation.baseline)} cy={y(observation.outcome)} r="4.2"
                    fill={GROUP_COLORS[observation.group]}
                  ><title>{`${observation.id}: ${messages.legend[observation.group]}, ${formatEstimate(observation.baseline, locale)} → ${formatEstimate(observation.outcome, locale)} mm`}</title></circle>
                ))}
                {props.activeModel !== null && TREATMENT_GROUPS.map((group) => {
                  const startX = X_DOMAIN[0];
                  const endX = X_DOMAIN[1];
                  return <line
                    key={`fit-${group}`}
                    className={`ancova-fit-line ${group}`}
                    x1={x(startX)} y1={y(mixedPrediction(group, startX))}
                    x2={x(endX)} y2={y(mixedPrediction(group, endX))}
                    stroke={GROUP_COLORS[group]}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - props.lineRevealProgress}
                  />;
                })}
              </g>
            </svg>
          </div>
        </section>

        <aside className="ancova-results-panel">
          <div className="ancova-results-heading">
            <h2>{messages.coefficientTitle}</h2>
            <p>{props.activeModel === null
              ? messages.coefficientSubtitleInitial
              : props.adjustedRevealed
                ? messages.coefficientSubtitleComparison
                : messages.coefficientSubtitleUnadjusted}</p>
          </div>
          {props.activeModel === null ? (
            <div className="ancova-empty-results">{messages.notYetFit}</div>
          ) : (
            <div className="ancova-model-result-stack">
              <ModelResultBlock fit={props.unadjusted} kind="unadjusted" active={props.activeModel === "unadjusted"} step={1} />
              {props.adjustedRevealed && <ModelResultBlock fit={props.adjusted} kind="adjusted" active={props.activeModel === "adjusted"} step={2} />}
            </div>
          )}
        </aside>
      </div>

    </section>
  );
}
