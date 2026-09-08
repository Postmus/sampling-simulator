import { expect,test } from "@playwright/test";

test("compare tab switches allocation for the same animals without batch controls",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/#/concepts/stratified-randomization");
 await expect(page.getByRole("button",{name:"Animate 10"})).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Generate 1,000"})).toHaveCount(0);
 await page.getByRole("button",{name:"Run 1 experiment",exact:true}).click();
 await expect(page.getByTestId("strat-count")).toHaveText("1");
 await expect(page.getByTestId("strat-animal")).toHaveCount(24);
 const original=await page.getByTestId("strat-overall").textContent();
 await page.getByLabel("Allocation",{exact:true}).selectOption("balanced");
 await expect(page.getByTestId("strat-adjusted")).toHaveText((await page.getByTestId("strat-overall").textContent())!);
 await expect(page.locator(".strat-allocation-data tbody td").filter({hasText:/^6$/})).toHaveCount(4);
 await expect(page.getByTestId("strat-count")).toHaveText("1");
 await page.getByLabel("Allocation",{exact:true}).selectOption("simple");
 await expect(page.getByTestId("strat-overall")).toHaveText(original!);
 await page.getByRole("button",{name:"Reset / replay"}).click();await page.getByRole("button",{name:"Run 1 experiment",exact:true}).click();
 await expect(page.getByTestId("strat-overall")).toHaveText(original!);
});

test("repetition tabs show only the intended distribution pair and preserve paired data",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/#/concepts/stratified-randomization");
 await page.getByRole("button",{name:"2 · Repeat experiments"}).click();
 await expect(page.locator(".strat-experiment")).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Run 1 experiment",exact:true})).toHaveCount(0);
 await page.getByRole("button",{name:"Generate 1,000"}).click();await expect(page.getByTestId("strat-count")).toHaveText("1000");
 await expect(page.locator(".strat-histograms article")).toHaveCount(2);
 const paired=await page.locator(".strat-histograms article").nth(1).textContent();
 await page.getByRole("button",{name:"3 · Balance within sex"}).click();
 await expect(page.locator(".strat-experiment")).toHaveCount(0);
 await expect(page.locator(".strat-histograms article")).toHaveCount(2);
 await expect(page.locator(".strat-histograms article").first()).toHaveText(paired!);
 await expect(page.getByRole("heading",{name:"Balanced allocation · within sex",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Explore standard errors",exact:true}).click();
 await expect(page.getByRole("columnheader",{name:"Average estimated SE"})).toBeVisible();
 await expect(page.getByRole("rowheader",{name:"Balanced allocation · overall",exact:true})).toBeVisible();
 await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).not.toBeVisible();
 await page.getByLabel("Female − male effect (pp)").fill("0");await expect(page.getByTestId("strat-count")).toHaveText("0");
});

for(const size of [{width:1366,height:768},{width:1280,height:720}]) {
 test(`all populated tabs fit at ${size.width}×${size.height} in both languages`,async({page})=>{
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/#/concepts/stratified-randomization");
  await page.getByRole("button",{name:"Run 1 experiment",exact:true}).click();
  for(const locale of ["en","nl"]){
   await page.getByLabel(locale==="en"?"Language":"Language").selectOption(locale);
   for(let i=0;i<3;i++){
    await page.locator(".strat-demo nav button").nth(i).click();
    if(i===0)await page.locator(".strat-controls select").selectOption("balanced");
    if(i===1)await page.locator(".strat-controls button").filter({hasText:locale==="en"?"Generate 1,000":"Genereer 1.000"}).click();
    await page.screenshot({path:`test-results/strat-${size.width}-${locale}-tab${i+1}.png`,fullPage:true});
    const dims=await page.evaluate(()=>({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth,vh:innerHeight,vw:innerWidth}));
    expect(dims.h,JSON.stringify(dims)).toBeLessThanOrEqual(dims.vh+1);
    expect(dims.w).toBeLessThanOrEqual(dims.vw+1);
   }
  }
 });
}

test("reset cancels repetitions, settings reset data and mobile avoids page overflow",async({page})=>{
 await page.goto("/#/concepts/stratified-randomization");await page.getByRole("button",{name:"2 · Repeat experiments"}).click();
 await page.getByRole("button",{name:"Animate 10"}).click();await page.getByRole("button",{name:"Reset / replay"}).click();
 await page.waitForTimeout(1200);await expect(page.getByTestId("strat-count")).toHaveText("0");
 await page.getByRole("button",{name:"Model and replay settings",exact:true}).click();
 await page.getByLabel("Residual SD (pp)").selectOption("6");await page.getByRole("button",{name:"Close",exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:"reduce"});await page.reload();
 await page.getByRole("button",{name:"Run 1 experiment",exact:true}).click();await expect(page.getByTestId("strat-count")).toHaveText("1");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 await page.screenshot({path:"test-results/stratified-mobile.png",fullPage:true});
});
