import { drawNormal } from "../../domain/distributions/normal";
import type { RNG } from "../../domain/rng";
import { mean, standardDeviation } from "../../domain/statistics";

export interface Configuration { sexEffect: number; residualSD: number; trueEffect: number }
export const defaults: Configuration = { sexEffect: 12, residualSD: 12, trueEffect: 10 };
export interface Animal { id: number; female: boolean; baseline: number }
export interface ObservedAnimal extends Animal { treated: boolean; outcome: number }
export interface Cell { female: boolean; treated: boolean; n: number; mean: number | null }
export interface Analysis {
  animals: ObservedAnimal[]; cells: Cell[]; overall: number; stratified: number | null;
  unadjustedSE: number; adjustedSE: number | null;
}
export interface Experiment { simple: Analysis; balanced: Analysis }
function shuffled<T>(values: T[], rng: RNG): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function analyse(animals: ObservedAnimal[]): Analysis {
  const vehicle = animals.filter(a => !a.treated).map(a => a.outcome);
  const treated = animals.filter(a => a.treated).map(a => a.outcome);
  const overall = mean(treated) - mean(vehicle);
  const cells = [false, true].flatMap(female => [false, true].map(treated => {
    const values = animals.filter(a => a.female === female && a.treated === treated).map(a => a.outcome);
    return { female, treated, n: values.length, mean: values.length ? mean(values) : null };
  }));
  const stratified = cells.every(c => c.n > 0)
    ? ((cells[1].mean! - cells[0].mean!) + (cells[3].mean! - cells[2].mean!)) / 2 : null;
  // Fixed 12/12 sex and treatment totals: centered X'X diagonals both equal 6.
  // Common-effect OLS supplies an SE using all residuals, even with a singleton cell.
  const ybar = mean(animals.map(a => a.outcome));
  const cross = animals.reduce((s,a) => s + (Number(a.treated)-.5)*(Number(a.female)-.5),0);
  const ty = animals.reduce((s,a) => s + (Number(a.treated)-.5)*(a.outcome-ybar),0);
  const sy = animals.reduce((s,a) => s + (Number(a.female)-.5)*(a.outcome-ybar),0);
  const det = 36-cross*cross;
  let adjustedSE: number | null = null;
  if (det > 0) {
    const tau = (6*ty-cross*sy)/det;
    const beta = (6*sy-cross*ty)/det;
    const sse = animals.reduce((s,a) => s + (a.outcome-ybar-tau*(Number(a.treated)-.5)-beta*(Number(a.female)-.5))**2,0);
    adjustedSE = Math.sqrt((sse/21)*6/det);
  }
  const unadjustedSE = Math.sqrt((standardDeviation(vehicle)**2 + standardDeviation(treated)**2)/12);
  return { animals, cells, overall, stratified, unadjustedSE, adjustedSE };
}
export function simulate(config: Configuration, rng: RNG): Experiment {
  const animals: Animal[] = Array.from({length:24}, (_,id) => ({
    id, female: id < 12,
    baseline: 50 + (id < 12 ? config.sexEffect : 0) + drawNormal({mean:0,sd:config.residualSD},rng),
  }));
  const simpleIds = new Set(shuffled(animals,rng).slice(0,12).map(a=>a.id));
  const balancedIds = new Set([true,false].flatMap(f => shuffled(animals.filter(a=>a.female===f),rng).slice(0,6).map(a=>a.id)));
  function allocation(ids: Set<number>) {
    return analyse(animals.map(a=>({...a,treated:ids.has(a.id),outcome:a.baseline+(ids.has(a.id)?config.trueEffect:0)})));
  }
  return { simple:allocation(simpleIds), balanced:allocation(balancedIds) };
}
export function summarise(values: Array<number | null>) {
  const valid = values.filter((v): v is number => v !== null);
  return { n: valid.length, mean: valid.length ? mean(valid) : null, sd: valid.length > 1 ? standardDeviation(valid) : null };
}
