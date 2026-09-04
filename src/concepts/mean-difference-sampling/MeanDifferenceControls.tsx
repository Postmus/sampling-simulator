import { useLocale } from "../../i18n/LocaleContext";
import { meanDifferenceMessages } from "./messages";

export function MeanDifferenceControls() {
  const { locale } = useLocale();
  const messages = meanDifferenceMessages[locale].controls;

  return (
    <aside className="mean-difference-controls" aria-label={messages.aria}>
      <section className="mean-difference-control-section">
        <div className="mean-difference-rail-heading">
          <span>{messages.model}</span>
          <small>{messages.resetHint}</small>
        </div>
        <div className="mean-difference-fields">
          <label>
            <span>{messages.vehicleMean}</span>
            <input data-role="vehicle-mean" type="number" defaultValue="56" step="1" />
          </label>
          <label>
            <span>{messages.trueEffect}</span>
            <input data-role="true-effect" type="number" defaultValue="10" step="1" />
          </label>
          <label>
            <span>{messages.populationSd}</span>
            <input data-role="population-sd" type="number" defaultValue="13.2" min="0.1" step="0.5" />
          </label>
          <label>
            <span>{messages.sampleSize}</span>
            <select data-role="sample-size" defaultValue="12">
              {[6, 12, 24, 48].map((size) => <option value={size} key={size}>{messages.animals(size)}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="mean-difference-control-section">
        <div className="mean-difference-rail-heading"><span>{messages.run}</span></div>
        <div className="mean-difference-actions">
          <button data-role="draw-one" className="primary mean-difference-action-wide" type="button">{messages.drawOne}</button>
          <button data-role="animate-ten" type="button">{messages.animateTen}</button>
          <button data-role="generate-hundred" type="button">{messages.generateHundred}</button>
          <button data-role="pause" type="button" disabled>{messages.pause}</button>
          <button data-role="reset" className="secondary" type="button">{messages.resetReplay}</button>
        </div>
      </section>

      <details className="mean-difference-options">
        <summary>{messages.options}</summary>
        <div className="mean-difference-options-content">
          <label className="mean-difference-option-field">
            <span>{messages.animationSpeed}</span>
            <select data-role="animation-speed" defaultValue="1">
              <option value="0.65">{messages.slow}</option>
              <option value="1">{messages.normal}</option>
              <option value="1.8">{messages.fast}</option>
              <option value="3">{messages.veryFast}</option>
            </select>
          </label>
          <label className="mean-difference-check">
            <input data-role="show-true-values" type="checkbox" defaultChecked />
            <span>{messages.showTrueValues}</span>
          </label>
          <label className="mean-difference-check">
            <input data-role="reduce-motion" type="checkbox" />
            <span>{messages.reduceMotion}</span>
          </label>
          <div className="mean-difference-seed-row">
            <span>{messages.seed} <output data-role="seed">271828</output></span>
            <button data-role="new-seed" className="text-button" type="button">{messages.newSeed}</button>
          </div>
        </div>
      </details>

      <section className="mean-difference-metrics" aria-label={messages.summaryAria}>
        <div className="mean-difference-rail-heading"><span>{messages.summary}</span></div>
        <article><span>{messages.latestDifference}</span><strong data-role="latest-difference">—</strong></article>
        <article><span>{messages.repeatedExperiments}</span><strong data-role="experiment-count">0</strong></article>
        <article><span>{messages.empiricalSe}</span><strong data-role="empirical-se">—</strong></article>
        <article><span>{messages.theoreticalSe}</span><strong data-role="theoretical-se">—</strong></article>
      </section>
    </aside>
  );
}
