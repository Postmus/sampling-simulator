import { useEffect, useRef, useState } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale, formatNumber } from "../../i18n/LocaleContext";
import { createRng, randomSeed } from "../../domain/rng";
import { AnimationRuntime } from "../../runtime/AnimationRuntime";
import { defaults, simulate, summarise, type Analysis, type Experiment } from "./model";
import { messages } from "./messages";
import "./stratified-randomization.css";

export default function StratifiedRandomizationPage() {
 const {locale}=useLocale(), m=messages[locale];
 const f=(n:number|null)=>n===null?"—":formatNumber(n,locale,2);
 const [config,setConfig]=useState(defaults), [step,setStep]=useState(0);
 const [allocation,setAllocation]=useState<"simple"|"balanced">("simple");
 const [dialog,setDialog]=useState<"settings"|"se"|null>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(dialog)dialogRef.current?.showModal();else dialogRef.current?.close();},[dialog]);
 const [records,setRecords]=useState<Experiment[]>([]), [latest,setLatest]=useState<Experiment|null>(null);
 const [progress,setProgress]=useState(1), [busy,setBusy]=useState(false), [paused,setPaused]=useState(false);
 const [seed,setSeed]=useState(271828), [reduced,setReduced]=useState(()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 const [fullscreen,setFullscreen]=useState(false), [status,setStatus]=useState<"waiting"|"running"|"ready"|"generated"|"resetStatus"|"fullscreenError"|"limit">("waiting");
 const root=useRef<HTMLElement>(null), rng=useRef(createRng(seed)), moving=useRef(false), count=useRef(0), reduceRef=useRef(reduced);
 reduceRef.current=reduced;
 const runtime=useRef<AnimationRuntime|null>(null);
 if(!runtime.current) runtime.current=new AnimationRuntime({speed:()=>1,reducedMotion:()=>reduceRef.current});
 useEffect(()=>{const change=()=>setFullscreen(document.fullscreenElement!==null);document.addEventListener("fullscreenchange",change);return()=>{runtime.current?.cancel();document.removeEventListener("fullscreenchange",change);};},[]);
 function reset(nextSeed=seed) {runtime.current!.cancel();moving.current=false;count.current=0;setBusy(false);setPaused(false);setRecords([]);setLatest(null);setProgress(1);rng.current=createRng(nextSeed);setSeed(nextSeed);setStatus("resetStatus");}
 async function run(n:number,animated:boolean) {
  if(moving.current)return;
  const amount=Math.min(n,20000-count.current);if(!amount){setStatus("limit");return;}
  moving.current=true;setBusy(true);setPaused(false);const r=runtime.current!,token=r.beginRun();
  if(!animated){const batch=Array.from({length:amount},()=>simulate(config,rng.current));count.current+=amount;setRecords(old=>[...old,...batch]);setLatest(batch[batch.length-1]);setProgress(1);setStatus("generated");}
  else for(let i=0;i<amount;i++) {
   const experiment=simulate(config,rng.current);setLatest(experiment);setProgress(0);setStatus("running");
   await r.tween(1000,token,setProgress);if(!r.isCurrent(token))return;
   count.current++;setRecords(old=>[...old,experiment]);setStatus("ready");await r.delay(250,token);if(!r.isCurrent(token))return;
  }
  moving.current=false;setBusy(false);
 }
 async function presentation(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen();}catch{setStatus("fullscreenError");}}
 const shown=latest?latest[allocation]:null;
 const series=[records.map(r=>r.simple.overall),records.map(r=>r.simple.stratified),records.map(r=>r.balanced.stratified)];
 const seriesIndices=step===2?[1,2]:[0,1];
 const visibleSeries=seriesIndices.map(i=>series[i]);
 const values=visibleSeries.flat().filter((v):v is number=>v!==null);
 const low=Math.floor(Math.min(-10,...values)/5)*5, high=Math.ceil(Math.max(30,...values)/5)*5;
 const binWidth=(high-low)/24;
 const bins=visibleSeries.map(v=>{const b=Array<number>(24).fill(0);v.forEach(x=>{if(x!==null)b[Math.min(23,Math.max(0,Math.floor((x-low)/binWidth)))]++;});return b;});
 const maxBin=Math.max(1,...bins.flat());
 function resultTable(a:Analysis){return <table><thead><tr><th>{m.cell}</th><th>{m.vehicle}: n</th><th>{m.mean}</th><th>{m.gel}: n</th><th>{m.mean}</th></tr></thead><tbody>{[true,false].map(female=>{const v=a.cells.find(c=>c.female===female&&!c.treated)!,t=a.cells.find(c=>c.female===female&&c.treated)!;return <tr key={String(female)}><th>{female?m.female:m.male}</th><td>{v.n}</td><td>{f(v.mean)}</td><td>{t.n}</td><td>{f(t.mean)}</td></tr>;})}</tbody></table>;}
 const femaleDifference=shown&&shown.cells[3].mean!==null&&shown.cells[2].mean!==null?shown.cells[3].mean-shown.cells[2].mean:null;
 const maleDifference=shown&&shown.cells[1].mean!==null&&shown.cells[0].mean!==null?shown.cells[1].mean-shown.cells[0].mean:null;
 return <main className="strat-demo" ref={root}>
  <header>
   <div className="strat-topbar"><a href="#/themes/sampling-estimation">← {m.library}</a><div className="strat-header-actions"><LanguageSelector/><button className="secondary" onClick={()=>setDialog("settings")}>{m.settings}</button><button className="secondary" onClick={()=>void presentation()}>{fullscreen?m.exit:m.presentation}</button></div></div>
   <h1>{m.title}</h1>
  </header>
  <nav aria-label={m.title}>{m.steps.map((s,i)=><button key={i} aria-pressed={step===i} disabled={busy} onClick={()=>setStep(i)}>{s}</button>)}</nav>
  <p className="strat-explanation">{step===0?m.compareIntro:step===1?m.repeatIntro:m.balanceIntro}</p>
  <section className="strat-controls" aria-label={m.settings}>
   {step===0?<>
    <label>{m.allocation}<select aria-label={m.allocation} value={allocation} disabled={busy} onChange={e=>setAllocation(e.target.value as "simple"|"balanced")}><option value="simple">{m.simple}</option><option value="balanced">{m.balanced}</option></select></label>
    <button disabled={busy||records.length>=20000} onClick={()=>void run(1,true)}>{m.run}</button>
   </>:<>
    <label className="strat-sex-control">{m.sexShort}<input aria-label={m.sex} type="range" min="0" max="24" step="2" value={config.sexEffect} onChange={e=>{reset();setConfig({...config,sexEffect:Number(e.target.value)});}}/><strong>{config.sexEffect} pp</strong></label>
    <button disabled={busy||records.length>=20000} onClick={()=>void run(10,true)}>{m.ten}</button>
    <button disabled={busy||records.length>=20000} onClick={()=>void run(1000,false)}>{m.batch}</button>
    {busy&&<button className="secondary" onClick={()=>setPaused(runtime.current!.togglePaused())}>{paused?m.resume:m.pause}</button>}
   </>}
   <button className="secondary" onClick={()=>reset()}>{m.reset}</button>
   {step>=1&&<button className="secondary" onClick={()=>setDialog("se")}>{m.seTitle}</button>}
  </section>
  <div className="strat-status" role="status" aria-live="polite"><span>{m[status]} · {m.truth}</span><span className="strat-count">{m.count}: <strong data-testid="strat-count">{records.length}</strong></span></div>
  {step===0&&<section className="strat-panel strat-experiment"><div className="strat-panel-heading"><h2>{allocation==="balanced"?m.balanced:m.simple}</h2><div className="strat-legend"><span className="strat-female">● {m.female}</span><span className="strat-male">■ {m.male}</span></div></div>
   {!shown?<p>{m.waiting}</p>:<div className="strat-comparison-layout">
    <div className="strat-allocation-data"><div className="strat-board-scroll"><svg viewBox="0 0 700 215" className="strat-board" role="img" aria-label={`${m.latest}: ${m.vehicle} 12, ${m.gel} 12`}>
     <rect x="10" y="42" width="325" height="164" rx="12" fill="#f0f4f5"/><rect x="365" y="42" width="325" height="164" rx="12" fill="#f0f4f5"/>
     <text x="172" y="27" textAnchor="middle">{m.vehicle} (n = 12)</text><text x="527" y="27" textAnchor="middle">{m.gel} (n = 12)</text>
     {shown.animals.map(a=>{const group=shown.animals.filter(b=>b.treated===a.treated),i=group.findIndex(b=>b.id===a.id);const tx=(a.treated?405:50)+(i%6)*49,ty=94+Math.floor(i/6)*65;const sx=240+(a.id%6)*40,sy=50+Math.floor(a.id/6)*43;const x=sx+(tx-sx)*progress,y=sy+(ty-sy)*progress;return <g key={a.id} data-testid="strat-animal" transform={`translate(${x} ${y})`}><title>{a.female?m.female:m.male} {a.id+1}; {a.treated?m.gel:m.vehicle}; {f(a.outcome)}%</title>{a.female?<circle r="18" fill="#286b8c"/>:<rect x="-18" y="-18" width="36" height="36" rx="3" fill="#a34b23"/>}<text textAnchor="middle" dy="6" fill="white" fontSize="18">{a.id+1}</text></g>;})}
    </svg></div>
    {progress===1&&<div className="strat-table-scroll">{resultTable(shown)}</div>}
    </div>
    {progress===1&&<div className="strat-results"><div className="strat-estimates"><div>{m.overall}<strong data-testid="strat-overall">{f(shown.overall)}</strong></div><div>{m.adjusted}<strong data-testid="strat-adjusted">{f(shown.stratified)}</strong></div></div><p>{m.femaleDiff}: <strong>{f(femaleDifference)}</strong><br/>{m.maleDiff}: <strong>{f(maleDifference)}</strong></p><p>{m.equation}</p>{shown.stratified===null&&<p>{m.missing}</p>}{allocation==="balanced"&&<p className="strat-insight">{m.identity}</p>}<p className="strat-units">{m.units}</p></div>}
   </div>}
  </section>}
  {step>=1&&<section className="strat-panel strat-distributions"><div className="strat-panel-heading"><h2>{m.hist}</h2><span>{m.truthLine}</span></div><div className="strat-histograms">{visibleSeries.map((s,i)=>{const index=seriesIndices[i],summary=summarise(s);return <article key={index}><h3>{m.series[index]}</h3><svg viewBox="0 0 420 250" role="img" aria-label={m.histLabel}>
    {bins[i].map((n,j)=><rect key={j} x={30+j*15} y={195-n/maxBin*155} width="14" height={n/maxBin*155} fill={["#a34b23","#286b8c","#36764a"][index]}/>)}
    <line x1={30+(10-low)/(high-low)*360} x2={30+(10-low)/(high-low)*360} y1="25" y2="196" stroke="#172f38" strokeDasharray="5 4" strokeWidth="2"/>
    <line x1="30" x2="390" y1="196" y2="196" stroke="#627078"/>{[low,(low+high)/2,high].map(x=><text key={x} x={30+(x-low)/(high-low)*360} y="220" textAnchor="middle" fontSize="22">{f(x)}</text>)}<text x="210" y="247" textAnchor="middle" fontSize="22">{m.xaxis}</text>
   </svg><div className="strat-distribution-stats"><span>{m.average}: <strong>{f(summary.mean)}</strong></span><span>{m.empirical}: <strong>{f(summary.sd)}</strong></span><span>{m.valid}: {summary.n} / {records.length}</span></div></article>;})}</div><p className="strat-insight">{step===1?m.analysisOnly:m.allocationOnly}</p></section>}
  <dialog ref={dialogRef} className="strat-dialog" onClose={()=>setDialog(null)} onClick={e=>{if(e.target===dialogRef.current)setDialog(null);}}>
   <div className="strat-panel-heading"><h2>{dialog==="se"?m.seTitle:m.settings}</h2><button onClick={()=>setDialog(null)}>{m.close}</button></div>
   {dialog==="settings"?<><div className="strat-settings">
    <label>{m.sex}<input aria-label={m.sex} type="range" min="0" max="24" step="2" value={config.sexEffect} onChange={e=>{reset();setConfig({...config,sexEffect:Number(e.target.value)});}}/><strong>{config.sexEffect}</strong></label>
    <label>{m.residual}<select value={config.residualSD} onChange={e=>{reset();setConfig({...config,residualSD:Number(e.target.value)});}}>{[6,12,18,24].map(n=><option key={n}>{n}</option>)}</select></label><label><input type="checkbox" checked={reduced} onChange={e=>{setReduced(e.target.checked);if(e.target.checked)runtime.current!.finishActiveAnimations();}}/>{m.reduce}</label><span>{m.seed}: {seed}</span><button className="secondary" onClick={()=>reset(randomSeed())}>{m.newSeed}</button></div><p>{m.model}</p><p>{m.population}</p><p>{m.paired}</p><p>{m.caveat}</p></>:<><p>{m.seIntro}</p><div className="strat-table-scroll"><table><thead><tr><th>{m.analysis}</th><th>{m.empirical}</th><th>{m.avgSE}</th></tr></thead><tbody>{[
   [m.series[0],series[0],records.map(r=>r.simple.unadjustedSE)],
   [m.series[1],series[1],records.map(r=>r.simple.adjustedSE)],
   ...(step===2?[[m.balancedOverall,records.map(r=>r.balanced.overall),records.map(r=>r.balanced.unadjustedSE)],[m.series[2],series[2],records.map(r=>r.balanced.adjustedSE)]]:[])
  ].map(([name,est,se])=><tr key={name as string}><th>{name as string}</th><td>{f(summarise(est as Array<number|null>).sd)}</td><td>{f(summarise(se as Array<number|null>).mean)}</td></tr>)}</tbody></table></div><p>{m.caveat}</p></>}
  </dialog>
 </main>;
}
