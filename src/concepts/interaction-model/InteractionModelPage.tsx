import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale } from "../../i18n/LocaleContext";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { InteractionControls } from "./InteractionControls";
import { InteractionStage } from "./InteractionStage";
import { implantData } from "./data";
import { interactionMessages } from "./messages";
import { fitInteractionModel, type InteractionModelKind } from "./model";
import "../ancova-additive/ancova-additive.css";
import "./interaction-model.css";

function initialReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function InteractionModelPage() {
  const { locale } = useLocale();
  const messages = interactionMessages[locale];
  const rootRef = useRef<HTMLElement>(null);
  const fits = useMemo(() => ({
    additive: fitInteractionModel(implantData, "additive"),
    interaction: fitInteractionModel(implantData, "interaction"),
  }), []);
  const [activeModel, setActiveModel] = useState<InteractionModelKind | null>(null);
  const [interactionRevealed, setInteractionRevealed] = useState(false);
  const [lineRevealProgress, setLineRevealProgress] = useState(0);
  const [modelMix, setModelMix] = useState(0);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [torqueA, setTorqueA] = useState(25);
  const [torqueB, setTorqueB] = useState(45);
  const [busy, setBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const reducedMotionRef = useRef(reducedMotion);
  const [fullscreen, setFullscreen] = useState(false);
  const [statusKey, setStatusKey] = useState<"statusInitial" | "statusAdditive" | "statusInteraction" | "fullscreenUnavailable">("statusInitial");
  const runtimeRef = useRef<AnimationRuntime | null>(null);

  if (runtimeRef.current === null) {
    runtimeRef.current = new AnimationRuntime({ speed: () => 1, reducedMotion: () => reducedMotionRef.current });
  }

  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);
  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      runtimeRef.current?.cancel();
    };
  }, []);

  async function showAdditive() {
    const runtime = runtimeRef.current;
    if (runtime === null || busy || activeModel === "additive") return;
    const token = runtime.beginRun();
    setBusy(true);
    setActiveModel("additive");
    if (lineRevealProgress < 1) {
      await runtime.tween(850, token, setLineRevealProgress);
    } else {
      const start = modelMix;
      await runtime.tween(750, token, (progress) => setModelMix(start * (1 - progress)));
    }
    if (!runtime.isCurrent(token)) return;
    setLineRevealProgress(1);
    setModelMix(0);
    setComparisonOpen(true);
    setBusy(false);
    setStatusKey("statusAdditive");
  }

  async function showInteraction() {
    const runtime = runtimeRef.current;
    if (runtime === null || busy || activeModel === null || activeModel === "interaction") return;
    const token = runtime.beginRun();
    setBusy(true);
    setActiveModel("interaction");
    const start = modelMix;
    await runtime.tween(950, token, (progress) => setModelMix(start + (1 - start) * progress));
    if (!runtime.isCurrent(token)) return;
    setModelMix(1);
    setInteractionRevealed(true);
    setComparisonOpen(true);
    setBusy(false);
    setStatusKey("statusInteraction");
  }

  function reset() {
    runtimeRef.current?.cancel();
    setActiveModel(null);
    setInteractionRevealed(false);
    setLineRevealProgress(0);
    setModelMix(0);
    setComparisonOpen(false);
    setTorqueA(25);
    setTorqueB(45);
    setBusy(false);
    setStatusKey("statusInitial");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === null) await rootRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      setStatusKey("fullscreenUnavailable");
    }
  }

  return (
    <main className="ancova-journey interaction-journey" ref={rootRef}>
      <header className="ancova-header">
        <a className="ancova-back-link" href="#/themes/linear-regression" aria-label={messages.backAria}>← {messages.library}</a>
        <div className="ancova-title">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
        <div className="ancova-header-actions">
          <LanguageSelector />
          <label className="ancova-motion-toggle">
            <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
            <span>{messages.reduceMotion}</span>
          </label>
          <button className="secondary ancova-presentation-button" type="button" onClick={() => void toggleFullscreen()}>
            {fullscreen ? messages.exitPresentation : messages.presentation}
          </button>
        </div>
      </header>

      <div className="ancova-workspace">
        <InteractionControls
          activeModel={activeModel}
          interactionRevealed={interactionRevealed}
          busy={busy}
          onAdditive={() => void showAdditive()}
          onInteraction={() => void showInteraction()}
          onReset={reset}
        />
        <InteractionStage
          additive={fits.additive}
          interaction={fits.interaction}
          activeModel={activeModel}
          interactionRevealed={interactionRevealed}
          lineRevealProgress={lineRevealProgress}
          modelMix={modelMix}
          comparisonOpen={comparisonOpen}
          torqueA={torqueA}
          torqueB={torqueB}
          onComparisonToggle={() => setComparisonOpen((open) => !open)}
          onTorqueAChange={setTorqueA}
          onTorqueBChange={setTorqueB}
          status={messages.stage[statusKey]}
        />
      </div>
    </main>
  );
}
