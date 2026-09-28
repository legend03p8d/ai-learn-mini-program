const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/15036/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=__dirname;
const files=['01-start-and-sources.html','02-quiz-and-feedback.html','03-review-and-sharing.html','04-learning-center.html','05-account-and-data.html','06-empty-and-recovery.html'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const load=f=>page.goto(pathToFileURL(path.join(root,f)).href);
 fs.mkdirSync(path.join(root,'qa'),{recursive:true});
 const counts=[];
 for(const [i,f]of files.entries()){
  await load(f);const count=await page.locator('.screen-card').count();counts.push(count);
  assert.equal(count,[12,9,9,12,9,9][i],f);
  assert.equal(await page.evaluate(()=>window.PrototypeQA.screenCount),60);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,f+' desktop overflow');
  await page.screenshot({path:path.join(root,'qa',`group-${i+1}-desktop.png`)});
  for(const id of [['A10'],['B08'],['C07'],['D11'],['E07'],['F06']][i]){
   await page.locator(`#${id} .phone`).screenshot({path:path.join(root,'qa',`${id}.png`)});
  }
 }
 await load('index.html');
 await page.screenshot({path:path.join(root,'qa','overview-desktop.png'),fullPage:true});
 const checks=[];
 for(const width of [320,360,390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  for(const f of files){
   await load(f);
   const overflow=await page.evaluate(()=>({outer:document.documentElement.scrollWidth>innerWidth,phones:[...document.querySelectorAll('.phone-content')].filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.closest('.screen-card').id)}));
   assert.deepEqual(overflow,{outer:false,phones:[]},`${f} ${width}px overflow`);
   const columns=await page.locator('.screen-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
   assert.equal(columns,width>1130?3:width>720?2:1);
  }
 }
 checks.push('6 groups at 320/360/390/768/1024/1440 px; no horizontal overflow; 3/2/1 columns');
 await page.setViewportSize({width:1440,height:1050});
 await load('index.html');
 await page.evaluate(()=>localStorage.clear());
 await page.locator('[data-action="launch"]').first().click();
 const click=(a,v)=>page.locator(`#demo-stage [data-action="${a}"]${v!==undefined?`[data-value="${v}"]`:''}`).first().click();
 const state=()=>page.evaluate(()=>window.PrototypeQA.getState());
 await click('prepare');assert.match(await page.locator('#demo-stage').innerText(),/请输入想学/);
 await click('example');await click('prepare');assert.equal((await state()).id,'A09');
 await click('processed');await click('confirm-knowledge');await click('generate');await click('go','B03');await click('start');
 const answers=[[0],[1],[0],[0,1],[0]];
 for(let i=0;i<5;i++){
  for(const option of answers[i])await click('option',option);
  await click('submit');assert.equal(await page.locator('#demo-stage .option:not([disabled])').count(),0);
  if(i===2)assert.match(await page.locator('#demo-stage').innerText(),/漏选/);
  await click('next');
 }
 let st=await state();assert.equal(st.id,'C01');assert.equal(st.completed,true);assert.equal(st.history.length,7);
 assert.equal(await page.evaluate(()=>window.PrototypeQA.score(window.PrototypeQA.getState()).accuracy),80);
 await page.screenshot({path:path.join(root,'qa','demo-result.png')});
 checks.push('full 5-question flow: single/multiple/boolean; first-answer lock; missed option; correct 80% score and saved record');
 await click('go','C07');await click('share');assert.equal((await state()).id,'E02');
 await click('login');assert.match(await page.locator('#demo-stage').innerText(),/请先阅读/);
 await page.locator('#demo-stage [data-field="agreed"]').check();await click('login');await click('merge');
 assert.equal((await state()).id,'C07');assert.equal((await state()).history.length,7);
 await page.locator('#demo-stage [data-field="shareScore"]').check();assert.match(await page.locator('#demo-stage .share-card').innerText(),/80%/);
 await click('share');assert.equal((await state()).id,'C08');assert.equal((await state()).shareName,false);
 await page.locator('[data-action="demo-close"]').click();
 await page.locator('[data-action="launch"]').first().click();assert.equal((await state()).id,'C08');
 checks.push('login consent, guest merge without duplicate, privacy toggles, share preview, persisted session');
 await page.locator('[data-action="demo-close"]').click();
 await load(files[2]);await page.locator('[data-action="inspect"][data-value="C09"]').click();await click('revoke');assert.equal((await state()).shareActive,false);
 await page.locator('[data-action="demo-close"]').click();
 await load(files[3]);await page.locator('[data-action="inspect"][data-value="D01"]').click();
 let t=await page.evaluate(()=>window.PrototypeQA.totals(window.PrototypeQA.getState()));assert.equal(t.total,30);assert.equal(t.right,24);assert.equal(t.rate,80);
 await page.locator('#demo-stage [data-field="topicFilter"]').selectOption('沟通表达');t=await page.evaluate(()=>window.PrototypeQA.totals(window.PrototypeQA.getState()));assert.equal(t.total,0);assert.match(await page.locator('#demo-stage').innerText(),/暂无足够数据/);
 await page.locator('[data-action="demo-close"]').click();await page.locator('[data-action="inspect"][data-value="D10"]').click();
 await page.locator('#demo-stage [data-field="from"]').fill('2026-09-29');await click('create-report');assert.match(await page.locator('#demo-stage').innerText(),/开始日期不能晚于/);
 await page.locator('#demo-stage [data-field="from"]').fill('2026-09-25');await click('create-report');assert.equal((await state()).reports.length,2);
 checks.push('sharing revocation; historical totals 24/30 = 80%; zero-data filtering; report date validation and append-only creation');
 await page.locator('[data-action="demo-close"]').click();await load(files[4]);await page.locator('[data-action="inspect"][data-value="E06"]').click();await click('delete-start','record');await click('delete-confirm');assert.match(await page.locator('#demo-stage').innerText(),/请先确认/);
 await page.locator('#demo-stage [data-field="deleteConfirm"]').check();await click('delete-confirm');assert.equal((await state()).history.length,5);
 checks.push('deletion requires explicit confirmation and updates records');
 await page.locator('[data-action="demo-close"]').click();await load(files[0]);await page.locator('[data-action="inspect"][data-value="A05"]').click();
 await page.locator('#demo-stage [data-field="url"]').fill('bad-url');await click('add-urls');assert.match(await page.locator('#demo-stage').innerText(),/完整的/);
 await page.locator('#demo-stage [data-field="url"]').fill(['https://example.com/1','https://example.com/2','https://example.com/3'].join('\n'));await click('add-urls');assert.match(await page.locator('#demo-stage').innerText(),/最多 5/);
 await page.locator('[data-action="demo-close"]').click();await page.locator('[data-action="inspect"][data-value="A06"]').click();await click('remove-source','guide');await click('remove-source','video');await click('go','A05');
 await page.locator('#demo-stage [data-field="url"]').fill(Array.from({length:9},(_,i)=>`https://example.com/${i}`).join('\n'));await click('add-urls');assert.equal((await state()).sources.length,10);
 await page.locator('#demo-stage [data-field="url"]').fill('https://example.com/11');await click('add-urls');assert.match(await page.locator('#demo-stage').innerText(),/最多 10/);
 checks.push('URL validation; mixed 5-source limit and pure-web 10-source limit');
 await page.locator('[data-action="demo-close"]').click();await page.setViewportSize({width:390,height:844});await load('index.html');
 await page.screenshot({path:path.join(root,'qa','overview-mobile.png'),fullPage:true});
 await page.locator('[data-action="inspect"][data-value="B05"]').click();await click('option',0);await click('option',2);await click('submit');
 assert.match(await page.locator('#demo-stage .feedback').innerText(),/回答正确/);
 await page.screenshot({path:path.join(root,'qa','question-mobile.png')});
 checks.push('mobile multiselect correct answer and immediate explanation');
 await page.locator('[data-action="demo-close"]').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:844,height:390});
 await load('index.html');await page.locator('[data-action="inspect"][data-value="B05"]').click();
 assert.equal(await page.evaluate(()=>document.querySelector('#demo-dialog').getBoundingClientRect().height<=innerHeight),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#demo-dialog').evaluate(x=>x.open),false);
 await page.setViewportSize({width:390,height:844});
 await load(files[2]);
 await page.addStyleTag({content:'.phone-content p,.phone-content button,.phone-content label,.phone-content input,.phone-content textarea{font-size:20px!important}'});
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.phone-content')].some(x=>x.scrollWidth>x.clientWidth+1)),false);
 checks.push('reduced motion, short landscape viewport, Escape closes modal, enlarged 20px content without horizontal overflow');
 await load(files[1]);await page.locator('[data-action="inspect"][data-value="B01"]').click();
 await click('set','10');await click('generate');assert.equal((await state()).qids.length,10);
 await page.locator('[data-action="demo-close"]').click();await page.locator('[data-action="inspect"][data-value="B01"]').click();
 await click('set','boolean');await click('generate');assert.match(await page.locator('#demo-stage').innerText(),/当前示例题库/);
 await click('set','custom');await page.locator('#demo-stage [data-field="customCount"]').fill('3');await click('generate');assert.deepEqual((await state()).qids,[4,7,9]);
 checks.push('10-question mixed set and 3-question judgment-only set; explicit sample-pool limit');
 await page.locator('[data-action="demo-close"]').click();await load(files[0]);await page.locator('[data-action="inspect"][data-value="A11"]').click();await click('remove-source','guide');await click('go','A10');await click('confirm-knowledge');assert.match(await page.locator('#demo-stage').innerText(),/请先.*重新整理/);
 checks.push('removing a source requires knowledge regeneration before quiz creation');
 assert.equal(errors.length,0,errors.join('\n'));
 const report={checkedAt:new Date().toISOString(),browser:'Local Google Chrome, Playwright',counts,total:counts.reduce((a,b)=>a+b,0),checks,errors};
 fs.writeFileSync(path.join(root,'qa','verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 await browser.close();
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
