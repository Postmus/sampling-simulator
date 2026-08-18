import { regressionScenarios, type RegressionScenario } from "./scenarios";
import type { RegressionFit, RegressionLine } from "./model";

interface RegressionControlsProps {
  scenario: RegressionScenario;
  line: RegressionLine;
  fit: RegressionFit;
  candidateSse: number;
  fitting: boolean;
  collectingSse: boolean;
  collectingResiduals: boolean;
  sseCollected: boolean;
  residualsCollected: boolean;
  hasRevealedFit: boolean;
  onScenarioChange: (id: string) => void;
  onSlopeChange: (value: number) => void;
  onInterceptChange: (value: number) => void;
  onEvaluate: () => void;
  onFit: () => void;
  onReset: () => void;
}

function format(value: number) {
  return Number(value.toFixed(2)).toString();
}

function equation(line: RegressionLine) {
  const sign = line.slope < 0 ? "−" : "+";
  return `ŷ = ${format(line.intercept)} ${sign} ${format(Math.abs(line.slope))}x`;
}

export function RegressionControls(props: RegressionControlsProps) {
  const atBestFit =
    Math.abs(props.line.slope - props.fit.slope) < props.scenario.slopeStep / 2 &&
    Math.abs(props.line.intercept - props.fit.intercept) < props.scenario.interceptStep / 2;
  const busy = props.fitting || props.collectingSse || props.collectingResiduals;

  return (
    <aside className="regression-control-rail" aria-label="Regression exploration controls">
      <section className="regression-rail-section">
        <div className="regression-rail-heading">
          <span>Dataset</span>
        </div>
        <label className="regression-field">
          <span>Teaching scenario</span>
          <select
            value={props.scenario.id}
            disabled={busy}
            onChange={(event) => props.onScenarioChange(event.target.value)}
          >
            {regressionScenarios.map((scenario) => (
              <option value={scenario.id} key={scenario.id}>{scenario.title}</option>
            ))}
          </select>
        </label>
        <p className="scenario-description">{props.scenario.description}</p>
      </section>

      <section className="regression-rail-section">
        <div className="regression-rail-heading">
          <span>Candidate line</span>
          <small>Move either parameter</small>
        </div>
        <label className="slider-field">
          <span><span>Slope</span><output>{format(props.line.slope)}</output></span>
          <input
            type="range"
            aria-label="Slope"
            min={props.scenario.slopeDomain[0]}
            max={props.scenario.slopeDomain[1]}
            step={props.scenario.slopeStep}
            value={props.line.slope}
            disabled={busy}
            onChange={(event) => props.onSlopeChange(Number(event.target.value))}
          />
        </label>
        <label className="slider-field">
          <span><span>Intercept</span><output>{format(props.line.intercept)}</output></span>
          <input
            type="range"
            aria-label="Intercept"
            min={props.scenario.interceptDomain[0]}
            max={props.scenario.interceptDomain[1]}
            step={props.scenario.interceptStep}
            value={props.line.intercept}
            disabled={busy}
            onChange={(event) => props.onInterceptChange(Number(event.target.value))}
          />
        </label>
        <div className="regression-actions">
          <button
            className="evaluate-line-button"
            type="button"
            disabled={busy || (props.sseCollected && props.residualsCollected)}
            onClick={props.onEvaluate}
          >
            {props.collectingSse || props.collectingResiduals
              ? "Evaluating line…"
              : props.sseCollected && props.residualsCollected
                ? "Line evaluated"
                : "Evaluate this line"}
          </button>
          <button className="primary" type="button" disabled={busy || (atBestFit && props.hasRevealedFit)} onClick={props.onFit}>
            {props.fitting
              ? "Finding the minimum…"
              : atBestFit && props.hasRevealedFit
                ? "Best fit found"
                : atBestFit
                  ? "Confirm best-fitting line"
                  : "Find best-fitting line"}
          </button>
          <button className="secondary reset-line-button" type="button" disabled={busy} onClick={props.onReset}>
            Reset line
          </button>
        </div>
      </section>

      <section className="regression-metrics" aria-label="Regression metrics">
        <div className="regression-rail-heading"><span>Line and error</span></div>
        <article className="equation-metric">
          <span>Candidate equation</span>
          <strong>{equation(props.line)}</strong>
        </article>
        <article className="equation-metric">
          <span>Candidate SSE</span>
          <strong>{format(props.candidateSse)}</strong>
        </article>
        {props.hasRevealedFit && (
          <p className="minimum-sse-note">Minimum SSE: <strong>{format(props.fit.sse)}</strong></p>
        )}
      </section>
    </aside>
  );
}
