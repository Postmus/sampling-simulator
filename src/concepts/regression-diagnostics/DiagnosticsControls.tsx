import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import type { RegressionFit } from "../../domain/regression";
import { diagnosticsMessages } from "./messages";
import type { PredictorKind } from "./model";
import { diagnosticScenarios, type DiagnosticScenario } from "./scenarios";

interface DiagnosticsControlsProps {
  scenario: DiagnosticScenario;
  predictor: PredictorKind;
  fit: RegressionFit;
  phase: number;
  maximumPhase: number;
  playing: boolean;
  paused: boolean;
  transforming: boolean;
  onScenarioChange: (id: string) => void;
  onPredictorChange: (predictor: PredictorKind) => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReplay: () => void;
  onReset: () => void;
}

function format(value: number, locale: Locale) {
  return formatNumber(value, locale, 2);
}

function equation(fit: RegressionFit, predictor: PredictorKind, locale: Locale) {
  const sign = fit.slope < 0 ? "−" : "+";
  const term = predictor === "log" ? "log₂(x)" : "x";
  return `ŷ = ${format(fit.intercept, locale)} ${sign} ${format(Math.abs(fit.slope), locale)}${term}`;
}

export function DiagnosticsControls(props: DiagnosticsControlsProps) {
  const { locale } = useLocale();
  const messages = diagnosticsMessages[locale];
  const scenarioCopy = props.scenario.copy[locale];
  const playLabel = props.playing
    ? props.paused ? messages.controls.resume : messages.controls.pause
    : messages.controls.play;

  return (
    <aside className="diagnostics-control-rail" aria-label={messages.controls.aria}>
      <section className="diagnostics-rail-section">
        <div className="diagnostics-rail-heading"><span>{messages.controls.example}</span></div>
        <label className="diagnostics-field">
          <span>{messages.controls.teachingExample}</span>
          <select disabled={props.transforming} value={props.scenario.id} onChange={(event) => props.onScenarioChange(event.target.value)}>
            {diagnosticScenarios.map((scenario) => (
              <option value={scenario.id} key={scenario.id}>{scenario.copy[locale].title}</option>
            ))}
          </select>
        </label>
        <p className="diagnostics-description">{scenarioCopy.description}</p>
      </section>

      <section className="diagnostics-rail-section">
        <div className="diagnostics-rail-heading"><span>{messages.controls.model}</span></div>
        {props.scenario.supportsLog && (
          <fieldset className="predictor-choice">
            <legend>{messages.controls.predictor}</legend>
            <label className={props.predictor === "raw" ? "selected" : ""}>
              <input
                type="radio"
                name="diagnostic-predictor"
                value="raw"
                checked={props.predictor === "raw"}
                disabled={props.transforming}
                onChange={() => props.onPredictorChange("raw")}
              />
              <span>{messages.controls.rawPredictor}</span>
            </label>
            <label className={props.predictor === "log" ? "selected" : ""}>
              <input
                type="radio"
                name="diagnostic-predictor"
                value="log"
                checked={props.predictor === "log"}
                disabled={props.transforming}
                onChange={() => props.onPredictorChange("log")}
              />
              <span>{messages.controls.logPredictor}</span>
            </label>
          </fieldset>
        )}
        <article className="diagnostics-equation">
          <span>{messages.controls.equation}</span>
          <strong>{equation(props.fit, props.predictor, locale)}</strong>
        </article>
      </section>

      <section className="diagnostics-rail-section">
        <div className="diagnostics-rail-heading">
          <span>{messages.controls.animation}</span>
          <small>{props.phase}/{props.maximumPhase}</small>
        </div>
        <div className="diagnostics-playback">
          <button type="button" disabled={props.transforming || props.playing || props.phase === 0} onClick={props.onPrevious}>
            ← {messages.controls.previous}
          </button>
          <button className="primary" type="button" disabled={props.transforming} onClick={props.onPlayPause}>
            {playLabel}
          </button>
          <button type="button" disabled={props.transforming || props.playing || props.phase === props.maximumPhase} onClick={props.onNext}>
            {messages.controls.next} →
          </button>
          <button className="replay" type="button" disabled={props.transforming} onClick={props.onReplay}>{messages.controls.replay}</button>
          <button className="reset" type="button" disabled={props.transforming} onClick={props.onReset}>{messages.controls.reset}</button>
        </div>
      </section>

    </aside>
  );
}
