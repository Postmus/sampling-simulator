import type { TeachingMode } from "../core/types";

interface ModeSidebarProps {
  mode: TeachingMode;
  onModeChange: (mode: TeachingMode) => void;
}

export function ModeSidebar({ mode, onModeChange }: ModeSidebarProps) {
  return (
    <aside className="mode-sidebar">
      <div className="sidebar-brand">
        <p className="eyebrow">Medical Statistics Teaching Tool</p>
        <h1>Sampling Simulator</h1>
        <p className="sidebar-copy">
          Move from the population to one realised sample and then to the sampling
          distribution of the estimator.
        </p>
      </div>

      <section className="sidebar-section">
        <h2>Study Design</h2>
        <div className="sidebar-stack">
          <button type="button" className="mode-pill active" disabled>
            One group
          </button>
          <button type="button" className="mode-pill" disabled>
            Two groups
          </button>
          <button type="button" className="mode-pill" disabled>
            3+ groups
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <h2>Parameter</h2>
        <div className="sidebar-segment">
          <button
            type="button"
            className={`segment-pill ${mode === "mean" ? "active" : ""}`}
            onClick={() => onModeChange("mean")}
          >
            Mean
          </button>
          <button
            type="button"
            className={`segment-pill ${mode === "proportion" ? "active" : ""}`}
            onClick={() => onModeChange("proportion")}
          >
            Proportion
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <h2>Objective</h2>
        <div className="sidebar-stack">
          <button type="button" className="mode-pill active" disabled>
            Estimation
          </button>
          <button type="button" className="mode-pill" disabled>
            Testing
          </button>
          <button type="button" className="mode-pill" disabled>
            Power
          </button>
        </div>
      </section>

      <div className="sidebar-note">
        <span>Current scope</span>
        <strong>One-group estimation</strong>
      </div>
    </aside>
  );
}
