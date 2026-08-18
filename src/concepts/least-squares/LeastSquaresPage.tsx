import { useEffect, useMemo, useRef, useState } from "react";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { fitLeastSquares, sumSquaredErrors, type RegressionLine } from "./model";
import { RegressionControls } from "./RegressionControls";
import { RegressionStage } from "./RegressionStage";
import { getRegressionScenario } from "./scenarios";
import "./least-squares.css";

function initialReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function LeastSquaresPage() {
  const rootRef = useRef<HTMLElement>(null);
  const [scenarioId, setScenarioId] = useState("study-hours");
  const scenario = getRegressionScenario(scenarioId);
  const fit = useMemo(() => fitLeastSquares(scenario.points), [scenario]);
  const [line, setLine] = useState<RegressionLine>({
    slope: scenario.initialSlope,
    intercept: scenario.initialIntercept,
  });
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const reducedMotionRef = useRef(reducedMotion);
  const [fitting, setFitting] = useState(false);
  const [collectingSse, setCollectingSse] = useState(false);
  const [collectingResiduals, setCollectingResiduals] = useState(false);
  const [squareRevealProgress, setSquareRevealProgress] = useState(0);
  const [sseCollectionProgress, setSseCollectionProgress] = useState(0);
  const [residualCollectionProgress, setResidualCollectionProgress] = useState(0);
  const [sseCollected, setSseCollected] = useState(false);
  const [residualsCollected, setResidualsCollected] = useState(false);
  const [hasRevealedFit, setHasRevealedFit] = useState(false);
  const [status, setStatus] = useState(
    "Move the candidate line, then evaluate it to collect its squared and signed residuals.",
  );
  const [fullscreen, setFullscreen] = useState(false);
  const runtimeRef = useRef<AnimationRuntime | null>(null);

  if (runtimeRef.current === null) {
    runtimeRef.current = new AnimationRuntime({
      speed: () => 1,
      reducedMotion: () => reducedMotionRef.current,
    });
  }

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      runtimeRef.current?.cancel();
    };
  }, []);

  const candidateSse = sumSquaredErrors(scenario.points, line);

  function clearCollections() {
    setCollectingSse(false);
    setCollectingResiduals(false);
    setSquareRevealProgress(0);
    setSseCollectionProgress(0);
    setResidualCollectionProgress(0);
    setSseCollected(false);
    setResidualsCollected(false);
  }

  function changeScenario(id: string) {
    runtimeRef.current?.cancel();
    const nextScenario = getRegressionScenario(id);
    setScenarioId(nextScenario.id);
    setLine({ slope: nextScenario.initialSlope, intercept: nextScenario.initialIntercept });
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setStatus("A new dataset is ready. Move the candidate line, then evaluate it.");
  }

  function changeLine(nextLine: RegressionLine) {
    runtimeRef.current?.cancel();
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setLine(nextLine);
    setStatus("The candidate line moved. Choose “Evaluate this line” when you are satisfied with it.");
  }

  async function evaluateCurrentLine(isBestFit = hasRevealedFit) {
    const runtime = runtimeRef.current;
    if (runtime === null || fitting || collectingSse || collectingResiduals) {
      return;
    }

    const token = runtime.beginRun();
    setSquareRevealProgress(0);
    setSseCollectionProgress(0);
    setResidualCollectionProgress(0);
    setSseCollected(false);
    setResidualsCollected(false);
    setCollectingSse(true);
    setStatus("Each vertical residual is expanding into a square with side length |residual|.");

    await runtime.tween(560, token, setSquareRevealProgress);
    if (!runtime.isCurrent(token)) {
      return;
    }

    setSquareRevealProgress(1);
    setCollectingSse(false);
    setCollectingResiduals(true);
    setStatus("The current line’s signed residuals are moving onto the residual axis.");

    await runtime.tween(1050, token, setResidualCollectionProgress);
    if (!runtime.isCurrent(token)) {
      return;
    }

    setResidualCollectionProgress(1);
    setResidualsCollected(true);
    setCollectingResiduals(false);
    setCollectingSse(true);
    setStatus("The residual squares are collecting into the current line’s total SSE.");

    await runtime.tween(1050, token, setSseCollectionProgress);
    if (runtime.isCurrent(token)) {
      setSseCollectionProgress(1);
      setSseCollected(true);
      setCollectingSse(false);
      setStatus(
        isBestFit
          ? "Best fit complete: the residual plot shows its signed errors, and the bar is the minimum SSE."
          : "The lower panels now summarize the current candidate line.",
      );
    }
  }

  async function animateToFit() {
    const runtime = runtimeRef.current;
    if (runtime === null || fitting || collectingSse || collectingResiduals) {
      return;
    }
    const start = line;
    const token = runtime.beginRun();
    setFitting(true);
    setSseCollectionProgress(0);
    setResidualCollectionProgress(0);
    setSseCollected(false);
    setResidualsCollected(false);
    setSquareRevealProgress(0);
    setStatus("Searching the slope–intercept landscape for the smallest sum of squared residuals.");

    await runtime.tween(1150, token, (progress) => {
      const eased = 1 - (1 - progress) ** 3;
      setLine({
        slope: start.slope + (fit.slope - start.slope) * eased,
        intercept: start.intercept + (fit.intercept - start.intercept) * eased,
      });
    });

    if (!runtime.isCurrent(token)) {
      return;
    }

    setLine({ slope: fit.slope, intercept: fit.intercept });
    setFitting(false);
    setHasRevealedFit(true);
    setStatus("Minimum found. Its squared and signed residuals will now be collected automatically.");
    await evaluateCurrentLine(true);
  }

  function resetLine() {
    runtimeRef.current?.cancel();
    setLine({ slope: scenario.initialSlope, intercept: scenario.initialIntercept });
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setStatus("The candidate line is reset. Adjust it, then choose “Evaluate this line”.");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) {
        await rootRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setStatus("Fullscreen mode is not available in this browser.");
    }
  }

  return (
    <main className="least-squares-journey" ref={rootRef}>
      <header className="regression-header">
        <a className="back-link" href="#/" aria-label="Back to concept library">← Library</a>
        <div className="regression-title">
          <p className="eyebrow">Relationships and regression</p>
          <h1>How does least squares choose a line?</h1>
          <p>Move a candidate line, inspect its errors, and follow it to the unique minimum.</p>
        </div>
        <div className="regression-header-actions">
          <label className="regression-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => setReducedMotion(event.target.checked)}
            />
            <span>Reduce motion</span>
          </label>
          <button className="secondary regression-presentation-button" type="button" onClick={() => void toggleFullscreen()}>
            {fullscreen ? "Exit presentation" : "Presentation mode"}
          </button>
        </div>
      </header>

      <div className="regression-workspace">
        <RegressionControls
          scenario={scenario}
          line={line}
          fit={fit}
          candidateSse={candidateSse}
          fitting={fitting}
          collectingSse={collectingSse}
          collectingResiduals={collectingResiduals}
          sseCollected={sseCollected}
          residualsCollected={residualsCollected}
          hasRevealedFit={hasRevealedFit}
          onScenarioChange={changeScenario}
          onSlopeChange={(slope) => changeLine({ ...line, slope })}
          onInterceptChange={(intercept) => changeLine({ ...line, intercept })}
          onEvaluate={() => void evaluateCurrentLine()}
          onFit={() => void animateToFit()}
          onReset={resetLine}
        />
        <RegressionStage
          scenario={scenario}
          line={line}
          fit={fit}
          hasRevealedFit={hasRevealedFit}
          squareRevealProgress={squareRevealProgress}
          sseCollectionProgress={sseCollectionProgress}
          residualCollectionProgress={residualCollectionProgress}
          sseCollected={sseCollected}
          status={status}
        />
      </div>
    </main>
  );
}
