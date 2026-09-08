import { describe,it,expect } from "vitest";
import { createRng } from "../../domain/rng";
import { analyse, defaults,simulate,summarise } from "./model";
describe("paired allocation and analysis",()=>{
 it("replays deterministically and balances every sex/treatment cell",()=>{
  expect(simulate(defaults,createRng(72))).toEqual(simulate(defaults,createRng(72)));
  const rng=createRng(321);
  for(let i=0;i<100;i++){
   const r=simulate(defaults,rng);
   expect(r.balanced.cells.map(c=>c.n)).toEqual([6,6,6,6]);
   expect(r.simple.animals.filter(a=>a.treated)).toHaveLength(12);
   expect(r.balanced.overall).toBeCloseTo(r.balanced.stratified!,10);
   r.simple.animals.forEach((a,j)=>expect(a.outcome-(a.treated?10:0)).toBeCloseTo(r.balanced.animals[j].outcome-(r.balanced.animals[j].treated?10:0),10));
  }
 });
 it("isolates the imbalance contribution when residual variation is absent",()=>{
  const rng=createRng(3);
  for(let i=0;i<100;i++){
   const r=simulate({...defaults,residualSD:0},rng),a=r.simple;
   expect(a.stratified).toBeCloseTo(10,10);
   const treatedFemales=a.cells.find(c=>c.female&&c.treated)!.n;
   expect(a.overall).toBeCloseTo(10+12*(treatedFemales/12-(12-treatedFemales)/12),10);
   expect(r.balanced.overall).toBeCloseTo(10,10);
  }
 });
 it("marks an unidentifiable within-sex comparison rather than dropping the experiment",()=>{
  const a=analyse(Array.from({length:24},(_,id)=>({id,female:id<12,treated:id<12,baseline:50,outcome:50+(id<12?10:0)})));
  expect(a.overall).toBe(10);expect(a.stratified).toBeNull();expect(a.adjustedSE).toBeNull();
 });
 it("recovers the lecture's centres, sampling spreads and balanced SE distinction",()=>{
  const rng=createRng(1337),results=Array.from({length:20000},()=>simulate(defaults,rng));
  const overall=summarise(results.map(r=>r.simple.overall));
  const adjusted=summarise(results.map(r=>r.simple.stratified));
  const balanced=summarise(results.map(r=>r.balanced.stratified));
  for(const s of [overall,adjusted,balanced])expect(Math.abs(s.mean!-10)).toBeLessThan(.15);
  expect(overall.sd!).toBeGreaterThan(adjusted.sd!+.3);
  expect(adjusted.sd!).toBeGreaterThan(balanced.sd!+.06);
  expect(balanced.sd!).toBeCloseTo(Math.sqrt(24),1);
  const se=summarise(results.map(r=>r.balanced.adjustedSE)).mean!;
  expect(Math.abs(se-balanced.sd!)).toBeLessThan(.15);
  expect(summarise(results.map(r=>r.balanced.unadjustedSE)).mean!).toBeGreaterThan(se+.4);
 });
 it("removes the prognostic advantage at zero sex effect",()=>{
  const rng=createRng(334),r=Array.from({length:12000},()=>simulate({...defaults,sexEffect:0},rng));
  const overall=summarise(r.map(a=>a.simple.overall)),balanced=summarise(r.map(a=>a.balanced.overall));
  expect(Math.abs(overall.sd!-balanced.sd!)).toBeLessThan(.15);
 });
});
