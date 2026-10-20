import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { createRng, randomSeed } from "../../domain/rng";
import { formatNumber, useLocale } from "../../i18n/LocaleContext";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { HospitalChart, IntervalChart, SamplingChart, TreatmentBoxPlots } from "./Charts";
import { clusterMessages } from "./messages";
import { DEFAULT_CONFIGURATION, MAX_TRIALS, simulateTrial, summariseTrial, trueEffect, validateConfiguration, varianceComponents,
  type Configuration, type Trial, type TrialSummary } from "./model";
import "./cluster-randomization.css";

const INITIAL_SEED = 42;
const INITIAL_SETTINGS = { hypothesis: "h0" as "h0" | "h1", totalSD: "12", icc: "0.3", alternativeEffect: "-5" };
type Settings = typeof INITIAL_SETTINGS;
type Status = "initial" | "sampling" | "complete" | "changed" | "resetStatus" | "limit" | "unavailable";

function toConfiguration(settings: Settings): Configuration {
  return { hypothesis: settings.hypothesis, totalSD: Number(settings.totalSD), icc: Number(settings.icc), alternativeEffect: Number(settings.alternativeEffect) };
}

export default function ClusterRandomizationPage() {
  const { locale } = useLocale();
  const m = clusterMessages[locale];
  const f = (value: number, digits = 2) => formatNumber(value, locale, digits, digits);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const valid = [settings.totalSD, settings.icc, settings.alternativeEffect].every((value) => value.trim() !== "")
    && validateConfiguration(toConfiguration(settings));
  const [configuration, setConfiguration] = useState(DEFAULT_CONFIGURATION);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [results, setResults] = useState<TrialSummary[]>([]);
  const [progress, setProgress] = useState(1);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>("initial");
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const rng = useRef(createRng(INITIAL_SEED));
  const count = useRef(0);
  const busy = useRef(false);
  const options = useRef({ speed, reducedMotion });
  options.current = { speed, reducedMotion };
  const [runtime] = useState(() => new AnimationRuntime({ speed: () => options.current.speed, reducedMotion: () => options.current.reducedMotion }));

  useEffect(() => () => runtime.cancel(), [runtime]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const totals = useMemo(() => results.reduce((sum, result) => ({
    ordinary: sum.ordinary + Number(result.ordinaryRejected), mixed: sum.mixed + Number(result.mixedRejected),
    ordinaryCovered: sum.ordinaryCovered + Number(result.ordinaryCovered), mixedCovered: sum.mixedCovered + Number(result.mixedCovered),
  }), { ordinary: 0, mixed: 0, ordinaryCovered: 0, mixedCovered: 0 }), [results]);
  const variances = varianceComponents(configuration);
  const completedTrial = progress === 1 ? trial : null;
  const rateLabel = configuration.hypothesis === "h0" ? m.typeI : m.power;
  const percent = (n: number) => results.length ? `${f(100 * n / results.length, 1)}%` : "—";
  const pValue = (value: number) => value < 0.001 ? `< ${f(0.001, 3)}` : f(value, 3);

  function clear(nextStatus: Status, nextSeed = seed) {
    runtime.cancel();
    busy.current = false; count.current = 0; rng.current = createRng(nextSeed);
    setResults([]); setTrial(null); setProgress(1); setRunning(false); setStatus(nextStatus);
  }

  function changeSetting<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
    const next = { ...settings, [key]: value };
    if (key === "hypothesis" && value === "h0"
      && (!Number.isFinite(Number(next.alternativeEffect)) || Math.abs(Number(next.alternativeEffect)) < 0.5 || Math.abs(Number(next.alternativeEffect)) > 30)) {
      next.alternativeEffect = INITIAL_SETTINGS.alternativeEffect;
    }
    setSettings(next);
    const proposed = toConfiguration(next);
    if (validateConfiguration(proposed)) setConfiguration(proposed);
    clear("changed");
  }

  function resetDefaults() {
    setSettings(INITIAL_SETTINGS); setConfiguration(DEFAULT_CONFIGURATION); setSeed(INITIAL_SEED); setSpeed(1);
    clear("initial", INITIAL_SEED);
  }

  async function run(amount: number, animate: boolean) {
    if (!valid || busy.current || count.current >= MAX_TRIALS) return;
    busy.current = true; setRunning(true);
    const token = runtime.beginRun();
    const allowed = Math.min(amount, MAX_TRIALS - count.current);
    try {
      if (animate) {
        const next = simulateTrial(configuration, rng.current);
        setTrial(next); setProgress(0); setStatus("sampling");
        await runtime.tween(1250, token, setProgress);
        if (!runtime.isCurrent(token)) return;
        count.current += 1;
        setResults((previous) => [...previous, summariseTrial(next, trueEffect(configuration))]);
      } else {
        const batch: TrialSummary[] = [];
        let last: Trial | null = null;
        for (let offset = 0; offset < allowed; offset += 100) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          await runtime.delay(1, token);
          if (!runtime.isCurrent(token)) return;
          for (let i = 0; i < Math.min(100, allowed - offset); i += 1) {
            last = simulateTrial(configuration, rng.current);
            batch.push(summariseTrial(last, trueEffect(configuration)));
          }
        }
        if (!runtime.isCurrent(token)) return;
        count.current += batch.length;
        setTrial(last); setProgress(1); setResults((previous) => [...previous, ...batch]);
      }
      if (runtime.isCurrent(token)) setStatus(count.current >= MAX_TRIALS ? "limit" : "complete");
    } finally {
      if (runtime.isCurrent(token)) { busy.current = false; setRunning(false); }
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { setStatus("unavailable"); }
  }

  const atLimit = results.length >= MAX_TRIALS;
  return <main className="cluster-exploration" ref={rootRef} data-reduced-motion={reducedMotion}>
    <header className="cluster-header">
      <a href="#/themes/clustered-data" aria-label={m.back}>← {m.theme}</a>
      <div><p className="eyebrow">{m.eyebrow}</p><h1>{m.title}</h1><p>{m.subtitle}</p></div>
      <div className="cluster-header-actions"><LanguageSelector /><button type="button" onClick={toggleFullscreen}>{fullscreen ? m.exitPresentation : m.presentation}</button></div>
    </header>
    <div className="cluster-workspace">
      <aside className="cluster-controls" aria-label={m.model}>
        <div><h2>{m.model}</h2><p className="cluster-design">{m.design}</p><p className="cluster-hint">{m.allocation}</p></div>
        <label><span>{m.hypothesis}</span><select value={settings.hypothesis} onChange={(event) => changeSetting("hypothesis", event.target.value as "h0" | "h1")}>
          <option value="h0">{m.h0}</option><option value="h1">{m.h1}</option>
        </select></label>
        <label htmlFor="cluster-icc-input"><span>{m.icc} <output aria-hidden="true" data-role="cluster-icc">{f(Number(settings.icc), 2)}</output></span>
          <input id="cluster-icc-input" type="range" min="0.1" max="0.9" step="0.05" value={settings.icc} onChange={(event) => changeSetting("icc", event.target.value)} />
        </label>
        <label><span>{m.totalSD}</span><input type="number" min="1" max="40" step="1" value={settings.totalSD} onChange={(event) => changeSetting("totalSD", event.target.value)} /></label>
        <p className="cluster-hint">{m.sdHint}</p>
        <div className="cluster-variance-components">
          <div className="cluster-variance-bar" aria-hidden="true"><span style={{ width: `${configuration.icc * 100}%` }} /><span style={{ width: `${(1 - configuration.icc) * 100}%` }} /></div>
          <dl><div><dt>{m.betweenSD}</dt><dd data-role="cluster-between-sd">{f(Math.sqrt(variances.hospital))}</dd></div>
            <div><dt>{m.withinSD}</dt><dd data-role="cluster-within-sd">{f(Math.sqrt(variances.residual))}</dd></div></dl>
        </div>
        <label><span>{m.effect}</span><input type="number" min="-30" max="30" step="0.5" value={settings.alternativeEffect}
          disabled={settings.hypothesis === "h0"} onChange={(event) => changeSetting("alternativeEffect", event.target.value)} /></label>
        {!valid && <p className="cluster-validation" role="alert">{m.validation}</p>}
        <div className="cluster-actions">
          <button type="button" disabled={!valid || running || atLimit} onClick={() => void run(1000, false)}>{m.batch}</button>
          <button type="button" onClick={() => clear("resetStatus")}>{m.reset}</button>
        </div>
        <p className="cluster-hint">{m.resetHint}</p>
        <details><summary>{m.options}</summary><div className="cluster-options">
          <label className="cluster-checkbox"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />{m.reduced}</label>
          <label><span>{m.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="1">{m.normal}</option><option value="2.5">{m.fast}</option></select></label>
          <p className="cluster-hint">{m.seed}: <output>{seed}</output></p>
          <button type="button" onClick={() => { const next = randomSeed(); setSeed(next); clear("resetStatus", next); }}>{m.newSeed}</button>
          <button type="button" onClick={resetDefaults}>{m.defaults}</button>
        </div></details>
      </aside>

      <div className="cluster-main">
        <p className="cluster-status" role="status">{m[status]}</p>
        <section className="cluster-panel cluster-data-panel" aria-labelledby="cluster-data-title">
          <div className="cluster-panel-heading"><h2 id="cluster-data-title">{m.dataTitle}</h2>
            <button className="cluster-run-button" type="button" disabled={!valid || running || atLimit} onClick={() => void run(1, true)}>{m.draw}</button>
          </div><p className="cluster-description">{m.dataDescription}</p>
          <div className="cluster-legend"><span><i className="control" />{m.control}</span><span><i className="intervention" />{m.intervention}</span><span><i className="mean" />{m.observedMean}</span></div>
          <p className="cluster-scroll-hint">{m.scrollHint}</p>
          <div className="cluster-trial-display">
            <HospitalChart configuration={configuration} trial={trial} progress={progress} locale={locale} />
            <section className="cluster-treatment-summary" aria-labelledby="cluster-group-summary-title">
              <h3 id="cluster-group-summary-title">{m.groupSummary}</h3><p className="cluster-hint">{m.pooledPatients}</p>
              <TreatmentBoxPlots configuration={configuration} trial={trial} progress={progress} locale={locale} />
              <p className="cluster-hint">{m.boxplotKey}</p>
            </section>
          </div>
          {!trial && <p className="cluster-caption">{m.emptyData}</p>}
        </section>

        <section className="cluster-panel" aria-labelledby="cluster-analysis-title">
          <h2 id="cluster-analysis-title">{m.analysisTitle}</h2><p className="cluster-description">{m.analysisDescription}</p>
          {completedTrial ? <>
            <IntervalChart trial={completedTrial} locale={locale} />
            <div className="cluster-analysis-grid">{(["ordinary", "mixed"] as const).map((key) => {
              const analysis = completedTrial[key];
              return <article key={key} className={`cluster-analysis-card ${key}`} data-analysis={key}>
                <h3>{m[key]}</h3><p className="cluster-hint">{m[key === "ordinary" ? "ordinaryDetail" : "mixedDetail"]}</p>
                <p className={`cluster-decision ${analysis.rejected ? "rejected" : "retained"}`} data-role={`${key}-decision`}>{analysis.rejected ? m.reject : m.retain}</p>
                <dl><div><dt>{m.estimate}</dt><dd data-role={`${key}-estimate`}>{f(analysis.estimate)}</dd></div>
                  <div><dt>{m.se}</dt><dd data-role={`${key}-se`}>{f(analysis.se)}</dd></div>
                  <div><dt>{m.df}</dt><dd>{analysis.df}</dd></div>
                  <div><dt>{m.interval}</dt><dd data-role={`${key}-interval`}>[{f(analysis.low)}{locale === "nl" ? "; " : ", "}{f(analysis.high)}]</dd></div>
                  <div><dt>{m.pValue}</dt><dd>{pValue(analysis.pValue)}</dd></div></dl>
              </article>;
            })}</div>
          </> : <p className="cluster-empty">{m.emptyAnalysis}</p>}
          <details className="cluster-methods"><summary>{m.methods}</summary><p>{m.generatingModel}</p><p>{m.methodDescription}</p><p>{m.boxplotWhiskers}</p>
            {completedTrial && <><p>{m.fittedBetweenSD}: {f(Math.sqrt(completedTrial.hospitalVariance))} · {m.fittedWithinSD}: {f(Math.sqrt(completedTrial.residualVariance))}</p>
              {completedTrial.boundaryFit && <p>{m.boundary}</p>}</>}
          </details>
        </section>

        <section className="cluster-panel" aria-labelledby="cluster-repeats-title">
          <div className="cluster-panel-heading"><h2 id="cluster-repeats-title">{m.repeatsTitle}</h2><p className="cluster-count">{m.completed}: <strong data-role="cluster-count">{formatNumber(results.length, locale, 0)}</strong></p></div>
          <p className="cluster-description">{m.repeatsDescription}</p>
          <p className="cluster-target">{m.target}</p>
          <div className="cluster-rate-grid">{(["ordinary", "mixed"] as const).map((key) => <article key={key} className={`cluster-rate-card ${key}`}>
            <h3>{m[key]}</h3><p>{rateLabel}</p><strong data-role={`${key}-rate`}>{percent(totals[key])}</strong>
            <p>{m.rejected}: {formatNumber(totals[key], locale, 0)} / {formatNumber(results.length, locale, 0)}</p>
            <p>{m.coverage}: <span data-role={`${key}-coverage`}>{percent(totals[key === "ordinary" ? "ordinaryCovered" : "mixedCovered"])}</span></p>
          </article>)}</div>
          {configuration.hypothesis === "h1" && <p className="cluster-caption">{m.powerNote}</p>}
          <h3 className="cluster-histogram-heading">{m.histogramTitle}</h3><p className="cluster-description">{m.histogramDescription}</p>
          <SamplingChart results={results} configuration={configuration} locale={locale} />
          <p className="cluster-caption">{m.trueEffect}: {f(trueEffect(configuration), 1)} mmHg · {m.latest}: {results.length ? f(results[results.length - 1].estimate) : "—"} mmHg</p>
          <p className="cluster-caption">{results.length ? m.monteCarlo : m.emptyRepeats}</p>
        </section>
      </div>
    </div>
  </main>;
}
