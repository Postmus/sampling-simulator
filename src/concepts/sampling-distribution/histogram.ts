export interface HistogramPlan {
  binWidth: number;
  start: number;
  binCount: number;
}

export function readableBinWidth(rawWidth: number) {
  const exponent = Math.floor(Math.log10(rawWidth));
  const magnitude = 10 ** exponent;
  const scaled = rawWidth / magnitude;
  const candidates = [1, 2, 2.5, 5, 10];
  const closest = candidates.reduce((best, candidate) =>
    Math.abs(candidate - scaled) < Math.abs(best - scaled) ? candidate : best,
  );
  return closest * magnitude;
}

export function createHistogramPlan(
  domain: readonly [number, number],
  center: number,
  standardError: number,
): HistogramPlan {
  const binWidth = readableBinWidth(0.5 * standardError);
  let start = center - binWidth / 2;
  while (start > domain[0]) {
    start -= binWidth;
  }
  return {
    binWidth,
    start,
    binCount: Math.ceil((domain[1] - start) / binWidth),
  };
}

export function histogramBin(value: number, plan: HistogramPlan) {
  return Math.min(
    plan.binCount - 1,
    Math.max(0, Math.floor((value - plan.start) / plan.binWidth)),
  );
}

export function histogramCounts(values: readonly number[], plan: HistogramPlan) {
  const counts = Array.from({ length: plan.binCount }, () => 0);
  values.forEach((value) => {
    counts[histogramBin(value, plan)] += 1;
  });
  return counts;
}
