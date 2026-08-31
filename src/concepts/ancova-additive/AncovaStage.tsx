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
  baselineComparisonOpen: boolean;
  baselineA: number;
  baselineB: number;
  onBaselineComparisonToggle: () => void;
  onBaselineAChange: (value: number) => void;
  onBaselineBChange: (value: number) => void;
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
const BASELINE_COLORS = { a: "#76549a", b: "#d47b2f" } as const;

function scale(value: number, domain: readonly [number, number], range: readonly [number, number]) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

function coefficient(fit: AncovaFit, term: "rinse" | "adjunct") {
  return fit.coefficients.find((entry) => entry.term === term)!;
}

function formatEstimate(value: number, locale: Locale) {
  return formatNumber(value, locale, 2, 2);
}

function formatPValue(value: number, locale: Locale) {
  if (value < 0.001) return locale === "nl" ? "< 0,001" : "< .001";
  const formatted = formatNumber(value, locale, 3, 3);
  return locale === "en" && formatted.startsWith("0.") ? formatted.slice(1) : formatted;
}

function interval(entry: CoefficientInference, locale: Locale) {
  return `[${formatEstimate(entry.confidenceLow, locale)}; ${formatEstimate(entry.confidenceHigh, locale)}]`;
}

function predictionFormula(fit: AncovaFit, group: TreatmentGroup, baseline: number, locale: Locale) {
  const intercept = fit.coefficientMap.intercept;
  const slope = fit.coefficientMap.baseline;
  const groupEffect = group === "rinse" ? fit.coefficientMap.rinse : group === "adjunct" ? fit.coefficientMap.adjunct : 0;
  const base = `${formatEstimate(intercept, locale)} + ${formatEstimate(slope, locale)} × ${formatEstimate(baseline, locale)}`;
  const groupPart = groupEffect === 0
    ? ""
    : groupEffect < 0
      ? ` - ${formatEstimate(Math.abs(groupEffect), locale)}`
      : ` + ${formatEstimate(groupEffect, locale)}`;
  return `${base}${groupPart} = ${formatEstimate(predictGroup(fit, group, baseline), locale)}`;
}

function contrastFormula(fit: AncovaFit, term: "rinse" | "adjunct", baseline: number, locale: Locale) {
  const group: TreatmentGroup = term === "rinse" ? "rinse" : "adjunct";
  const treatmentPrediction = predictGroup(fit, group, baseline);
  const standardPrediction = predictGroup(fit, "standard", baseline);
  return `${formatEstimate(treatmentPrediction, locale)} - ${formatEstimate(standardPrediction, locale)} = ${formatEstimate(treatmentPrediction - standardPrediction, locale)}`;
}

function CoefficientTable({ fit }: { fit: AncovaFit }) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  return (
    <div className="ancova-table-wrap">
      <table className="ancova-coefficient-table">
        <thead><tr>
          <th>{messages.term}</th><th>{messages.estimate}</th><th>{messages.standardError}</th>
          <th>{messages.confidenceInterval}</th><th>{messages.pValue}</th>
        </tr></thead>
        <tbody>
          {fit.coefficients.map((entry) => (
            <tr key={entry.term} className={entry.term === "rinse" || entry.term === "adjunct" ? "treatment-row" : ""}>
              <th scope="row">{messages.coefficientTerms[entry.term]}</th>
              <td>{formatEstimate(entry.estimate, locale)}</td>
              <td>{formatEstimate(entry.standardError, locale)}</td>
              <td>{interval(entry, locale)}</td>
              <td>{formatPValue(entry.pValue, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

function ContrastCard({ term, unadjusted, adjusted }: { term: "rinse" | "adjunct"; unadjusted: AncovaFit; adjusted: AncovaFit }) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  const before = coefficient(unadjusted, term);
  const after = coefficient(adjusted, term);
  const reduction = 100 * (1 - after.standardError / before.standardError);
  return (
    <article className="ancova-contrast-card">
      <div className="ancova-contrast-heading">
        <strong>{messages.terms[term]}</strong>
        <span>{messages.precisionGain}: {formatNumber(reduction, locale, 0, 0)}%</span>
      </div>
      <div className="ancova-contrast-grid" role="table" aria-label={`${messages.treatmentContrast}: ${messages.terms[term]}`}>
        <div className="contrast-label" role="rowheader">{messages.beforeAdjustment}</div>
        <div><small>{messages.estimate}</small><b>{formatEstimate(before.estimate, locale)}</b></div>
        <div><small>{messages.standardError}</small><b>{formatEstimate(before.standardError, locale)}</b></div>
        <div><small>{messages.confidenceInterval}</small><b>{interval(before, locale)}</b></div>
        <div><small>{messages.pValue}</small><b>{formatPValue(before.pValue, locale)}</b></div>
        <div className="contrast-label adjusted" role="rowheader">{messages.afterAdjustment}</div>
        <div className="adjusted"><small>{messages.estimate}</small><b>{formatEstimate(after.estimate, locale)}</b></div>
        <div className="adjusted"><small>{messages.standardError}</small><b>{formatEstimate(after.standardError, locale)}</b></div>
        <div className="adjusted"><small>{messages.confidenceInterval}</small><b>{interval(after, locale)}</b></div>
        <div className="adjusted"><small>{messages.pValue}</small><b>{formatPValue(after.pValue, locale)}</b></div>
      </div>
    </article>
  );
}

function BaselineComparisonPanel(props: {
  fit: AncovaFit;
  open: boolean;
  baselineA: number;
  baselineB: number;
  onToggle: () => void;
  onBaselineAChange: (value: number) => void;
  onBaselineBChange: (value: number) => void;
}) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  const baselines = [props.baselineA, props.baselineB] as const;
  return (
    <section className={`ancova-baseline-panel${props.open ? " open" : ""}`}>
      <button
        className="ancova-baseline-panel-toggle"
        type="button"
        aria-expanded={props.open}
        onClick={props.onToggle}
      >
        <span><strong>{messages.baselinePanelTitle}</strong><small>{messages.baselinePanelSubtitle}</small></span>
        <span>{props.open ? messages.closeBaselinePanel : messages.openBaselinePanel} <b aria-hidden="true">{props.open ? "−" : "+"}</b></span>
      </button>
      {props.open && (
        <div className="ancova-baseline-panel-body">
          <aside className="ancova-baseline-controls">
            {([
              { key: "a", label: messages.baselineA, value: props.baselineA, change: props.onBaselineAChange },
              { key: "b", label: messages.baselineB, value: props.baselineB, change: props.onBaselineBChange },
            ] as const).map((item) => (
              <label className={`ancova-baseline-slider ${item.key}`} key={item.key}>
                <span><strong>{item.label}</strong><output>{formatEstimate(item.value, locale)} mm</output></span>
                <input
                  type="range"
                  aria-label={item.label}
                  min="3.8"
                  max="7.5"
                  step="0.1"
                  value={item.value}
                  onChange={(event) => item.change(Number(event.target.value))}
                />
              </label>
            ))}
            <p className="ancova-baseline-note">{messages.baselineEvaluationNote}</p>
          </aside>

          <div className="ancova-calculation-wrap">
            <h3>{messages.calculationTitle}</h3>
            <table className="ancova-calculation-table">
              <thead><tr>
                <th>{messages.prediction}</th>
                <th><i className="baseline-key a" />{messages.baselineA}: {formatEstimate(props.baselineA, locale)} mm</th>
                <th><i className="baseline-key b" />{messages.baselineB}: {formatEstimate(props.baselineB, locale)} mm</th>
              </tr></thead>
              <tbody>
                {TREATMENT_GROUPS.map((group) => (
                  <tr key={group}>
                    <th scope="row"><i className="group-key" style={{ background: GROUP_COLORS[group] }} />{messages.legend[group]}</th>
                    {baselines.map((baseline, index) => <td key={`${group}-${index}`}><span>{predictionFormula(props.fit, group, baseline, locale)}</span></td>)}
                  </tr>
                ))}
                {(["rinse", "adjunct"] as const).map((term) => {
                  return (
                    <tr className="ancova-calculation-contrast" key={term}>
                      <th scope="row">{messages.terms[term]}<small>{messages.contrastResult}</small></th>
                      {baselines.map((baseline, index) => (
                        <td key={`${term}-${index}`}>
                          <strong>{contrastFormula(props.fit, term, baseline, locale)}</strong>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="ancova-identical-note">{messages.identicalResult}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function AncovaStage(props: AncovaStageProps) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].stage;
  const fit = props.activeModel === "adjusted" ? props.adjusted : props.unadjusted;
  const x = (value: number) => scale(value, X_DOMAIN, [PLOT.x, PLOT.x + PLOT.width]);
  const y = (value: number) => scale(value, Y_DOMAIN, [PLOT.y + PLOT.height, PLOT.y]);
  const xTicks = [4, 5, 6, 7];
  const yTicks = [2, 3, 4, 5, 6];
  const baselineGuides = [
    { key: "a", label: messages.baselineA, value: props.baselineA, color: BASELINE_COLORS.a },
    { key: "b", label: messages.baselineB, value: props.baselineB, color: BASELINE_COLORS.b },
  ] as const;
  const guideLabelsClose = Math.abs(x(props.baselineA) - x(props.baselineB)) < 105;
  const showBaselineComparison = props.activeModel === "adjusted" && props.baselineComparisonOpen;

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
                {showBaselineComparison && baselineGuides.map((guide) => (
                  <line
                    className={`ancova-baseline-guide ${guide.key}`}
                    key={`guide-${guide.key}`}
                    x1={x(guide.value)} x2={x(guide.value)} y1={PLOT.y} y2={PLOT.y + PLOT.height}
                    stroke={guide.color}
                  />
                ))}
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
                {showBaselineComparison && baselineGuides.flatMap((guide) => TREATMENT_GROUPS.map((group) => (
                  <circle
                    className={`ancova-baseline-intersection ${guide.key}`}
                    key={`intersection-${guide.key}-${group}`}
                    cx={x(guide.value)} cy={y(predictGroup(props.adjusted, group, guide.value))} r="6.5"
                    stroke={GROUP_COLORS[group]}
                  />
                )))}
              </g>
              {showBaselineComparison && baselineGuides.map((guide, index) => {
                const labelY = guideLabelsClose && index === 1 ? 35 : 8;
                return (
                  <g className={`ancova-guide-label ${guide.key}`} key={`label-${guide.key}`}>
                    <rect x={x(guide.value) - 42} y={labelY} width="84" height="24" rx="7" stroke={guide.color} />
                    <text x={x(guide.value)} y={labelY + 16} textAnchor="middle">{guide.label.replace(/Baseline|Beginwaarde/, "").trim()} · {formatEstimate(guide.value, locale)}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <aside className="ancova-results-panel">
          <div className="ancova-results-heading">
            <h2>{messages.coefficientTitle}</h2>
            <p>{props.activeModel === null
              ? messages.coefficientSubtitleInitial
              : props.activeModel === "adjusted"
                ? messages.coefficientSubtitleAdjusted
                : messages.coefficientSubtitleUnadjusted}</p>
          </div>
          {props.activeModel === null ? (
            <div className="ancova-empty-results">{messages.notYetFit}</div>
          ) : (
            <>
              <ModelFormula kind={props.activeModel} />
              <CoefficientTable fit={fit} />
              <div className="ancova-model-summary">
                <strong>{messages.modelSummary}</strong>
                <span><small>{messages.residualSe}</small>{formatEstimate(fit.residualStandardError, locale)}</span>
                <span><small>{messages.rSquared}</small>{formatNumber(fit.rSquared, locale, 3, 3)}</span>
                <span><small>{messages.residualDf}</small>{fit.residualDegreesOfFreedom}</span>
              </div>
            </>
          )}
        </aside>
      </div>

      {props.adjustedRevealed && props.activeModel === "adjusted" && (
        <BaselineComparisonPanel
          fit={props.adjusted}
          open={props.baselineComparisonOpen}
          baselineA={props.baselineA}
          baselineB={props.baselineB}
          onToggle={props.onBaselineComparisonToggle}
          onBaselineAChange={props.onBaselineAChange}
          onBaselineBChange={props.onBaselineBChange}
        />
      )}

      {props.adjustedRevealed && (
        <section className="ancova-comparison-panel">
          <div><h2>{messages.comparisonTitle}</h2><p>{messages.comparisonSubtitle}</p></div>
          <div className="ancova-contrast-cards">
            <ContrastCard term="rinse" unadjusted={props.unadjusted} adjusted={props.adjusted} />
            <ContrastCard term="adjunct" unadjusted={props.unadjusted} adjusted={props.adjusted} />
          </div>
        </section>
      )}
    </section>
  );
}
