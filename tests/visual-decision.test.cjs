const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/visual-decision.js','utf8'),ctx);const decide=ctx.visualDecision;
assert.equal(decide([{id:25,score:.34},{id:63,score:.336}],[],[1,0],[]),null,'Close CLIP guesses never auto-announce');
assert.equal(decide([{id:0,score:.40},{id:25,score:.30}],[{id:25,score:.85},{id:26,score:.60}],[1,0],[]),null,'Background is not a Pokémon');
assert.equal(decide([{id:25,score:.34},{id:63,score:.336}],[{id:25,score:.85},{id:26,score:.78}],[1,0],[]).id,25,'Language and clear artwork can corroborate');
assert.equal(decide([{id:25,score:.34},{id:63,score:.336}],[{id:26,score:.85},{id:25,score:.78}],[1,0],[]),null,'Disagreement stays uncertain');
assert.equal(decide([],[],[1,0],[{id:25,vector:[1,0]}]).id,25,'A taught exact toy view matches');
assert.equal(decide([],[],[1,0],[{id:25,vector:[1,0]},{id:26,vector:[1,.1]}]),null,'Similar conflicting taught toys stay uncertain');
assert.equal(decide([{id:63,score:.34},{id:25,score:.32}],[{id:906,score:.99},{id:907,score:.90}],[1,0],[]).id,906,'Near-exact reference artwork does not require a language model to know a later-generation name');
const entries=JSON.parse(fs.readFileSync('dist/pokedex-data.json'));const get=id=>entries.find(p=>p.id===id);assert.equal(get(6).stage,3);assert.equal(get(6).baseName,'Charmander');assert.equal(get(134).stage,2);assert.equal(get(135).stage,2);assert.equal(get(136).stage,2);assert.equal(get(172).stage,1);assert.equal(get(26).stage,3);
console.log('PASS confidence rejection, learned toy conflicts, language/art agreement, and branched/baby evolution stages');
// Card OCR may be confirmed by a separate, strong visual observation.
const trackerCtx={};vm.createContext(trackerCtx);vm.runInContext(fs.readFileSync('dist/scan-tracker.js','utf8'),trackerCtx);const Tracker=vm.runInContext('ScanTracker',trackerCtx);const source=fs.readFileSync('dist/app.js','utf8'),start=source.indexOf('let recognized=tracker.observe(picks'),end=source.indexOf('\nif(recognized){',start),combine=source.slice(start,end);
function combined(evidence){const tracker=new Tracker();const c={tracker,picks:[{id:25,name:'pikachu',score:1.001}],performance:{now:()=>2000},sample:{id:42},session:1,lastVisionEvidence:evidence};vm.createContext(c);vm.runInContext(combine,c);return vm.runInContext('recognized',c)}
const evidence={name:'pikachu',at:1500,session:1,frameId:'visual-1',used:false};assert.equal(combined({...evidence}).name,'pikachu');assert.equal(combined({...evidence,used:true}),null);assert.equal(combined({...evidence,session:0}),null);assert.equal(combined({...evidence,name:'pichu'}),null);assert.equal(combined({...evidence,at:-3000}),null);
console.log('PASS independent OCR/art corroboration rejects stale, consumed, mismatched and prior-session evidence');
