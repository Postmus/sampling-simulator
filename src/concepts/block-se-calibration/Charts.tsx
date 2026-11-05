import { useMemo } from "react";
import { formatNumber, type Locale } from "../../i18n/LocaleContext";
import { mean } from "../../domain/statistics";
import { CENTER_EFFECTS, histogram, reportedSEBox, type Configuration, type Dataset, type Result, type AnalysisKey } from "./model";
import { messages } from "./messages";

export function SamplingChart({ results, selected, configuration, locale }: {
  results: Result[]; selected: AnalysisKey; configuration: Configuration; locale: Locale;
}) {
  const m = messages[locale];
  const values = results.map(r => r[selected].estimate);
  const h = histogram(values, configuration.effect, configuration.residualSD);
  const x = (v: number) => 65 + (v - h.low) / (h.high - h.low) * 545;
  const top = 28, bottom = 240;
  const y = (v: number) => bottom - v / h.max * (bottom - top);
  return <div className="se-chart-scroll"><svg className="se-histogram" viewBox="0 0 640 310" role="img" aria-label={`${m.distribution}: ${results.length} ${m.completed}`} data-chart="sampling">
    <text x="65" y="19">{m.count}</text>
    {[0, Math.ceil(h.max / 2), h.max].map(n => <g key={n}><line x1="65" x2="610" y1={y(n)} y2={y(n)} className="se-gridline" />
      <text x="55" y={y(n) + 6} textAnchor="end">{formatNumber(n, locale, 0)}</text></g>)}
    {h.bins.map((n, i) => <rect key={i} x={65 + i * 545 / h.bins.length + 1} y={y(n)} width={545 / h.bins.length - 2} height={bottom - y(n)} className="se-bin" data-count={n} />)}
    {values.length > 0 && <line x1={x(configuration.effect)} x2={x(configuration.effect)} y1={top} y2={bottom} className="se-truth" />}
    {values.length > 0 && <line x1={x(mean(values))} x2={x(mean(values))} y1={top} y2={bottom} className="se-average" />}
    {values.length > 0 && <path key={values.length} className="se-latest-marker" data-latest-estimate={values[values.length - 1]}
      d={`M ${x(values[values.length - 1])} ${bottom - 8} l 7 8 -7 8 -7 -8 Z`}>
      <title>{m.latestMarker}: {formatNumber(values[values.length - 1], locale, 2, 2)} m</title>
    </path>}
    {[0, .25, .5, .75, 1].map(f => { const v = h.low + f * (h.high - h.low); return <text key={f} x={x(v)} y="267" textAnchor="middle">{formatNumber(v, locale, 1)}</text>; })}
    <text x="337" y="302" textAnchor="middle">{m.axis}</text>
    {!values.length && <text x="337" y="135" textAnchor="middle" className="se-empty-label">{m.empty}</text>}
  </svg></div>;
}

export interface DatasetReveal { points: number; means: number; difference: number }

export function DatasetChart({ dataset, locale, reveal, selected }: { dataset: Dataset; locale: Locale; reveal: DatasetReveal; selected: AnalysisKey }) {
  const m = messages[locale];
  const values = dataset.patients.map(p => p.outcome);
  const low = Math.floor((Math.min(...values) - 10) / 20) * 20;
  const high = Math.ceil((Math.max(...values) + 10) / 20) * 20;
  const x = (v: number) => 95 + (v - low) / (high - low) * 855;
  const averages = [false, true].map(treated => mean(dataset.patients.filter(p => p.treated === treated).map(p => p.outcome)));
  const difference = averages[1] - averages[0];
  const f = (value: number) => formatNumber(value, locale, 2, 2);
  return <div className="se-chart-scroll"><svg viewBox="0 0 1000 430" className="se-patients" role="img" aria-label={m.latestHint} data-chart="patients">
    <text x="45" y="66" textAnchor="middle">{m.centerLabel}</text>
    {[0, .25, .5, .75, 1].map(fraction => { const value = low + fraction * (high - low); return <g key={fraction}>
      <line x1={x(value)} x2={x(value)} y1="60" y2="300" className="se-gridline" />
      <text x={x(value)} y="391" textAnchor="middle">{formatNumber(value, locale, 0)}</text></g>; })}
    {CENTER_EFFECTS.map((_, center) => <g key={center} data-center={center}>
      <text x="45" y={89 + center * 40} textAnchor="middle">{String.fromCharCode(65 + center)}</text>
      {[false, true].map(treated => {
        const patients = dataset.patients.filter(p => p.center === center && p.treated === treated);
        const rowY = 77 + center * 40 + (treated ? 16 : 0);
        const average = mean(patients.map(p => p.outcome));
        return <g key={String(treated)} className={treated ? "se-enhanced" : "se-standard"}>
          {patients.map((p, i) => <circle key={i} cx={x(p.outcome)} cy={rowY + (i % 3 - 1) * 3} r="3.5"
            opacity={Math.max(0, Math.min(1, (reveal.points * 130 - (center * 20 + Number(treated) * 10 + i)) / 10))}
            data-patient="true" data-treated={String(treated)} data-outcome={p.outcome} />)}
          {reveal.means > 0 && <path opacity={reveal.means} d={`M ${x(average)} ${rowY - 7} l 6 7 -6 7 -6 -7 Z`} className="se-center-mean" />}
        </g>;
      })}
    </g>)}
    {reveal.means === 0 && <>
      <g className="se-overall-standard"><text x="95" y="27">{m.standard}</text></g>
      <g className="se-overall-enhanced"><text x="950" y="27" textAnchor="end">{m.enhanced}</text></g>
    </>}
    {reveal.means > 0 && averages.map((average, index) => <g key={index} opacity={reveal.means} className={index ? "se-overall-enhanced" : "se-overall-standard"} data-overall-mean={average}>
      <text x={index ? 950 : 95} y="27" textAnchor={index ? "end" : "start"}>{index ? m.enhancedMean : m.standardMean}: {f(average)} m</text>
      <line x1={x(average)} x2={x(average)} y1="48" y2={48 + 260 * reveal.means} className="se-overall-line" />
    </g>)}
    {reveal.difference > 0 && <g opacity={reveal.difference} data-treatment-difference={difference} data-treatment-se={dataset.result[selected].se} className="se-difference">
      <path d={`M ${x(averages[0])} 320 v 14 H ${x(averages[0] + difference * reveal.difference)} v -14`} />
      <text x="525" y="362" textAnchor="middle">{m.effectDifference}: {f(difference)} m ({f(dataset.result[selected].se)} m)</text>
    </g>}
    <text x="525" y="422" textAnchor="middle">{m.outcome}</text>
  </svg></div>;
}


export function SEBoxPlot({ results, selected, empiricalSE, locale }: {
  results: Result[]; selected: AnalysisKey; empiricalSE: number | null; locale: Locale;
}) {
  const m = messages[locale];
  const box = useMemo(() => reportedSEBox(results.map(result => result[selected].se)), [results, selected]);
  // Keep the same axis when switching analyses; include the reference and every outlier.
  const domain = useMemo(() => {
    if (!results.length) return [0, 8];
    let low = empiricalSE ?? Infinity, high = empiricalSE ?? 0;
    for (const result of results) for (const key of ["treatment", "center"] as const) {
      low = Math.min(low, result[key].se); high = Math.max(high, result[key].se);
    }
    const pad = Math.max(.15, (high - low) * .12);
    return [Math.max(0, low - pad), high + pad];
  }, [results, empiricalSE]);
  const [low, high] = domain;
  const y = (value: number) => 262 - 222 * (value - low) / (high - low);
  const digits = high - low < 2 ? 2 : 1;
  return <div className="se-chart-scroll"><svg className="se-boxplot" viewBox="0 0 340 290" role="img" aria-label={m.sePlot}
    data-chart="reported-se" data-axis-min={low} data-axis-max={high}>
    <text x="58" y="21">{m.seAxis}</text>
    {[0, .25, .5, .75, 1].map(fraction => {
      const value = low + fraction * (high - low);
      return <g key={fraction}><line x1="58" x2="325" y1={y(value)} y2={y(value)} className="se-gridline" />
        <text x="48" y={y(value) + 6} textAnchor="end">{formatNumber(value, locale, digits, digits)}</text></g>;
    })}
    {box && <g className="se-box" data-box-count={box.n} data-box-median={box.median}>
      <line x1="192" x2="192" y1={y(box.high)} y2={y(box.low)} />
      {[box.low, box.high].map((value, index) => <line key={index} x1="171" x2="213" y1={y(value)} y2={y(value)} />)}
      <rect x="151" y={y(box.q3)} width="82" height={y(box.q1) - y(box.q3)} />
      <line className="se-box-median" x1="151" x2="233" y1={y(box.median)} y2={y(box.median)} />
      {box.outliers.map((value, index) => <circle key={index} cx="192" cy={y(value)} r="3" data-se-outlier={value} />)}
    </g>}
    {empiricalSE !== null && <line className="se-empirical-reference" x1="58" x2="325" y1={y(empiricalSE)} y2={y(empiricalSE)} data-empirical-se={empiricalSE}>
      <title>{m.empirical}: {formatNumber(empiricalSE, locale, 2, 2)} m</title>
    </line>}
    {!box && <text x="192" y="160" textAnchor="middle">{m.seEmpty}</text>}
  </svg></div>;
}
