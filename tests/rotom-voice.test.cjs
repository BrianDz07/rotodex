const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class FakeAudio{constructor(){this.listeners={};this.src='';this.calls=[];this.currentTime=0}addEventListener(n,f){this.listeners[n]=f}removeEventListener(n,f){if(this.listeners[n]===f)delete this.listeners[n]}pause(){}async play(){this.calls.push(this.src);this.listeners.playing?.()}}
async function run(){
 let release;const response=new Promise(r=>release=r);let errors=0;
 class FakeChime{unlock(){}stop(){}async play(){this.played=true}}
 const c=vm.createContext({Audio:FakeAudio,ScanChime:FakeChime,AbortController,setTimeout,clearTimeout,fetch:()=>response});vm.runInContext(fs.readFileSync('dist/rotom-voice.js','utf8'),c);const Voice=vm.runInContext('RotomVoice',c);let talking=false;const v=new Voice({onTalking:x=>talking=x,onError:()=>errors++});
 const first=v.entry(25),second=v.entry(6);release({ok:true,json:async()=>({entries:{25:{audio:'25.mp3'},6:{audio:'6.mp3'}},phrases:{discovered:{audio:'discovered.mp3'}}})});
 await Promise.all([first,second]);assert.deepEqual(v.audio.calls,['6.mp3'],'latest Pokémon wins while catalog loads');assert.equal(talking,true);
 v.setEnabled(false);assert.equal(talking,false);await v.entry(25);assert.equal(v.audio.calls.length,1,'voice off cannot play');
 v.setEnabled(true);await v.entry(25);assert.equal(v.audio.calls.at(-1),'25.mp3');await v.entry(6,{confirmation:true});assert.equal(v.chime.played,true,'scan confirmation plays the retro chime');await v.phrase('discovered');assert.equal(v.audio.calls.at(-1),'discovered.mp3');
 await v.entry(9999);assert.equal(errors,1,'missing recordings fail visibly');v.stop();assert.equal(talking,false);
 let releaseTone;v.chime.play=()=>new Promise(resolve=>{releaseTone=resolve});v.chime.stop=()=>releaseTone?.();const before=v.audio.calls.length;const delayed=v.entry(25,{confirmation:true});await Promise.resolve();v.setEnabled(false);await delayed;assert.equal(v.audio.calls.length,before,'muting during the tone cannot start delayed speech');
 v.setEnabled(true);const sequence=v.sequence(['correct.mp3','25.mp3']);await Promise.resolve();assert.equal(v.audio.calls.at(-1),'correct.mp3');v.audio.listeners.ended();await new Promise(resolve=>setImmediate(resolve));assert.equal(v.audio.calls.at(-1),'25.mp3');v.audio.listeners.ended();assert.equal(await sequence,true,'quiz result plays after celebration');
 const cancelled=v.sequence(['first.mp3','never.mp3']);await Promise.resolve();v.setEnabled(false);assert.equal(await cancelled,false);assert.notEqual(v.audio.calls.at(-1),'never.mp3','mute cancels the remaining queue');
 console.log('PASS prerecorded playback, voice mute, stale requests, phrases, and missing-audio errors');
 const catalog=JSON.parse(fs.readFileSync('dist/voice-catalog.json','utf8'));assert.equal(Object.keys(catalog.entries).length,1025);for(const e of Object.values(catalog.entries)){assert.ok(e.description);assert.ok(e.audio.endsWith('.mp3'));assert.ok(!e.text.includes('undefined'))}
 console.log('PASS all 1,025 Pokémon narration metadata records');
}
run().catch(e=>{console.error(e);process.exit(1)});
