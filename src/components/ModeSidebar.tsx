import type { TeachingMode, WorkflowMode } from "../core/types";

interface ModeSidebarProps {
  workflowMode: WorkflowMode;
  mode: TeachingMode;
  onWorkflowModeChange: (mode: WorkflowMode) => void;
  onModeChange: (mode: TeachingMode) => void;
}

export function ModeSidebar({
  workflowMode,
  mode,
  onWorkflowModeChange,
  onModeChange,
}: ModeSidebarProps) {
  return (
    <aside className="mode-sidebar">
      <div className="sidebar-brand">
        <p className="eyebrow">Medical Statistics Teaching Tool</p>
        <h1>Sampling Simulator</h1>
        <p className="sidebar-copy">
          Move from the model to one realised sample and then to the distribution of the
          statistic you care about.
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
        <h2>Objective</h2>
        <div className="sidebar-stack">
          <button
            type="button"
            className={`mode-pill ${workflowMode === "estimation" ? "active" : ""}`}
            onClick={() => onWorkflowModeChange("estimation")}
          >
            Estimation
          </button>
          <button
            type="button"
            className={`mode-pill ${workflowMode === "testing" ? "active" : ""}`}
            onClick={() => onWorkflowModeChange("testing")}
          >
            Testing & Power
          </button>
        </div>
      </section>

      {workflowMode === "estimation" ? (
        <>
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

          <div className="sidebar-note">
            <span>Current scope</span>
            <strong>One-group estimation</strong>
          </div>
        </>
      ) : (
        <div className="sidebar-note">
          <span>Current scope</span>
          <strong>One-group testing & power</strong>
        </div>
      )}
    </aside>
  );
}
