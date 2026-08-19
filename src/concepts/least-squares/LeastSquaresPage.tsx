import { useEffect, useMemo, useRef, useState } from "react";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { fitLeastSquares, sumSquaredErrors, type RegressionLine } from "./model";
import { RegressionControls } from "./RegressionControls";
import { RegressionStage } from "./RegressionStage";
import { DEFAULT_REGRESSION_SCENARIO_ID, getRegressionScenario } from "./scenarios";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale } from "../../i18n/LocaleContext";
import { leastSquaresMessages, type LeastSquaresMessages } from "./messages";
import "./least-squares.css";

function initialReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function LeastSquaresPage() {
  const { locale } = useLocale();
  const messages = leastSquaresMessages[locale];
  const rootRef = useRef<HTMLElement>(null);
  const [scenarioId, setScenarioId] = useState(DEFAULT_REGRESSION_SCENARIO_ID);
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
  const [squareRevealProgress, setSquareRevealProgress] = useState(0);
  const [sseCollectionProgress, setSseCollectionProgress] = useState(0);
  const [sseCollected, setSseCollected] = useState(false);
  const [hasRevealedFit, setHasRevealedFit] = useState(false);
  const [status, setStatus] = useState<keyof LeastSquaresMessages["status"]>("initial");
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
    setSquareRevealProgress(0);
    setSseCollectionProgress(0);
    setSseCollected(false);
  }

  function changeScenario(id: string) {
    runtimeRef.current?.cancel();
    const nextScenario = getRegressionScenario(id);
    setScenarioId(nextScenario.id);
    setLine({ slope: nextScenario.initialSlope, intercept: nextScenario.initialIntercept });
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setStatus("newDataset");
  }

  function changeLine(nextLine: RegressionLine) {
    runtimeRef.current?.cancel();
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setLine(nextLine);
    setStatus("lineMoved");
  }

  async function evaluateCurrentLine(isBestFit = hasRevealedFit) {
    const runtime = runtimeRef.current;
    if (runtime === null || fitting || collectingSse) {
      return;
    }

    const token = runtime.beginRun();
    setSquareRevealProgress(0);
    setSseCollectionProgress(0);
    setSseCollected(false);
    setCollectingSse(true);
    setStatus("revealSquares");

    await runtime.tween(560, token, setSquareRevealProgress);
    if (!runtime.isCurrent(token)) {
      return;
    }

    setSquareRevealProgress(1);
    setStatus("collectSse");

    await runtime.tween(1050, token, setSseCollectionProgress);
    if (runtime.isCurrent(token)) {
      setSseCollectionProgress(1);
      setSseCollected(true);
      setCollectingSse(false);
      setStatus(isBestFit ? "fitComplete" : "candidateComplete");
    }
  }

  async function animateToFit() {
    const runtime = runtimeRef.current;
    if (runtime === null || fitting || collectingSse) {
      return;
    }
    const start = line;
    const token = runtime.beginRun();
    setFitting(true);
    setSseCollectionProgress(0);
    setSseCollected(false);
    setSquareRevealProgress(0);
    setStatus("search");

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
    setStatus("minimumFound");
    await evaluateCurrentLine(true);
  }

  function resetLine() {
    runtimeRef.current?.cancel();
    setLine({ slope: scenario.initialSlope, intercept: scenario.initialIntercept });
    setFitting(false);
    clearCollections();
    setHasRevealedFit(false);
    setStatus("reset");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) {
        await rootRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setStatus("fullscreenUnavailable");
    }
  }

  return (
    <main className="least-squares-journey" ref={rootRef}>
      <header className="regression-header">
        <a className="back-link" href="#/" aria-label={messages.backAria}>← {messages.library}</a>
        <div className="regression-title">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
        <div className="regression-header-actions">
          <LanguageSelector />
          <label className="regression-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => setReducedMotion(event.target.checked)}
            />
            <span>{messages.reduceMotion}</span>
          </label>
          <button className="secondary regression-presentation-button" type="button" onClick={() => void toggleFullscreen()}>
            {fullscreen ? messages.exitPresentation : messages.presentation}
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
          sseCollected={sseCollected}
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
          sseCollected={sseCollected}
          status={messages.status[status]}
        />
      </div>
    </main>
  );
}
