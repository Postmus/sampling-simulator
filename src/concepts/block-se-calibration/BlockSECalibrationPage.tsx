import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { formatNumber, useLocale } from "../../i18n/LocaleContext";
import { createRng, randomSeed } from "../../domain/rng";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { BATCH_SIZE, MIN_CALIBRATION_DATASETS, CENTER_EFFECTS, DEFAULT_CONFIGURATION, INITIAL_SEED, MAX_DATASETS, simulate, summarize, validConfiguration, type AnalysisKey, type Dataset, type Result } from "./model";
import { messages } from "./messages";
import { DatasetChart, SamplingChart, SEBoxPlot, type DatasetReveal } from "./Charts";
import "./block-se-calibration.css";

type Status = "ready" | "running" | "done" | "stopped" | "changed" | "resetStatus" | "limit" | "unavailable";
type Stage = "empty" | "points" | "means" | "difference" | "transfer" | "complete";
const hidden: DatasetReveal = { points: 0, means: 0, difference: 0 };
const shown: DatasetReveal = { points: 1, means: 1, difference: 1 };
const defaults = { effect: String(DEFAULT_CONFIGURATION.effect), residualSD: String(DEFAULT_CONFIGURATION.residualSD) };

export default function BlockSECalibrationPage() {
  const { locale } = useLocale();
  const m = messages[locale];
  const f = (value: number | null, digits = 2) => value === null ? "—" : formatNumber(value, locale, digits, digits);
  const [settings, setSettings] = useState(defaults);
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const [selected, setSelected] = useState<AnalysisKey>("treatment");
  const [results, setResults] = useState<Result[]>([]);
  const [latest, setLatest] = useState<Dataset | null>(null);
  const [reveal, setReveal] = useState<DatasetReveal>(hidden);
  const [stage, setStage] = useState<Stage>("empty");
  const pending = useRef<Dataset | null>(null);
  const completedDataset = useRef<Dataset | null>(null);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [fullscreen, setFullscreen] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const root = useRef<HTMLElement>(null);
  const rng = useRef(createRng(INITIAL_SEED));
  const records = useRef<Result[]>([]);
  const busy = useRef(false);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [runtime] = useState(() => new AnimationRuntime({ speed: () => 1, reducedMotion: () => reducedRef.current }));
  const valid = Object.values(settings).every(v => v.trim() !== "")
    && validConfiguration({ effect: Number(settings.effect), residualSD: Number(settings.residualSD) });
  useEffect(() => () => runtime.cancel(), [runtime]);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const summary = useMemo(() => summarize(results, selected, configuration.effect), [results, selected, configuration.effect]);
  const comparisonReady = results.length >= MIN_CALIBRATION_DATASETS;
  const empiricalSE = comparisonReady ? summary.empiricalSE : null;
  const ratio = empiricalSE !== null && empiricalSE > 0 && summary.reportedSE !== null
    ? summary.reportedSE / empiricalSE : null;

  function reset(nextStatus: Status = "resetStatus", nextSeed = seed) {
    runtime.cancel(); busy.current = false; records.current = []; rng.current = createRng(nextSeed);
    pending.current = null; completedDataset.current = null;
    setReveal(hidden); setStage("empty");
    setRunning(false); setProgress(0); setResults([]); setLatest(null); setStatus(nextStatus);
  }
  function update(key: keyof typeof settings, value: string) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    const parsed = { effect: Number(next.effect), residualSD: Number(next.residualSD) };
    if (Object.values(next).every(v => v.trim() !== "") && validConfiguration(parsed)) setConfiguration(parsed);
    reset("changed");
  }
  async function run(amount: number) {
    if (!valid || busy.current || records.current.length >= MAX_DATASETS) return;
    busy.current = true; setRunning(true); setStatus("running"); setProgress(0);
    const token = runtime.beginRun();
    const allowed = Math.min(amount, MAX_DATASETS - records.current.length);
    try {
      // Keep an interrupted preview available for the next run, without counting it yet.
      const first = pending.current ?? simulate(configuration, rng.current);
      pending.current = first;
      setLatest(first); setReveal(hidden); setStage("points");
      await runtime.tween(850, token, value => setReveal({ ...hidden, points: value }));
      if (!runtime.isCurrent(token)) return;
      setStage("means");
      await runtime.tween(750, token, value => setReveal({ points: 1, means: value, difference: 0 }));
      if (!runtime.isCurrent(token)) return;
      setStage("difference");
      await runtime.tween(600, token, value => setReveal({ points: 1, means: 1, difference: value }));
      await runtime.delay(650, token);
      if (!runtime.isCurrent(token)) return;
      setStage("transfer");
      await runtime.delay(450, token);
      if (!runtime.isCurrent(token)) return;
      records.current.push(first.result);
      completedDataset.current = first; pending.current = null;
      setResults([...records.current]); setReveal(shown); setStage("complete"); setProgress(1 / allowed);
      // Let the first estimate enter the histogram before fast batch processing.
      await runtime.delay(250, token);
      for (let i = 1; i < allowed && runtime.isCurrent(token); i += 100) {
        let last = first;
        const count = Math.min(100, allowed - i);
        for (let j = 0; j < count; j++) {
          last = simulate(configuration, rng.current);
          records.current.push(last.result);
        }
        completedDataset.current = last;
        setResults([...records.current]); setLatest(last); setProgress((i + count) / allowed);
        // Yield after each completed chunk so stop/reset/navigation remain responsive.
        await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      }
      if (runtime.isCurrent(token)) setStatus(records.current.length === MAX_DATASETS ? "limit" : "done");
    } finally {
      if (runtime.isCurrent(token)) { busy.current = false; setRunning(false); }
    }
  }
  function stop() {
    runtime.cancel(); busy.current = false; setRunning(false); setStatus("stopped");
    setLatest(completedDataset.current); setReveal(completedDataset.current ? shown : hidden);
    setStage(completedDataset.current ? "complete" : "empty");
  }
  async function presentation() {
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch { setStatus("unavailable"); }
  }
  const fitted = latest?.result[selected];
  const atLimit = results.length >= MAX_DATASETS;

  return <main className="se-page" ref={root} data-reduced-motion={reduced}>
    <header className="se-header">
      <div><a href="#/themes/clustered-data">← {m.back}</a><p className="se-eyebrow">{m.eyebrow}</p><h1>{m.title}</h1></div>
      <div className="se-header-actions"><LanguageSelector /><button onClick={() => void presentation()}>{fullscreen ? m.exit : m.presentation}</button></div>
    </header>
    <p className="se-subtitle">{m.subtitle}</p>
    <div className="se-workspace">
      <aside className="se-panel se-controls" aria-label={m.setup}>
        <h2>{m.setup}</h2><strong>{m.design}</strong><p>{m.allocation}</p>
        <label>{m.effect}<input type="number" min="-50" max="50" step="1" value={settings.effect} disabled={running} onChange={e => update("effect", e.target.value)} /></label>
        <label>{m.residual}<input type="number" min="1" max="60" step="1" value={settings.residualSD} disabled={running} onChange={e => update("residualSD", e.target.value)} /></label>
        {!valid && <p role="alert" className="se-invalid">{m.invalid}</p>}
        <p className="se-small">{m.resetOnEdit}</p>
        <div className="se-fixed"><strong>{m.fixed}</strong><p>{m.baseline}</p><dl aria-label={m.parameters}>{CENTER_EFFECTS.map((effect, i) => <div key={i}><dt>{String.fromCharCode(65 + i)}</dt><dd>{effect > 0 ? "+" : ""}{effect}</dd></div>)}</dl><p className="se-small">{m.fixedHint}</p></div>
        <details><summary>{m.options}</summary><p>{m.seed}: <output data-role="seed">{seed}</output></p><p className="se-small">{m.replay}</p>
          <button onClick={() => { const next = randomSeed(); setSeed(next); reset("resetStatus", next); }}>{m.newSeed}</button>
          <label className="se-checkbox"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} />{m.reduce}</label>
          <button onClick={() => { setSettings(defaults); setConfiguration(DEFAULT_CONFIGURATION); setSelected("treatment"); setSeed(INITIAL_SEED); reset("ready", INITIAL_SEED); }}>{m.defaults}</button>
        </details>
      </aside>
      <div className="se-main">
        <section className="se-panel se-toolbar">
          <div className="se-model"><label htmlFor="se-model">{m.model}</label><select id="se-model" value={selected} onChange={e => setSelected(e.target.value as AnalysisKey)}><option value="treatment">{m.treatment}</option><option value="center">{m.center}</option></select><p className="se-small">{m.paired}</p></div>
          <div className="se-run-controls"><div className="se-buttons"><button disabled={!valid || running || atLimit} onClick={() => void run(1)}>{m.runOne}</button><button className="se-primary" disabled={!valid || running || atLimit} onClick={() => void run(BATCH_SIZE)}>{m.batch}</button>{running ? <button onClick={stop}>{m.stop}</button> : <button onClick={() => reset()}>{m.reset}</button>}</div>
          <p className="se-count">{m.completed}: <strong data-role="completed">{formatNumber(results.length, locale, 0)}</strong></p></div>
        </section>
        <div className="se-status-row"><p role="status">{m[status]}</p>{running && <progress max="1" value={progress} aria-label={m.running} />}</div>
        <section className="se-panel se-latest" aria-labelledby="se-latest-title" data-stage={stage}>
          <h2 id="se-latest-title">{m.latest}</h2>
          {latest && fitted ? <>
            <p className="se-small">{m.latestHint}</p>
            <p className="se-scroll-hint">{m.scroll}</p>
            <DatasetChart dataset={latest} locale={locale} reveal={reveal} selected={selected} />
            <p className={`se-dataset-step ${stage === "transfer" ? "se-transferring" : ""}`} aria-live="polite">
              {m[stage === "points" ? "showPoints" : stage === "means" ? "showMeans" : stage === "difference" ? "showDifference" : stage === "transfer" ? "addEstimate" : "estimateAdded"]}
            </p>
            {stage === "complete" && <details className="se-fit"><summary>{m.fitResults}</summary><dl className="se-metrics se-fit-metrics">
              <div><dt>{m.latestEstimate}</dt><dd data-role="latest-estimate">{f(fitted.estimate)} m</dd></div>
              <div><dt>{m.latestSE}</dt><dd data-role="latest-se">{f(fitted.se)} m</dd></div>
              <div><dt>{m.latestSD}</dt><dd>{f(fitted.residualSD)} m</dd></div>
              <div><dt>{m.df}</dt><dd>{fitted.df}</dd></div>
            </dl></details>}
          </> : <p className="se-latest-empty">{m.latestEmpty}</p>}
        </section>
        <div className="se-results">
          <section className="se-panel se-distribution"><h2>{m.distribution}</h2><p className="se-small">{m.distributionHint}</p>
            <div className="se-legend"><span><i className="se-truth-key" />{m.truth}</span><span><i className="se-average-key" />{m.average}</span>{results.length > 0 && <span><i className="se-latest-key" />{m.latestMarker}</span>}</div>
            <p className="se-scroll-hint">{m.scroll}</p><SamplingChart results={results} selected={selected} configuration={configuration} locale={locale} />
            <dl className="se-metrics"><div><dt>{m.truth}</dt><dd>{f(configuration.effect)} <small>m</small></dd></div><div><dt>{m.average}</dt><dd data-role="mean">{f(summary.mean)} <small>m</small></dd></div><div><dt>{m.bias}</dt><dd data-role="bias">{f(summary.bias)} <small>m</small></dd></div></dl>
          </section>
          <section className="se-panel se-uncertainty"><h2>{m.uncertainty}</h2>
            <div className="se-legend se-box-legend"><span><i className="se-box-key" />{m.reportedDistribution}</span>{comparisonReady && <span><i className="se-empirical-key" />{m.empirical}</span>}</div>
            <SEBoxPlot results={results} selected={selected} empiricalSE={empiricalSE} locale={locale} />
            <p className="se-small">{m.boxHint}</p>
            <div className="se-se-summaries">
              {(["empirical", "reported"] as const).filter(key => key === "reported" || comparisonReady).map(key => <div className="se-measure" key={key}>
                <h3>{m[key]}</h3><strong data-role={key}>{f(key === "empirical" ? empiricalSE : summary.reportedSE)} <small>m</small></strong>
              </div>)}
            </div>
            {comparisonReady && <p className="se-ratio">{m.ratio} <strong data-role="ratio">{f(ratio)}</strong></p>}
            <p className="se-small">{comparisonReady ? m.interpretation : m.minimum.replace("{count}", formatNumber(MIN_CALIBRATION_DATASETS, locale, 0))}</p>
            <details><summary>{m.comparisonDetails}</summary><p className="se-small">{m.boxExplanation}</p><p className="se-small">{m.sampling} {m.meanSEExplanation}</p></details>
          </section>
        </div>

      </div>
    </div>
  </main>;
}
