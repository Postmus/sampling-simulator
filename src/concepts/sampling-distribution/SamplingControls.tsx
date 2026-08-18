import { useLocale } from "../../i18n/LocaleContext";
import { samplingMessages } from "./messages";

export function SamplingControls() {
  const { locale } = useLocale();
  const messages = samplingMessages[locale].controls;
  return (
    <aside className="control-rail" aria-label={messages.aria}>
      <section className="rail-section">
        <div className="rail-heading">
          <span>{messages.populationAndSample}</span>
          <small>{messages.resetHint}</small>
        </div>
        <div className="rail-fields">
          <label>
            <span>{messages.populationMean}</span>
            <input data-role="population-mean" type="number" defaultValue="100" step="1" />
          </label>
          <label>
            <span>{messages.populationSd}</span>
            <input data-role="population-sd" type="number" defaultValue="15" min="0.1" step="1" />
          </label>
          <label>
            <span>{messages.sampleSize}</span>
            <select data-role="sample-size" defaultValue="10">
              <option value="5">n = 5</option>
              <option value="10">n = 10</option>
              <option value="30">n = 30</option>
              <option value="60">n = 60</option>
              <option value="100">n = 100</option>
            </select>
          </label>
          <label>
            <span>{messages.animationSpeed}</span>
            <select data-role="animation-speed" defaultValue="1">
              <option value="0.65">{messages.slow}</option>
              <option value="1">{messages.normal}</option>
              <option value="1.8">{messages.fast}</option>
              <option value="3">{messages.veryFast}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rail-section">
        <div className="rail-heading"><span>{messages.run}</span></div>
        <div className="action-grid">
          <button data-role="draw-one" className="primary action-wide" type="button">{messages.drawOne}</button>
          <button data-role="animate-ten" type="button">{messages.animateTen}</button>
          <button data-role="generate-hundred" type="button">{messages.generateHundred}</button>
          <button data-role="pause" type="button" disabled>{messages.pause}</button>
          <button data-role="reset" className="secondary" type="button">{messages.resetReplay}</button>
        </div>
      </section>

      <details className="advanced-options">
        <summary>{messages.options}</summary>
        <div className="advanced-content">
          <label className="check-control">
            <input data-role="show-true-mean" type="checkbox" defaultChecked />
            <span>{messages.showTrueMean}</span>
          </label>
          <label className="check-control">
            <input data-role="reduce-motion" type="checkbox" />
            <span>{messages.reduceMotion}</span>
          </label>
          <div className="seed-row">
            <span className="seed-label">{messages.seed} <output data-role="seed">314159</output></span>
            <button data-role="new-seed" className="text-button" type="button">{messages.newSeed}</button>
          </div>
        </div>
      </details>

      <section className="rail-metrics" aria-label={messages.summaryAria}>
        <div className="rail-heading"><span>{messages.summary}</span></div>
        <article className="rail-metric">
          <span>{messages.latestMean}</span>
          <strong data-role="latest-mean">—</strong>
        </article>
        <article className="rail-metric">
          <span>{messages.repeatedSamples}</span>
          <strong data-role="sample-count">0</strong>
        </article>
        <article className="rail-metric">
          <span>{messages.empiricalSe}</span>
          <strong data-role="empirical-se">—</strong>
        </article>
      </section>
    </aside>
  );
}
