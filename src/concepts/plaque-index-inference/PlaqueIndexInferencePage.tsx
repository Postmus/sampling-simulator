import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { createRng, randomSeed } from "../../domain/rng";
import { formatNumber, useLocale } from "../../i18n/LocaleContext";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { DistributionChart, PopulationChart } from "./Charts";
import {
  DEFAULT_CONFIGURATION, MAX_EXPERIMENTS, rejectionBoundary, experimentEstimate,
  simulateExperiment, validateConfiguration,
  type Configuration, type Estimate, type Experiment,
} from "./model";
import { plaqueMessages } from "./messages";
import "./plaque-index-inference.css";

type Status = "initialStatus" | "sampleStatus" | "accumulateStatus" | "completeStatus" | "resetStatus" | "changedStatus" | "limit" | "fullscreenUnavailable";
type Settings = { hypothesis: "h0" | "h1"; controlMean: string; sd: string; sampleSize: string; alternativeDifference: string };
const INITIAL_SEED = 271828;
const INITIAL_SETTINGS: Settings = { hypothesis: "h0", controlMean: "1.50", sd: "0.60", sampleSize: "24", alternativeDifference: "-0.30" };

export default function PlaqueIndexInferencePage() {
  const { locale } = useLocale();
  const m = plaqueMessages[locale];
  const f = (value: number | null | undefined, digits = 2) => value == null ? "—" : formatNumber(value, locale, digits, digits);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const proposed: Configuration = { hypothesis: settings.hypothesis, controlMean: Number(settings.controlMean), sd: Number(settings.sd), sampleSize: Number(settings.sampleSize), alternativeDifference: Number(settings.alternativeDifference) };
  const valid = settings.controlMean.trim() !== "" && validateConfiguration(proposed);
  const [configuration, setConfiguration] = useState<Configuration>(DEFAULT_CONFIGURATION);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [latest, setLatest] = useState<Experiment | null>(null);
  const [sampleProgress, setSampleProgress] = useState(1);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<Status>("initialStatus");
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [speed, setSpeed] = useState(1);
  const [showRejectionRegions, setShowRejectionRegions] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const rng = useRef(createRng(seed));
  const count = useRef(0);
  const busy = useRef(false);
  const options = useRef({ speed, reducedMotion });
  options.current = { speed, reducedMotion };
  const [runtime] = useState(() => new AnimationRuntime({ speed: () => options.current.speed, reducedMotion: () => options.current.reducedMotion }));

  useEffect(() => () => runtime.cancel(), [runtime]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const critical = rejectionBoundary(configuration);
  const rejectionCount = useMemo(() => estimates.filter((result) => result.rejected).length, [estimates]);

  function clear(nextStatus: Status, nextSeed = seed) {
    runtime.cancel();
    busy.current = false;
    count.current = 0;
    rng.current = createRng(nextSeed);
    setEstimates([]); setLatest(null); setSampleProgress(1);
    setRunning(false); setPaused(false); setStatus(nextStatus);
  }

  function resetDefaults() {
    setSettings(INITIAL_SETTINGS);
    setConfiguration(DEFAULT_CONFIGURATION);
    setShowRejectionRegions(false);
    setSpeed(1);
    setSeed(INITIAL_SEED);
    clear("initialStatus", INITIAL_SEED);
  }

  function changeSetting<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
    const next = { ...settings, [key]: value };
    if (key === "hypothesis" && value === "h0"
      && (!Number.isFinite(Number(next.alternativeDifference)) || Math.abs(Number(next.alternativeDifference)) < 0.05 || Math.abs(Number(next.alternativeDifference)) > 0.8)) {
      next.alternativeDifference = INITIAL_SETTINGS.alternativeDifference;
    }
    setSettings(next);
    const nextConfiguration: Configuration = { hypothesis: next.hypothesis, controlMean: Number(next.controlMean), sd: Number(next.sd), sampleSize: Number(next.sampleSize), alternativeDifference: Number(next.alternativeDifference) };
    if (next.controlMean.trim() !== "" && validateConfiguration(nextConfiguration)) setConfiguration(nextConfiguration);
    clear("changedStatus");
  }

  async function run(amount: number, animate: boolean) {
    if (!valid || busy.current || count.current >= MAX_EXPERIMENTS) return;
    busy.current = true;
    setRunning(true); setPaused(false);
    const token = runtime.beginRun();
    const allowed = Math.min(amount, MAX_EXPERIMENTS - count.current);
    if (!animate) {
      const results: Estimate[] = [];
      let last: Experiment | null = null;
      // Yield between chunks so navigation, model changes and pause remain responsive.
      for (let offset = 0; offset < allowed; offset += 100) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        await runtime.delay(1, token);
        if (!runtime.isCurrent(token)) return;
        for (let i = 0; i < Math.min(100, allowed - offset); i += 1) {
          last = simulateExperiment(configuration, rng.current, critical);
          results.push(experimentEstimate(last));
        }
      }
      if (!runtime.isCurrent(token)) return;
      count.current += results.length;
      setLatest(last); setSampleProgress(1);
      setEstimates((previous) => [...previous, ...results]);
    } else {
      for (let index = 0; index < allowed; index += 1) {
        if (!runtime.isCurrent(token)) return;
        const result = simulateExperiment(configuration, rng.current, critical);
        setLatest(result); setSampleProgress(0); setStatus("sampleStatus");
        await runtime.delay(250, token);
        if (!runtime.isCurrent(token)) return;
        await runtime.tween(1100, token, setSampleProgress);
        if (!runtime.isCurrent(token)) return;
        await runtime.delay(250, token);
        if (!runtime.isCurrent(token)) return;
        count.current += 1;
        setEstimates((previous) => [...previous, experimentEstimate(result)]);
        setStatus("accumulateStatus");
        await runtime.delay(650, token);
      }
    }
    if (!runtime.isCurrent(token)) return;
    busy.current = false; setRunning(false); setPaused(false);
    setStatus(count.current >= MAX_EXPERIMENTS ? "limit" : "completeStatus");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { setStatus("fullscreenUnavailable"); }
  }

  const atLimit = estimates.length >= MAX_EXPERIMENTS;
  return <main className="plaque-exploration" ref={rootRef} data-reduced-motion={reducedMotion}>
    <header className="plaque-header">
      <a href="#/themes/sampling-estimation" aria-label={m.backAria}>← {m.back}</a>
      <div><p className="eyebrow">{m.eyebrow}</p><h1>{m.title}</h1><p>{m.subtitle}</p></div>
      <div className="plaque-header-actions"><LanguageSelector /><button type="button" onClick={toggleFullscreen}>{fullscreen ? m.exitPresentation : m.presentation}</button></div>
    </header>

    <div className="plaque-workspace">
      <aside className="plaque-controls" aria-label={m.model}>
        <h2>{m.model}</h2>
        <label><span>{m.hypothesis}</span><select value={settings.hypothesis} onChange={(event) => changeSetting("hypothesis", event.target.value as "h0" | "h1")}>
          <option value="h0">{m.h0}</option><option value="h1">{m.h1}</option>
        </select></label>
        <label><span>{m.controlMean}</span><input type="number" min="0" max="3" step="0.1" value={settings.controlMean} onChange={(event) => changeSetting("controlMean", event.target.value)} /></label>
        <div className="plaque-input-pair">
          <label><span>{m.sd}</span><input type="number" min="0.05" max="1.2" step="0.05" value={settings.sd} onChange={(event) => changeSetting("sd", event.target.value)} /></label>
          <label><span>{m.n}</span><input type="number" min="2" max="500" step="1" value={settings.sampleSize} onChange={(event) => changeSetting("sampleSize", event.target.value)} /></label>
        </div>
        <label><span>{m.effect}</span><input type="number" min="-0.8" max="0.8" step="0.05" value={settings.alternativeDifference} disabled={settings.hypothesis === "h0"} onChange={(event) => changeSetting("alternativeDifference", event.target.value)} /></label>
        <button className="plaque-defaults" type="button" onClick={resetDefaults}>{m.resetDefaults}</button>
        {!valid && <p className="plaque-validation" role="alert">{m.validation}</p>}
        <div className="plaque-actions">
          <button className="primary" type="button" disabled={!valid || running || atLimit} onClick={() => void run(1, true)}>{m.draw}</button>
          <button type="button" disabled={!valid || running || atLimit} onClick={() => void run(10, true)}>{m.animate}</button>
          <button type="button" disabled={!valid || running || atLimit} onClick={() => void run(1000, false)}>{m.batch}</button>
          <button type="button" disabled={!running || reducedMotion} onClick={() => setPaused(runtime.togglePaused())}>{paused ? m.resume : m.pause}</button>
          <button type="button" onClick={() => clear("resetStatus")}>{m.reset}</button>
        </div>
        <details><summary>{m.options}</summary><div className="plaque-options">
          <label className="plaque-checkbox"><input type="checkbox" checked={reducedMotion} onChange={(event) => {
            setReducedMotion(event.target.checked);
            if (event.target.checked && runtime.isPaused) { runtime.togglePaused(); setPaused(false); }
          }} />{m.reduced}</label>
          <label><span>{m.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="1">{m.normal}</option><option value="2.5">{m.fast}</option></select></label>
          <p className="plaque-seed">{m.seed}: <output>{seed}</output></p>
          <button type="button" onClick={() => { const next = randomSeed(); setSeed(next); clear("resetStatus", next); }}>{m.newSeed}</button>
        </div></details>
        <div className="plaque-run-summary" aria-live="polite">
          <span>{m.count}</span><strong data-role="plaque-count">{formatNumber(estimates.length, locale, 0)}</strong>
          <span>{configuration.hypothesis === "h0" ? m.rateH0 : m.rateH1}</span>
          <strong data-role="plaque-rejection-rate">{estimates.length ? `${f(100 * rejectionCount / estimates.length, 1)}%` : "—"}</strong>
          <p>{m.rejected}: {formatNumber(rejectionCount, locale, 0)} / {formatNumber(estimates.length, locale, 0)}</p>
          {configuration.hypothesis === "h0" && <p>{m.target}</p>}
        </div>
      </aside>

      <div className="plaque-main">
        <p className="plaque-status" role="status">{paused ? m.pausedStatus : m[status]}</p>
        <section className="plaque-panel" aria-labelledby="plaque-populations-heading">
          <h2 id="plaque-populations-heading">{m.populations}</h2>
          <PopulationChart configuration={configuration} latest={latest} locale={locale} progress={sampleProgress} />
        </section>

        <section className="plaque-panel" aria-labelledby="plaque-distributions-heading">
          <h2 id="plaque-distributions-heading">{m.distributions}</h2>
          <p className="plaque-description">{m.distributionDescription}</p>
          <label className="plaque-checkbox plaque-region-toggle">
            <input type="checkbox" checked={showRejectionRegions} onChange={(event) => setShowRejectionRegions(event.target.checked)} />
            {m.showRejectionRegions}
          </label>
          <DistributionChart estimates={estimates} critical={critical} locale={locale} showRejectionRegions={showRejectionRegions} />
          <p className="plaque-chart-caption">{showRejectionRegions ? m.differenceReference : m.latestReference}</p>
        </section>
      </div>
    </div>
  </main>;
}
