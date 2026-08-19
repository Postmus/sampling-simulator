import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { formatNumber, useLocale, type Locale } from "../../i18n/LocaleContext";
import { DiagnosticsControls } from "./DiagnosticsControls";
import { DiagnosticsStage } from "./DiagnosticsStage";
import { diagnosticsMessages, type DiagnosticsMessages } from "./messages";
import { fitDiagnosticModel, type PredictorKind } from "./model";
import { getDiagnosticScenario } from "./scenarios";
import "./regression-diagnostics.css";

interface VisualState {
  fitProgress: number;
  residualProgress: number;
  fittedPlotProgress: number;
  distributionProgress: number;
  referenceProgress: number;
}

type StatusMode = keyof DiagnosticsMessages["status"] | "finding";

const MAXIMUM_PHASE = 5;

function initialReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function visualsForPhase(phase: number): VisualState {
  return {
    fitProgress: phase >= 1 ? 1 : 0,
    residualProgress: phase >= 2 ? 1 : 0,
    fittedPlotProgress: phase >= 5 ? 1 : 0,
    distributionProgress: phase >= 3 ? 1 : 0,
    referenceProgress: phase >= 4 ? 1 : 0,
  };
}

function statusForPhase(phase: number): StatusMode {
  if (phase <= 0) return "initial";
  if (phase === 1) return "fitted";
  if (phase === 2) return "residuals";
  if (phase === 3) return "distribution";
  if (phase === 4) return "reference";
  return "fittedPlot";
}

function format(value: number, locale: Locale) {
  return formatNumber(value, locale, 2);
}

export default function RegressionDiagnosticsPage() {
  const { locale } = useLocale();
  const messages = diagnosticsMessages[locale];
  const rootRef = useRef<HTMLElement>(null);
  const [scenarioId, setScenarioId] = useState("well-behaved");
  const scenario = getDiagnosticScenario(scenarioId);
  const [predictor, setPredictor] = useState<PredictorKind>("raw");
  const [modelMix, setModelMix] = useState(0);
  const modelMixRef = useRef(0);
  const selectedModel = useMemo(
    () => fitDiagnosticModel(scenario.points, predictor),
    [scenario, predictor],
  );
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const [visuals, setVisuals] = useState<VisualState>(() => visualsForPhase(0));
  const visualsRef = useRef(visuals);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [statusMode, setStatusMode] = useState<StatusMode>("initial");
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const reducedMotionRef = useRef(reducedMotion);
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

  function updateVisuals(next: VisualState) {
    visualsRef.current = next;
    setVisuals(next);
  }

  function snapToPhase(nextPhase: number, status: StatusMode = statusForPhase(nextPhase)) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    updateVisuals(visualsForPhase(nextPhase));
    setStatusMode(status);
  }

  async function tweenToPhase(nextPhase: number, token: number) {
    const runtime = runtimeRef.current;
    if (runtime === null) return false;
    const start = visualsRef.current;
    const target = visualsForPhase(nextPhase);
    setStatusMode(statusForPhase(nextPhase));
    await runtime.tween(760, token, (progress) => {
      const eased = 1 - (1 - progress) ** 3;
      updateVisuals({
        fitProgress: start.fitProgress + (target.fitProgress - start.fitProgress) * eased,
        residualProgress: start.residualProgress + (target.residualProgress - start.residualProgress) * eased,
        fittedPlotProgress: start.fittedPlotProgress + (target.fittedPlotProgress - start.fittedPlotProgress) * eased,
        distributionProgress: start.distributionProgress + (target.distributionProgress - start.distributionProgress) * eased,
        referenceProgress: start.referenceProgress + (target.referenceProgress - start.referenceProgress) * eased,
      });
    });
    if (!runtime.isCurrent(token)) return false;
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    updateVisuals(target);
    if (nextPhase === MAXIMUM_PHASE) setStatusMode("finding");
    return true;
  }

  async function runSequence(startPhase = phaseRef.current) {
    const runtime = runtimeRef.current;
    if (runtime === null) return;
    let from = startPhase;
    if (from >= MAXIMUM_PHASE) {
      snapToPhase(0, "reset");
      from = 0;
    }
    const token = runtime.beginRun();
    setPlaying(true);
    setPaused(false);
    for (let nextPhase = from + 1; nextPhase <= MAXIMUM_PHASE; nextPhase += 1) {
      const completed = await tweenToPhase(nextPhase, token);
      if (!completed) return;
      if (nextPhase < MAXIMUM_PHASE) await runtime.delay(220, token);
      if (!runtime.isCurrent(token)) return;
    }
    setPlaying(false);
    setPaused(false);
    setTransforming(false);
  }

  async function nextPhase() {
    const runtime = runtimeRef.current;
    if (runtime === null || playing || phaseRef.current >= MAXIMUM_PHASE) return;
    const token = runtime.beginRun();
    setPlaying(true);
    setPaused(false);
    await tweenToPhase(phaseRef.current + 1, token);
    if (runtime.isCurrent(token)) {
      setPlaying(false);
      setPaused(false);
    }
  }

  function previousPhase() {
    if (playing || phaseRef.current <= 0) return;
    runtimeRef.current?.cancel();
    snapToPhase(phaseRef.current - 1);
  }

  function playPause() {
    const runtime = runtimeRef.current;
    if (runtime === null) return;
    if (playing) {
      const nowPaused = runtime.togglePaused();
      setPaused(nowPaused);
      return;
    }
    void runSequence();
  }

  function replay() {
    runtimeRef.current?.cancel();
    setPlaying(false);
    setPaused(false);
    setTransforming(false);
    snapToPhase(0, "reset");
    void runSequence(0);
  }

  function changeScenario(id: string) {
    runtimeRef.current?.cancel();
    const nextScenario = getDiagnosticScenario(id);
    setScenarioId(nextScenario.id);
    setPredictor("raw");
    modelMixRef.current = 0;
    setModelMix(0);
    setPlaying(false);
    setPaused(false);
    setTransforming(false);
    snapToPhase(0, "newExample");
  }

  async function changePredictor(nextPredictor: PredictorKind) {
    if (!scenario.supportsLog || nextPredictor === predictor) return;
    const runtime = runtimeRef.current;
    if (runtime === null) return;
    runtime.cancel();
    setPlaying(false);
    setPaused(false);
    setTransforming(true);
    setPredictor(nextPredictor);
    setStatusMode("transforming");
    const start = modelMixRef.current;
    const target = nextPredictor === "log" ? 1 : 0;
    const token = runtime.beginRun();
    await runtime.tween(980, token, (progress) => {
      const eased = 1 - (1 - progress) ** 3;
      const next = start + (target - start) * eased;
      modelMixRef.current = next;
      setModelMix(next);
    });
    if (!runtime.isCurrent(token)) return;
    modelMixRef.current = target;
    setModelMix(target);
    setTransforming(false);
    setStatusMode(phaseRef.current === MAXIMUM_PHASE
      ? "finding"
      : nextPredictor === "log" ? "transformed" : statusForPhase(phaseRef.current));
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) await rootRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      setStatusMode("fullscreenUnavailable");
    }
  }

  const fit = selectedModel.fit;
  const sign = fit.slope < 0 ? "−" : "+";
  const term = predictor === "log" ? "log₂(x)" : "x";
  const equation = `ŷ = ${format(fit.intercept, locale)} ${sign} ${format(Math.abs(fit.slope), locale)}${term}`;
  const finding = predictor === "log" && scenario.copy[locale].transformedFinding
    ? scenario.copy[locale].transformedFinding
    : scenario.copy[locale].finding;
  const status = statusMode === "finding" ? finding : messages.status[statusMode];

  return (
    <main className="diagnostics-journey" ref={rootRef}>
      <header className="diagnostics-header">
        <a className="diagnostics-back-link" href="#/" aria-label={messages.backAria}>← {messages.library}</a>
        <div className="diagnostics-title">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
        <div className="diagnostics-header-actions">
          <LanguageSelector />
          <label className="diagnostics-motion-toggle">
            <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
            <span>{messages.reduceMotion}</span>
          </label>
          <button className="secondary diagnostics-presentation-button" type="button" onClick={() => void toggleFullscreen()}>
            {fullscreen ? messages.exitPresentation : messages.presentation}
          </button>
        </div>
      </header>

      <div className="diagnostics-workspace">
        <DiagnosticsControls
          scenario={scenario}
          predictor={predictor}
          fit={fit}
          phase={phase}
          maximumPhase={MAXIMUM_PHASE}
          playing={playing}
          paused={paused}
          transforming={transforming}
          onScenarioChange={changeScenario}
          onPredictorChange={(next) => void changePredictor(next)}
          onPrevious={previousPhase}
          onNext={() => void nextPhase()}
          onPlayPause={playPause}
          onReplay={replay}
        />
        <DiagnosticsStage
          scenario={scenario}
          modelMix={modelMix}
          {...visuals}
          equation={equation}
          status={status}
        />
      </div>
    </main>
  );
}
