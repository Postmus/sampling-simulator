import type {
  StudyDesign,
  TeachingMode,
  TestingKind,
  WorkflowMode,
} from "../core/types";

interface ModeSidebarProps {
  workflowMode: WorkflowMode;
  studyDesign: StudyDesign;
  mode: TeachingMode;
  testingKind: TestingKind;
  onWorkflowModeChange: (mode: WorkflowMode) => void;
  onStudyDesignChange: (design: StudyDesign) => void;
  onModeChange: (mode: TeachingMode) => void;
  onTestingKindChange: (kind: TestingKind) => void;
}

export function ModeSidebar({
  workflowMode,
  studyDesign,
  mode,
  testingKind,
  onWorkflowModeChange,
  onStudyDesignChange,
  onModeChange,
  onTestingKindChange,
}: ModeSidebarProps) {
  const selectedMode = workflowMode === "estimation" ? mode : testingKind;

  return (
    <aside className="mode-sidebar">
      <section className="sidebar-section">
        <h2>Study Design</h2>
        <div className="sidebar-stack">
          <button
            type="button"
            className={`mode-pill ${studyDesign === "oneGroup" ? "active" : ""}`}
            onClick={() => onStudyDesignChange("oneGroup")}
          >
            One group
          </button>
          <button
            type="button"
            className={`mode-pill ${studyDesign === "twoGroups" ? "active" : ""}`}
            onClick={() => onStudyDesignChange("twoGroups")}
            disabled={workflowMode !== "estimation"}
          >
            Two groups
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
            Hypothesis Testing
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <h2>Outcome Type</h2>
        <div className="sidebar-segment">
          <button
            type="button"
            className={`segment-pill ${selectedMode === "mean" ? "active" : ""}`}
            onClick={() =>
              workflowMode === "estimation" ? onModeChange("mean") : onTestingKindChange("mean")
            }
          >
            Continuous
          </button>
          <button
            type="button"
            className={`segment-pill ${selectedMode === "proportion" ? "active" : ""}`}
            onClick={() =>
              workflowMode === "estimation"
                ? onModeChange("proportion")
                : onTestingKindChange("proportion")
            }
          >
            Binary
          </button>
        </div>
      </section>

    </aside>
  );
}
