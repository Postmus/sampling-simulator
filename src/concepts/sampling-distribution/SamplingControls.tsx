export function SamplingControls() {
  return (
    <aside className="control-rail" aria-label="Simulation controls and summary">
      <section className="rail-section">
        <div className="rail-heading">
          <span>Population and sample</span>
          <small>Changing a value resets the run</small>
        </div>
        <div className="rail-fields">
          <label>
            <span>Population mean</span>
            <input data-role="population-mean" type="number" defaultValue="100" step="1" />
          </label>
          <label>
            <span>Population SD</span>
            <input data-role="population-sd" type="number" defaultValue="15" min="0.1" step="1" />
          </label>
          <label>
            <span>Sample size</span>
            <select data-role="sample-size" defaultValue="10">
              <option value="5">n = 5</option>
              <option value="10">n = 10</option>
              <option value="30">n = 30</option>
              <option value="60">n = 60</option>
              <option value="100">n = 100</option>
            </select>
          </label>
          <label>
            <span>Animation speed</span>
            <select data-role="animation-speed" defaultValue="1">
              <option value="0.65">Slow</option>
              <option value="1">Normal</option>
              <option value="1.8">Fast</option>
              <option value="3">Very fast</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rail-section">
        <div className="rail-heading"><span>Run simulation</span></div>
        <div className="action-grid">
          <button data-role="draw-one" className="primary action-wide" type="button">Draw 1 sample</button>
          <button data-role="animate-ten" type="button">Animate 10</button>
          <button data-role="generate-hundred" type="button">Generate 100</button>
          <button data-role="pause" type="button" disabled>Pause</button>
          <button data-role="reset" className="secondary" type="button">Reset / replay</button>
        </div>
      </section>

      <details className="advanced-options">
        <summary>Display and replay options</summary>
        <div className="advanced-content">
          <label className="check-control">
            <input data-role="show-true-mean" type="checkbox" defaultChecked />
            <span>Show true mean</span>
          </label>
          <label className="check-control">
            <input data-role="reduce-motion" type="checkbox" />
            <span>Reduce motion</span>
          </label>
          <div className="seed-row">
            <span className="seed-label">Seed <output data-role="seed">314159</output></span>
            <button data-role="new-seed" className="text-button" type="button">New seed</button>
          </div>
        </div>
      </details>

      <section className="rail-metrics" aria-label="Simulation summary">
        <div className="rail-heading"><span>Simulation summary</span></div>
        <article className="rail-metric">
          <span>Latest sample mean</span>
          <strong data-role="latest-mean">—</strong>
        </article>
        <article className="rail-metric">
          <span>Repeated samples</span>
          <strong data-role="sample-count">0</strong>
        </article>
        <article className="rail-metric">
          <span>Empirical SE</span>
          <strong data-role="empirical-se">—</strong>
        </article>
      </section>
    </aside>
  );
}
