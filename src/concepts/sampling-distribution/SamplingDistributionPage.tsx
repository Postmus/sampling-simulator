import { useEffect, useRef } from "react";
import { SamplingControls } from "./SamplingControls";
import { SamplingJourneyController } from "./SamplingJourneyController";
import { SamplingStage } from "./SamplingStage";
import "./sampling-distribution.css";

export default function SamplingDistributionPage() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }
    const controller = new SamplingJourneyController(rootRef.current);
    return () => controller.destroy();
  }, []);

  return (
    <main className="sampling-journey" ref={rootRef}>
      <header className="compact-header">
        <a className="back-link" href="#/" aria-label="Back to concept library">← Library</a>
        <div className="compact-title">
          <p className="eyebrow">Sampling and estimation</p>
          <h1>Sampling distribution of the sample mean</h1>
          <p className="header-subtitle">Variation across repeated samples from a normal population</p>
        </div>
        <button data-role="fullscreen" className="secondary compact-button" type="button">
          Presentation mode
        </button>
      </header>

      <div className="workspace-layout">
        <SamplingControls />
        <SamplingStage />
      </div>
    </main>
  );
}
