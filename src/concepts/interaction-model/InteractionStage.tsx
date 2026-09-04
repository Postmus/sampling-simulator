import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { implantData, JAW_GROUPS, type JawGroup } from "./data";
import { interactionMessages } from "./messages";
import {
  jawDifference,
  predictJaw,
  type InteractionFit,
  type InteractionModelKind,
} from "./model";

interface InteractionStageProps {
  additive: InteractionFit;
  interaction: InteractionFit;
  activeModel: InteractionModelKind | null;
  interactionRevealed: boolean;
  lineRevealProgress: number;
  modelMix: number;
  torqueA: number;
  torqueB: number;
  onTorqueAChange: (value: number) => void;
  onTorqueBChange: (value: number) => void;
  status: string;
}

const PLOT = { x: 82, y: 58, width: 654, height: 370 };
const X_DOMAIN: readonly [number, number] = [18, 53];
const Y_DOMAIN: readonly [number, number] = [55, 81];
const JAW_COLORS: Record<JawGroup, string> = { upper: "#0b6672", lower: "#df7658" };
const GUIDE_COLORS = { a: "#76549a", b: "#d47b2f" } as const;

function scale(value: number, domain: readonly [number, number], range: readonly [number, number]) {
  return range[0] + ((value - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);
}

function formatEstimate(value: number, locale: Locale) {
  return formatNumber(value, locale, 2, 2);
}

function ModelFormula({ kind }: { kind: InteractionModelKind }) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].stage;
  const dummy = locale === "nl" ? "onder,i" : "lower,i";
  return (
    <div className="ancova-formula interaction-formula" aria-label={messages.modelFormula[kind]}>
      <span aria-hidden="true">
        <span className="formula-term"><span className="formula-variable">ISQ</span><sub>i</sub></span>
        <span className="formula-operator"> = </span>
        <span className="formula-term">β<sub>0</sub></span>
        <span className="formula-operator"> + </span>
        <span className="formula-term">β<sub>1</sub><var>T</var><sub>i</sub></span>
        <span className="formula-operator"> + </span>
        <span className="formula-term">β<sub>2</sub> × d<sub>{dummy}</sub></span>
        {kind === "interaction" && <>
          <span className="formula-operator"> + </span>
          <span className="formula-term">β<sub>3</sub> × (<var>T</var><sub>i</sub> × d<sub>{dummy}</sub>)</span>
        </>}
        <span className="formula-operator"> + </span>
        <span className="formula-term">ε<sub>i</sub></span>
      </span>
    </div>
  );
}

function DifferenceResultCards(props: { fit: InteractionFit; torqueA: number; torqueB: number }) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].stage;
  const torques = [
    { key: "a", label: messages.torqueA, value: props.torqueA },
    { key: "b", label: messages.torqueB, value: props.torqueB },
  ] as const;
  return (
    <div className="ancova-key-results interaction-difference-results">
      {torques.map((torque) => {
        const estimatedDifference = jawDifference(props.fit, torque.value);
        return <article className="ancova-key-result" key={torque.key}>
          <span><i className={`interaction-result-key ${torque.key}`} />{torque.label} · {formatNumber(torque.value, locale, 0)} Ncm</span>
          <div className="interaction-estimated-difference">
            <small>{messages.estimatedDifference}</small>
            <strong>{formatEstimate(estimatedDifference, locale)} ISQ</strong>
          </div>
        </article>;
      })}
    </div>
  );
}

function ModelResultBlock(props: {
  fit: InteractionFit;
  kind: InteractionModelKind;
  active: boolean;
  step: number;
  torqueA: number;
  torqueB: number;
}) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].stage;
  return (
    <section className={`ancova-model-result-block interaction-model-result-block${props.active ? " active" : ""}`}>
      <h3><span>{props.step}</span>{messages.modelNames[props.kind]}</h3>
      <ModelFormula kind={props.kind} />
      <DifferenceResultCards fit={props.fit} torqueA={props.torqueA} torqueB={props.torqueB} />
      <p className={`interaction-difference-note ${props.kind}`}>{props.kind === "interaction" ? messages.changingDifference : messages.constantDifference}</p>
    </section>
  );
}

function TorqueSliders(props: {
  torqueA: number;
  torqueB: number;
  onTorqueAChange: (value: number) => void;
  onTorqueBChange: (value: number) => void;
}) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].stage;
  return (
    <section className="interaction-slider-panel" aria-label={messages.torquePanelTitle}>
      <div className="interaction-slider-heading"><h2>{messages.torquePanelTitle}</h2><p>{messages.torquePanelSubtitle}</p></div>
      <div className="interaction-slider-row">
        {([
          { key: "a", label: messages.torqueA, value: props.torqueA, change: props.onTorqueAChange },
          { key: "b", label: messages.torqueB, value: props.torqueB, change: props.onTorqueBChange },
        ] as const).map((item) => (
          <label className={`interaction-slider ${item.key}`} key={item.key}>
            <span><strong>{item.label}</strong><output>{formatNumber(item.value, locale, 0, 0)} Ncm</output></span>
            <input type="range" aria-label={item.label} min="20" max="52" step="1" value={item.value} onChange={(event) => item.change(Number(event.target.value))} />
          </label>
        ))}
      </div>
      <p className="interaction-slider-note">{messages.evaluationNote}</p>
    </section>
  );
}

export function InteractionStage(props: InteractionStageProps) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].stage;
  const x = (value: number) => scale(value, X_DOMAIN, [PLOT.x, PLOT.x + PLOT.width]);
  const y = (value: number) => scale(value, Y_DOMAIN, [PLOT.y + PLOT.height, PLOT.y]);
  const xTicks = [20, 30, 40, 50];
  const yTicks = [55, 60, 65, 70, 75, 80];
  const guides = [
    { key: "a", label: messages.torqueA, value: props.torqueA, color: GUIDE_COLORS.a },
    { key: "b", label: messages.torqueB, value: props.torqueB, color: GUIDE_COLORS.b },
  ] as const;
  const labelsClose = Math.abs(x(props.torqueA) - x(props.torqueB)) < 105;
  const showGuides = props.activeModel !== null;

  function mixedPrediction(jaw: JawGroup, torque: number) {
    const before = predictJaw(props.additive, jaw, torque);
    const after = predictJaw(props.interaction, jaw, torque);
    return before + (after - before) * props.modelMix;
  }

  return (
    <section className="ancova-stage-card" aria-label={messages.aria}>
      <div className="ancova-stage-heading">
        <div><span>{messages.observations(implantData.length)}</span><strong>{messages.currentModel}: {props.activeModel === null ? messages.noModel : messages.modelNames[props.activeModel]}</strong></div>
        <p role="status" aria-live="polite">{props.status}</p>
      </div>
      <div className="ancova-main-grid">
        <section className="ancova-plot-panel">
          <div className="ancova-panel-title">
            <div><h2>{messages.plotTitle}</h2><p>{messages.referenceGroup}</p></div>
            <div className="ancova-legend">{JAW_GROUPS.map((jaw) => <span key={jaw}><i style={{ background: JAW_COLORS[jaw] }} />{messages.legend[jaw]}</span>)}</div>
          </div>
          <div className="ancova-svg-wrap interaction-svg-wrap">
            <svg viewBox="0 0 800 480" role="img" aria-labelledby="interaction-plot-title interaction-plot-description">
              <title id="interaction-plot-title">{messages.plotTitle}</title><desc id="interaction-plot-description">{messages.torquePanelSubtitle}</desc>
              <defs><clipPath id="interaction-plot-clip"><rect x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} /></clipPath></defs>
              {yTicks.map((value) => <g key={`y-${value}`}><line className="ancova-grid-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={y(value)} y2={y(value)} /><text className="ancova-axis-label" x={PLOT.x - 12} y={y(value) + 4} textAnchor="end">{value}</text></g>)}
              {xTicks.map((value) => <g key={`x-${value}`}><line className="ancova-grid-line vertical" y1={PLOT.y} y2={PLOT.y + PLOT.height} x1={x(value)} x2={x(value)} /><text className="ancova-axis-label" x={x(value)} y={PLOT.y + PLOT.height + 23} textAnchor="middle">{value}</text></g>)}
              <line className="ancova-axis-line" x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} /><line className="ancova-axis-line" x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
              <text className="ancova-axis-title" x={PLOT.x + PLOT.width / 2} y="474" textAnchor="middle">{messages.xLabel}</text><text className="ancova-axis-title" transform={`translate(22 ${PLOT.y + PLOT.height / 2}) rotate(-90)`} textAnchor="middle">{messages.yLabel}</text>
              <g clipPath="url(#interaction-plot-clip)">
                {showGuides && guides.map((guide) => <line className={`interaction-torque-guide ${guide.key}`} key={`guide-${guide.key}`} x1={x(guide.value)} x2={x(guide.value)} y1={PLOT.y} y2={PLOT.y + PLOT.height} stroke={guide.color} />)}
                {implantData.map((observation) => <circle className="interaction-observation-point" key={observation.id} cx={x(observation.torque)} cy={y(observation.isq)} r="4.2" fill={JAW_COLORS[observation.jaw]}><title>{`${observation.id}: ${messages.legend[observation.jaw]}, ${formatEstimate(observation.torque, locale)} Ncm → ISQ ${formatEstimate(observation.isq, locale)}`}</title></circle>)}
                {props.activeModel !== null && JAW_GROUPS.map((jaw) => <line key={`fit-${jaw}`} className={`interaction-fit-line ${jaw}`} x1={x(X_DOMAIN[0])} y1={y(mixedPrediction(jaw, X_DOMAIN[0]))} x2={x(X_DOMAIN[1])} y2={y(mixedPrediction(jaw, X_DOMAIN[1]))} stroke={JAW_COLORS[jaw]} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - props.lineRevealProgress} />)}
                {showGuides && guides.map((guide) => {
                  const upperY = y(mixedPrediction("upper", guide.value));
                  const lowerY = y(mixedPrediction("lower", guide.value));
                  return <g key={`gap-${guide.key}`} className={`interaction-gap ${guide.key}`}>
                    <line className="interaction-gap-bracket" x1={x(guide.value)} x2={x(guide.value)} y1={upperY} y2={lowerY} stroke={guide.color} />
                    {JAW_GROUPS.map((jaw) => <circle className="interaction-guide-marker" key={jaw} cx={x(guide.value)} cy={y(mixedPrediction(jaw, guide.value))} r="6.5" stroke={JAW_COLORS[jaw]} />)}
                  </g>;
                })}
              </g>
              {showGuides && guides.map((guide, index) => {
                const labelY = labelsClose && index === 1 ? 35 : 8;
                return <g className={`ancova-guide-label ${guide.key}`} key={`label-${guide.key}`}><rect x={x(guide.value) - 42} y={labelY} width="84" height="24" rx="7" stroke={guide.color} /><text x={x(guide.value)} y={labelY + 16} textAnchor="middle">{guide.label.replace(/Torque|Koppel/, "").trim()} · {formatNumber(guide.value, locale, 0)}</text></g>;
              })}
            </svg>
          </div>
        </section>
        <aside className="ancova-results-panel">
          <div className="ancova-results-heading"><h2>{messages.coefficientTitle}</h2><p>{props.activeModel === null ? messages.coefficientSubtitleInitial : props.interactionRevealed ? messages.coefficientSubtitleComparison : messages.coefficientSubtitleAdditive}</p></div>
          {props.activeModel === null ? <div className="ancova-empty-results">{messages.noModel}</div> : <div className="ancova-model-result-stack">
            <ModelResultBlock fit={props.additive} kind="additive" active={props.activeModel === "additive"} step={1} torqueA={props.torqueA} torqueB={props.torqueB} />
            {props.interactionRevealed && <ModelResultBlock fit={props.interaction} kind="interaction" active={props.activeModel === "interaction"} step={2} torqueA={props.torqueA} torqueB={props.torqueB} />}
          </div>}
        </aside>
      </div>
      {props.activeModel !== null && <TorqueSliders torqueA={props.torqueA} torqueB={props.torqueB} onTorqueAChange={props.onTorqueAChange} onTorqueBChange={props.onTorqueBChange} />}
    </section>
  );
}
