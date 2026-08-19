import { regressionScenarios, type RegressionScenario } from "./scenarios";
import type { RegressionFit, RegressionLine } from "./model";
import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { leastSquaresMessages } from "./messages";

interface RegressionControlsProps {
  scenario: RegressionScenario;
  line: RegressionLine;
  fit: RegressionFit;
  candidateSse: number;
  fitting: boolean;
  collectingSse: boolean;
  sseCollected: boolean;
  hasRevealedFit: boolean;
  onScenarioChange: (id: string) => void;
  onSlopeChange: (value: number) => void;
  onInterceptChange: (value: number) => void;
  onEvaluate: () => void;
  onFit: () => void;
  onReset: () => void;
}

function format(value: number, locale: Locale) {
  return formatNumber(value, locale, 2);
}

function equation(line: RegressionLine, locale: Locale) {
  const sign = line.slope < 0 ? "−" : "+";
  return `ŷ = ${format(line.intercept, locale)} ${sign} ${format(Math.abs(line.slope), locale)}x`;
}

export function RegressionControls(props: RegressionControlsProps) {
  const { locale } = useLocale();
  const messages = leastSquaresMessages[locale];
  const scenarioCopy = props.scenario.copy[locale];
  const atBestFit =
    Math.abs(props.line.slope - props.fit.slope) < props.scenario.slopeStep / 2 &&
    Math.abs(props.line.intercept - props.fit.intercept) < props.scenario.interceptStep / 2;
  const busy = props.fitting || props.collectingSse;

  return (
    <aside className="regression-control-rail" aria-label={messages.controls.aria}>
      <section className="regression-rail-section">
        <div className="regression-rail-heading">
          <span>{messages.controls.dataset}</span>
        </div>
        <label className="regression-field">
          <span>{messages.controls.teachingScenario}</span>
          <select
            value={props.scenario.id}
            disabled={busy}
            onChange={(event) => props.onScenarioChange(event.target.value)}
          >
            {regressionScenarios.map((scenario) => (
              <option value={scenario.id} key={scenario.id}>{scenario.copy[locale].title}</option>
            ))}
          </select>
        </label>
        <p className="scenario-description">{scenarioCopy.description}</p>
      </section>

      <section className="regression-rail-section">
        <div className="regression-rail-heading">
          <span>{messages.controls.candidateLine}</span>
          <small>{messages.controls.moveParameter}</small>
        </div>
        <label className="slider-field">
          <span><span>{messages.controls.slope}</span><output>{format(props.line.slope, locale)}</output></span>
          <input
            type="range"
            aria-label={messages.controls.slope}
            min={props.scenario.slopeDomain[0]}
            max={props.scenario.slopeDomain[1]}
            step={props.scenario.slopeStep}
            value={props.line.slope}
            disabled={busy}
            onChange={(event) => props.onSlopeChange(Number(event.target.value))}
          />
        </label>
        <label className="slider-field">
          <span><span>{messages.controls.intercept}</span><output>{format(props.line.intercept, locale)}</output></span>
          <input
            type="range"
            aria-label={messages.controls.intercept}
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
            disabled={busy || props.sseCollected}
            onClick={props.onEvaluate}
          >
            {props.collectingSse
              ? messages.controls.evaluating
              : props.sseCollected
                ? messages.controls.evaluated
                : messages.controls.evaluate}
          </button>
          <button className="primary" type="button" disabled={busy || (atBestFit && props.hasRevealedFit)} onClick={props.onFit}>
            {props.fitting
              ? messages.controls.findingMinimum
              : atBestFit && props.hasRevealedFit
                ? messages.controls.bestFitFound
                : atBestFit
                  ? messages.controls.confirmBestFit
                  : messages.controls.findBestFit}
          </button>
          <button className="secondary reset-line-button" type="button" disabled={busy} onClick={props.onReset}>
            {messages.controls.reset}
          </button>
        </div>
      </section>

      <section className="regression-metrics" aria-label={messages.controls.metricsAria}>
        <div className="regression-rail-heading"><span>{messages.controls.lineAndError}</span></div>
        <article className="equation-metric">
          <span>{messages.controls.candidateEquation}</span>
          <strong>{equation(props.line, locale)}</strong>
        </article>
        <article className="equation-metric">
          <span>{messages.controls.candidateSse}</span>
          <strong>{format(props.candidateSse, locale)}</strong>
        </article>
        {props.hasRevealedFit && (
          <p className="minimum-sse-note">{messages.controls.minimumSse}: <strong>{format(props.fit.sse, locale)}</strong></p>
        )}
      </section>
    </aside>
  );
}
