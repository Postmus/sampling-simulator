import { memo, useEffect, useRef, useState } from "react";
import { formatNumber, type Locale } from "../../i18n/LocaleContext";
import { clusterMessages } from "./messages";
import { HOSPITALS, PATIENTS_PER_HOSPITAL, boxPlotSummary, histogram, outcomeDomain, paddedDomain, trueEffect, type Configuration, type Trial, type TrialSummary } from "./model";

export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function Axis({ domain, left, right, y, label, locale }: {
  domain: [number, number]; left: number; right: number; y: number; label: string; locale: Locale;
}) {
  const target = (domain[1] - domain[0]) / Math.max(3, Math.floor((right - left) / 100));
  const exponent = Math.floor(Math.log10(target));
  const magnitude = 10 ** exponent;
  const factor = [1, 2, 2.5, 5, 10].reverse().find((value) => value * magnitude <= target)!;
  const step = factor * magnitude;
  const digits = Math.max(0, -exponent + (factor === 2.5 ? 1 : 0));
  const ticks: number[] = [];
  for (let value = Math.ceil(domain[0] / step) * step; value <= domain[1] + step * 1e-8; value += step) ticks.push(value);
  return <g className="cluster-axis">
    <line x1={left} x2={right} y1={y} y2={y} />
    {ticks.map((value) => {
      const x = left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
      return <g key={value}><line x1={x} x2={x} y1={y} y2={y + 6} />
        <text x={x} y={y + 27} textAnchor="middle">{formatNumber(Math.abs(value) < step * 1e-8 ? 0 : value, locale, digits)}</text></g>;
    })}
    <text className="cluster-axis-label" x={(left + right) / 2} y={y + 54} textAnchor="middle">{label}</text>
  </g>;
}

export function HospitalChart({ configuration, trial, progress, locale }: {
  configuration: Configuration; trial: Trial | null; progress: number; locale: Locale;
}) {
  const { ref, width } = useChartWidth();
  const m = clusterMessages[locale];
  const domain = outcomeDomain(configuration, trial);
  const left = 150, right = width - 28;
  const x = (value: number) => left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
  return <div className="cluster-chart-scroll cluster-hospital-chart" tabIndex={0} role="region" aria-label={m.plotAria}><div className="cluster-chart" ref={ref}>
    <svg viewBox={`0 0 ${width} 440`} role="img" aria-label={m.plotAria} data-chart="hospitals" data-axis-min={domain[0]} data-axis-max={domain[1]}>
      {Array.from({ length: HOSPITALS }, (_, id) => {
        const hospital = trial?.hospitals[id];
        const y = 52 + id * 57;
        return <g key={id} data-hospital={id + 1} data-treatment={hospital ? (hospital.treated ? "intervention" : "control") : "unassigned"}>
          <rect className="cluster-row" x={0} y={y - 25} width={width} height={51} rx={8} />
          <text className="cluster-hospital-label" x={12} y={hospital ? y - 4 : y + 5}>{m.hospital} {id + 1}</text>
          {hospital && <text className={`cluster-arm-label ${hospital.treated ? "intervention" : "control"}`} x={12} y={y + 17}>{hospital.treated ? m.intervention : m.control}</text>}
          <line className="cluster-row-guide" x1={left} x2={right} y1={y} y2={y} />
          {hospital?.outcomes.map((outcome, index) => {
            const fraction = Math.max(0, Math.min(1, progress * (HOSPITALS * PATIENTS_PER_HOSPITAL + 12) - (id * PATIENTS_PER_HOSPITAL + index)));
            const jitter = Math.sin((id + 1) * 41 + index * 17.3) * 14;
            return <circle key={index} className={`cluster-patient ${hospital.treated ? "intervention" : "control"}`} cx={x(outcome)} cy={y + jitter}
              r={4.5} opacity={fraction * 0.82} data-outcome={outcome}>
              <title>{m.hospital} {id + 1}, {m.patient} {index + 1}: {formatNumber(outcome, locale, 1)} mmHg</title>
            </circle>;
          })}
          {hospital && progress === 1 && <path className="cluster-hospital-mean" d={`M${x(hospital.sampleMean)},${y - 8} l8,8 l-8,8 l-8,-8 Z`}>
            <title>{m.hospitalMean}: {formatNumber(hospital.sampleMean, locale, 2)} mmHg</title>
          </path>}
        </g>;
      })}
      <Axis domain={domain} left={left} right={right} y={375} label={m.outcome} locale={locale} />
    </svg>
  </div></div>;
}

export function TreatmentBoxPlots({ configuration, trial, progress, locale }: {
  configuration: Configuration; trial: Trial | null; progress: number; locale: Locale;
}) {
  const groups = {
    control: progress === 1 ? trial?.hospitals.filter((hospital) => !hospital.treated).flatMap((hospital) => hospital.outcomes) ?? [] : [],
    intervention: progress === 1 ? trial?.hospitals.filter((hospital) => hospital.treated).flatMap((hospital) => hospital.outcomes) ?? [] : [],
  };
  return <GroupBoxPlots groups={groups} domain={outcomeDomain(configuration, trial)} locale={locale} />;
}

export function GroupBoxPlots({ groups, domain, locale, axisLabel, ariaLabel }: {
  groups: { control: readonly number[]; intervention: readonly number[] }; domain: [number, number]; locale: Locale;
  axisLabel?: string; ariaLabel?: string;
}) {
  const { ref, width } = useChartWidth();
  const m = clusterMessages[locale];
  const left = 20, right = width - 20;
  const x = (value: number) => left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
  return <div className="cluster-chart-scroll cluster-boxplot-chart" tabIndex={0} role="region" aria-label={ariaLabel ?? m.boxplotAria}><div className="cluster-chart" ref={ref}>
    <svg viewBox={`0 0 ${width} 240`} role="img" aria-label={ariaLabel ?? m.boxplotAria} data-chart="boxplots" data-axis-min={domain[0]} data-axis-max={domain[1]}>
      {[false, true].map((treated, index) => {
        const group = treated ? "intervention" : "control";
        const values = groups[group];
        const summary = boxPlotSummary(values);
        const y = 64 + index * 76;
        return <g key={group} className={`cluster-boxplot ${group}`} data-boxplot={group} data-count={values.length}
          data-mean={summary?.mean} data-median={summary?.median}>
          <text className={`cluster-arm-label ${group}`} x={left} y={y - 26}>{m[group]}{summary ? ` · n = ${summary.n}` : ""}</text>
          {summary && <>
            <title>{m[group]}: {m.median} {formatNumber(summary.median, locale, 2)}; {m.groupMean} {formatNumber(summary.mean, locale, 2)} mmHg</title>
            <line className="cluster-boxplot-whisker" x1={x(summary.low)} x2={x(summary.high)} y1={y} y2={y} />
            {[summary.low, summary.high].map((value, endpoint) => <line key={endpoint} className="cluster-boxplot-whisker" x1={x(value)} x2={x(value)} y1={y - 9} y2={y + 9} />)}
            <rect className="cluster-boxplot-box" x={x(summary.q1)} y={y - 16} width={x(summary.q3) - x(summary.q1)} height={32} />
            <line className="cluster-boxplot-median" x1={x(summary.median)} x2={x(summary.median)} y1={y - 16} y2={y + 16} />
            {summary.outliers.map((value, outlier) => <circle className="cluster-boxplot-outlier" key={outlier} cx={x(value)} cy={y} r={3}>
              <title>{m.outlier}: {formatNumber(value, locale, 2)} mmHg</title>
            </circle>)}
            <path className="cluster-group-mean" d={`M${x(summary.mean)},${y - 6} l6,6 l-6,6 l-6,-6 Z`}>
              <title>{m.groupMean}: {formatNumber(summary.mean, locale, 2)} mmHg</title>
            </path>
          </>}
        </g>;
      })}
      <Axis domain={domain} left={left} right={right} y={178} label={axisLabel ?? m.boxplotOutcome} locale={locale} />
    </svg>
  </div></div>;
}

export function IntervalChart({ trial, locale }: { trial: Pick<Trial, "ordinary" | "mixed">; locale: Locale }) {
  const { ref, width } = useChartWidth();
  const m = clusterMessages[locale];
  const domain = paddedDomain([trial.ordinary.low, trial.ordinary.high, trial.mixed.low, trial.mixed.high], [0, 0]);
  const left = 255, right = width - 28;
  const x = (value: number) => left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
  return <div className="cluster-chart-scroll" tabIndex={0} role="region" aria-label={m.analysisAria}><div className="cluster-chart" ref={ref}>
    <svg viewBox={`0 0 ${width} 235`} role="img" aria-label={m.analysisAria} data-chart="intervals">
      <line className="cluster-zero-line" x1={x(0)} x2={x(0)} y1={14} y2={160}><title>{m.zero}</title></line>
      {(["ordinary", "mixed"] as const).map((key, index) => {
        const analysis = trial[key], y = 47 + index * 78;
        return <g key={key} className={`cluster-interval ${key}`} data-model={key} data-low={analysis.low} data-high={analysis.high}>
          <text x={12} y={y + 5} className="cluster-model-label">{m[key]}</text>
          <line x1={x(analysis.low)} x2={x(analysis.high)} y1={y} y2={y} />
          {[analysis.low, analysis.high].map((value, endpoint) => <line key={endpoint} x1={x(value)} x2={x(value)} y1={y - 7} y2={y + 7} />)}
          <circle cx={x(analysis.estimate)} cy={y} r={6} data-estimate={analysis.estimate} />
        </g>;
      })}
      <Axis domain={domain} left={left} right={right} y={170} label={m.effectAxis} locale={locale} />
    </svg>
  </div></div>;
}

export const SamplingChart = memo(function SamplingChart({ results, configuration, locale }: {
  results: readonly TrialSummary[]; configuration: Configuration; locale: Locale;
}) {
  const { ref, width } = useChartWidth();
  const m = clusterMessages[locale];
  const effect = trueEffect(configuration);
  const values = results.map((result) => result.estimate);
  const domain = paddedDomain(values, [Math.min(0, effect) - configuration.totalSD, Math.max(0, effect) + configuration.totalSD]);
  const left = 52, right = width - 28;
  const x = (value: number) => left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
  const bins = histogram(values, domain);
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const y = (count: number) => 210 - 165 * count / maxCount;
  const latest = values[values.length - 1];
  return <div className="cluster-chart-scroll" tabIndex={0} role="region" aria-label={m.histogramTitle}><div className="cluster-chart" ref={ref}>
    <svg viewBox={`0 0 ${width} 280`} role="img" aria-label={m.histogramTitle} data-chart="sampling" data-count={results.length}>
      <text className="cluster-axis-label" x={left} y={20}>{m.frequency}</text>
      {[0, Math.ceil(maxCount / 2), maxCount].filter((value, index, all) => all.indexOf(value) === index).map((count) => <g className="cluster-axis" key={count}>
        <line className="cluster-grid-line" x1={left} x2={right} y1={y(count)} y2={y(count)} />
        <text x={left - 10} y={y(count) + 5} textAnchor="end">{formatNumber(count, locale, 0)}</text>
      </g>)}
      {bins.filter((bin) => bin.count > 0).map((bin, index) => <rect key={index} className="cluster-histogram-bar" x={x(bin.low) + 0.5} y={y(bin.count)}
        width={Math.max(0, x(bin.high) - x(bin.low) - 1)} height={210 - y(bin.count)} data-bin-count={bin.count}>
        <title>{formatNumber(bin.low, locale, 1)} – {formatNumber(bin.high, locale, 1)}: {formatNumber(bin.count, locale, 0)}</title>
      </rect>)}
      <line className="cluster-truth-line" x1={x(effect)} x2={x(effect)} y1={32} y2={210}><title>{m.trueEffect}: {formatNumber(effect, locale, 1)}</title></line>
      {latest !== undefined && <circle className="cluster-latest" cx={x(latest)} cy={210} r={6} data-value={latest}>
        <title>{m.latest}: {formatNumber(latest, locale, 2)}</title>
      </circle>}
      <Axis domain={domain} left={left} right={right} y={210} label={m.effectAxis} locale={locale} />
    </svg>
  </div></div>;
});
