import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale } from "../../i18n/LocaleContext";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { AncovaControls } from "./AncovaControls";
import { AncovaStage } from "./AncovaStage";
import { periodontalData } from "./data";
import { ancovaMessages } from "./messages";
import { fitAncova, type AncovaModelKind } from "./model";
import "./ancova-additive.css";

function initialReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AncovaAdditivePage() {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale];
  const rootRef = useRef<HTMLElement>(null);
  const fits = useMemo(() => ({
    unadjusted: fitAncova(periodontalData, "unadjusted"),
    adjusted: fitAncova(periodontalData, "adjusted"),
  }), []);
  const [activeModel, setActiveModel] = useState<AncovaModelKind | null>(null);
  const [adjustedRevealed, setAdjustedRevealed] = useState(false);
  const [lineRevealProgress, setLineRevealProgress] = useState(0);
  const [modelMix, setModelMix] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const reducedMotionRef = useRef(reducedMotion);
  const [fullscreen, setFullscreen] = useState(false);
  const [statusKey, setStatusKey] = useState<"statusInitial" | "statusUnadjusted" | "statusAdjusted" | "fullscreenUnavailable">("statusInitial");
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

  async function showUnadjusted() {
    const runtime = runtimeRef.current;
    if (runtime === null || busy || activeModel === "unadjusted") return;
    const token = runtime.beginRun();
    setBusy(true);
    setActiveModel("unadjusted");
    if (lineRevealProgress < 1) {
      await runtime.tween(850, token, setLineRevealProgress);
    } else {
      const start = modelMix;
      await runtime.tween(650, token, (progress) => setModelMix(start * (1 - progress)));
    }
    if (!runtime.isCurrent(token)) return;
    setLineRevealProgress(1);
    setModelMix(0);
    setBusy(false);
    setStatusKey("statusUnadjusted");
  }

  async function showAdjusted() {
    const runtime = runtimeRef.current;
    if (runtime === null || busy || activeModel === null || activeModel === "adjusted") return;
    const token = runtime.beginRun();
    setBusy(true);
    setActiveModel("adjusted");
    const start = modelMix;
    await runtime.tween(950, token, (progress) => setModelMix(start + (1 - start) * progress));
    if (!runtime.isCurrent(token)) return;
    setModelMix(1);
    setAdjustedRevealed(true);
    setBusy(false);
    setStatusKey("statusAdjusted");
  }

  function reset() {
    runtimeRef.current?.cancel();
    setActiveModel(null);
    setAdjustedRevealed(false);
    setLineRevealProgress(0);
    setModelMix(0);
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
    <main className="ancova-journey" ref={rootRef}>
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
        <AncovaControls
          activeModel={activeModel}
          adjustedRevealed={adjustedRevealed}
          busy={busy}
          onUnadjusted={() => void showUnadjusted()}
          onAdjusted={() => void showAdjusted()}
          onReset={reset}
        />
        <AncovaStage
          unadjusted={fits.unadjusted}
          adjusted={fits.adjusted}
          activeModel={activeModel}
          adjustedRevealed={adjustedRevealed}
          lineRevealProgress={lineRevealProgress}
          modelMix={modelMix}
          status={messages.stage[statusKey]}
        />
      </div>
    </main>
  );
}
