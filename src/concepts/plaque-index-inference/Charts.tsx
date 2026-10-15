import { memo, useEffect, useRef, useState } from "react";
import { normalDensity } from "../../domain/distributions/normal";
import { studentTDensity } from "../../domain/distributions/studentT";
import { formatNumber, type Locale } from "../../i18n/LocaleContext";
import { CONTROL_MEAN, histogram, populationDomain, theoreticalSe, trueDifference, type Configuration, type Estimate, type Experiment } from "./model";
import { plaqueMessages } from "./messages";

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function pathFor(domain: [number, number], x: (value: number) => number, y: (value: number) => number, density: (value: number) => number) {
  return Array.from({ length: 241 }, (_, i) => {
    const value = domain[0] + i * (domain[1] - domain[0]) / 240;
    return `${i ? "L" : "M"}${x(value).toFixed(2)},${y(density(value)).toFixed(2)}`;
  }).join(" ");
}

function Axis({ domain, width, y, label, locale }: { domain: [number, number]; width: number; y: number; label: string; locale: Locale }) {
  const left = 46, right = width - 20;
  const targetStep = (domain[1] - domain[0]) / (width < 420 ? 3 : 5);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const step = [1, 2, 2.5, 5, 10].map((value) => value * magnitude).find((value) => value >= targetStep)!;
  const ticks: number[] = [];
  for (let value = Math.ceil(domain[0] / step) * step; value <= domain[1] + step * 1e-8; value += step) ticks.push(value);
  const lines: string[] = [""];
  for (const word of label.split(" ")) {
    const last = lines.length - 1;
    if (lines[last] && (lines[last] + " " + word).length * 8.5 > width - 28) lines.push(word);
    else lines[last] = [lines[last], word].filter(Boolean).join(" ");
  }
  return <g className="plaque-axis">
    <line x1={left} x2={right} y1={y} y2={y} />
    {ticks.map((value, index) => {
      const x = left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
      return <g key={index}><line x1={x} x2={x} y1={y} y2={y + 5} /><text x={x} y={y + 25} textAnchor="middle">{formatNumber(Math.abs(value) < step * 1e-8 ? 0 : value, locale, 2)}</text></g>;
    })}
    <text textAnchor="middle" className="plaque-axis-title">{lines.map((line, index) => <tspan key={index} x={width / 2} y={y + 50 + index * 20}>{line}</tspan>)}</text>
  </g>;
}

function PopulationGroup({ configuration, latest, locale, group, domain, progress }: {
  configuration: Configuration; latest: Experiment | null; locale: Locale;
  group: "control" | "treatment"; domain: [number, number]; progress: number;
}) {
  const { ref, width } = useWidth();
  const m = plaqueMessages[locale];
  const populationMean = group === "control" ? CONTROL_MEAN : CONTROL_MEAN - trueDifference(configuration);
  const sample = latest?.[group];
  const sampleMean = group === "control" ? latest?.controlMean : latest?.treatmentMean;
  const name = group === "control" ? m.control : m.treatment;
  const x = (v: number) => 46 + (width - 66) * (v - domain[0]) / (domain[1] - domain[0]);
  const distribution = { mean: populationMean, sd: configuration.sd };
  const y = (density: number) => 120 - density * 82 * configuration.sd * Math.sqrt(2 * Math.PI);
  return <section className={`plaque-population-group ${group}`}>
    <h3>{name}</h3>
    <div ref={ref} className="plaque-chart-wrap"><svg className="plaque-population-chart" viewBox={`0 0 ${width} 390`} role="img" aria-label={`${name}: ${m.population} → ${m.sample}`}>
      <rect className="plaque-population-cell" data-group={group} x={1} y={1} width={width - 2} height={193} rx={12} />
      <rect className="plaque-sample-cell" data-group={group} x={1} y={220} width={width - 2} height={169} rx={12} />
      <g className="plaque-population-plot">
        <text x={18} y={25} className="plaque-group-label">{m.population}</text>
        <path className="plaque-population-curve" d={pathFor(domain, x, y, (value) => normalDensity(value, distribution))} />
        <line className="plaque-mean-reference" x1={x(populationMean)} x2={x(populationMean)} y1={36} y2={120} />
        <Axis domain={domain} width={width} y={120} label={m.outcome} locale={locale} />
      </g>
      <g className="plaque-sample-plot">
        <text x={18} y={246} className="plaque-group-label">{m.sample} · n = {configuration.sampleSize}</text>
        <Axis domain={domain} width={width} y={300} label={m.outcome} locale={locale} />
        {sampleMean !== undefined && progress === 1 && <>
          <path className="plaque-sample-mean" d={`M${x(sampleMean) - 6},297 l6,-9 l6,9 Z`} />
          <text x={width / 2} y={376} textAnchor="middle" className="plaque-sample-label">{m.sampleMean}: {formatNumber(sampleMean, locale, 2, 2)}</text>
        </>}
      </g>
      {sample?.map((value, index) => {
        const origin = y(normalDensity(value, distribution));
        const target = 279 + ((index * 7 % 5) - 2) * 3.5;
        const stagger = Math.min(index * 0.012, 0.18);
        const fraction = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)));
        const eased = fraction * fraction * (3 - 2 * fraction);
        return <g key={index}>
          <circle className="plaque-source-point" cx={x(value)} cy={origin} r={3} opacity={progress > 0 ? 0.3 : 0} />
          <circle className="plaque-patient" data-group={group} data-origin-y={origin} data-target-y={target}
            cx={x(value)} cy={origin + (target - origin) * eased} r={4}>
            <title>{formatNumber(value, locale, 3)}</title>
          </circle>
        </g>;
      })}
    </svg></div>
  </section>;
}

export function PopulationChart({ configuration, latest, locale, progress }: {
  configuration: Configuration; latest: Experiment | null; locale: Locale; progress: number;
}) {
  const domain = populationDomain(configuration, latest);
  return <div className="plaque-population-grid">
    {(["control", "treatment"] as const).map((group) => <PopulationGroup key={group}
      configuration={configuration} latest={latest} locale={locale} group={group} domain={domain} progress={progress} />)}
  </div>;
}

export const DistributionChart = memo(function DistributionChart({ kind, configuration, estimates, critical, locale }: {
  kind: "difference" | "t"; configuration: Configuration; estimates: readonly Estimate[]; critical: number; locale: Locale;
}) {
  const { ref, width } = useWidth();
  const m = plaqueMessages[locale];
  const values = estimates.map((result) => result[kind]);
  const se = theoreticalSe(configuration);
  const effect = trueDifference(configuration);
  // The minimum range stays fixed when SD or n changes, making narrowing visible.
  const defaultDomain: [number, number] = kind === "t" ? [-5, Math.max(5, effect / se + 5)] : [Math.min(-1.2, effect - 4 * se), Math.max(1.2, effect + 4 * se)];
  let low = defaultDomain[0], high = defaultDomain[1];
  for (const value of values) { low = Math.min(low, value); high = Math.max(high, value); }
  const domain: [number, number] = [low, high];
  const x = (value: number) => 46 + (width - 66) * (value - low) / (high - low);
  const density = kind === "t"
    ? (value: number) => studentTDensity(value, 2 * configuration.sampleSize - 2)
    : (value: number) => normalDensity(value, { mean: effect, sd: se });
  const bars = histogram(values, domain);
  const referencePeak = density(kind === "t" ? 0 : effect);
  const ymax = Math.max(referencePeak * 1.15, ...bars.map((bar) => bar.density * 1.15));
  const y = (value: number) => 193 - 152 * value / ymax;
  const latest = values[values.length - 1];
  const latestText = latest === undefined ? "" : formatNumber(latest, locale, 3, 3);
  const labelWidth = Math.max(64, latestText.length * 10 + 16);
  const labelX = latest === undefined ? 0 : Math.max(46 + labelWidth / 2, Math.min(width - 20 - labelWidth / 2, x(latest)));
  return <div ref={ref} className="plaque-chart-wrap"><svg viewBox={`0 0 ${width} 280`} className="plaque-distribution-chart" role="img"
    aria-label={kind === "t" ? m.tDistribution : m.differenceDistribution} data-chart={kind} data-count={values.length}>
    {kind === "t" && <g className="plaque-rejection-regions">
      <rect x={x(low)} y={32} width={x(-critical) - x(low)} height={161} />
      <rect x={x(critical)} y={32} width={x(high) - x(critical)} height={161} />
    </g>}
    <text className="plaque-density-label" x={46} y={16}>{m.density}</text>
    {bars.filter((bar) => bar.count > 0).map((bar, index) => <rect className={`plaque-histogram-bar ${kind}`} key={index}
      x={x(bar.low) + 0.5} width={Math.max(0, x(bar.high) - x(bar.low) - 1)} y={y(bar.density)} height={193 - y(bar.density)}
      data-bin-count={bar.count}><title>{formatNumber(bar.low, locale, 2)} – {formatNumber(bar.high, locale, 2)}: {bar.count}</title></rect>)}
    <path className="plaque-reference-curve" d={pathFor(domain, x, y, density)} />
    {kind === "t" && [-critical, critical].map((value) => <g key={value}>
      <line className="plaque-critical-line" x1={x(value)} x2={x(value)} y1={32} y2={193} />
      {x(critical) - x(-critical) > 110 && <text className="plaque-critical-label" x={x(value)} y={36} textAnchor="middle">{formatNumber(value, locale, 2)}</text>}
    </g>)}
    <line className="plaque-zero-line" x1={x(0)} x2={x(0)} y1={35} y2={193} />
    {latest !== undefined && <g className="plaque-latest-result">
      <title>{m.latestResult}: {latestText}</title>
      <line className="plaque-marker-link" x1={labelX} x2={x(latest)} y1={174} y2={179} />
      <rect className="plaque-marker-label-background" x={labelX - labelWidth / 2} y={146} width={labelWidth} height={28} rx={7} />
      <text className="plaque-marker-label" x={labelX} y={165} textAnchor="middle" data-role={`plaque-latest-${kind}`}>{latestText}</text>
      <circle className="plaque-latest-marker" data-value={latest} cx={x(latest)} cy={185} r={6} />
    </g>}
    <Axis domain={domain} width={width} y={193} label={kind === "t" ? m.tAxis : m.differenceAxis} locale={locale} />
  </svg></div>;
});
