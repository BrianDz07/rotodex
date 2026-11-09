// Child-facing apps share the existing Pokédex and its voice/mute control.
let trainerProfile={nickname:'Trainer',partner:25},quizWins=0,quizRound=0,quizSolved=false;
try{trainerProfile={...trainerProfile,...JSON.parse(localStorage.getItem('rotom-trainer')||'{}')};quizWins=Math.max(0,Number(localStorage.getItem('rotom-quiz-wins'))||0)}catch{}
let allPokemon=[],specialForms={};
const progressText=text=>$('backupStatus').textContent=text;
function saveProfile(){try{localStorage.setItem('rotom-trainer',JSON.stringify(trainerProfile));localStorage.setItem('rotom-quiz-wins',String(quizWins))}catch{progressText('Storage is unavailable. Save a backup to keep your progress.')}}
function updateTrainer(){if(!$('trainerName'))return;$('trainerName').textContent=trainerProfile.nickname||'Trainer';$('trainerDiscoveries').textContent=discoveries.length;$('trainerWins').textContent=quizWins;$('gameStars').textContent=quizWins;const partner=allPokemon.find(p=>p.id===Number(trainerProfile.partner))||{id:25,display:'Pikachu'};$('partnerArt').src=artwork(partner.id);$('partnerArt').alt=partner.display;$('partnerName').textContent=partner.display;}
window.addEventListener('rotom-progress',updateTrainer);
$('nickname').value=trainerProfile.nickname;$('nickname').onchange=()=>{trainerProfile.nickname=$('nickname').value.trim().slice(0,24)||'Trainer';saveProfile();updateTrainer()};
$('partnerSelect').onchange=()=>{trainerProfile.partner=Number($('partnerSelect').value);saveProfile();updateTrainer()};
$('readTrainer').onclick=()=>{rotomVoice.unlock();if(!voice)$('sound').click();rotomVoice.phrase('trainer')};
let activeApp='explore';
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{
 const tab=b.dataset.tab;if(tab===activeApp)return;closeCamera();quizRound++;rotomVoice.stop();activeApp=tab;
 for(const button of document.querySelectorAll('[data-tab]'))button.setAttribute('aria-pressed',String(button.dataset.tab===tab));
 document.querySelector('.workspace').hidden=tab!=='explore';document.querySelector('.collection').hidden=tab!=='explore';$('trainerPage').hidden=tab!=='trainer';$('gamePage').hidden=tab!=='game';
 if(tab==='trainer')updateTrainer();if(tab==='game'){rotomVoice.unlock();startQuestion()}
};
function shuffled(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
async function startQuestion(){const round=++quizRound;quizSolved=false;$('quizChoices').replaceChildren();$('nextQuestion').hidden=true;$('quizFeedback').textContent='Who could it be?';$('silhouette').classList.add('silhouette');$('gamePage').classList.remove('quiz-success');
 await localPokedex.ready;if(round!==quizRound||activeApp!=='game')return;
 const familiar=[1,4,7,25,39,52,54,133,143,150,151,172,390];const pool=allPokemon.filter(p=>familiar.includes(p.id)||discoveries.some(d=>d.id===p.id));const options=shuffled(pool).slice(0,3);if(options.length<3){$('quizFeedback').textContent='The Pokédex is still loading. Tap Next to try again.';$('nextQuestion').hidden=false;return}const answer=options[Math.floor(Math.random()*options.length)];$('silhouette').src=artwork(answer.id);$('silhouette').alt='Mystery Pokémon silhouette';
 for(const p of options){const button=document.createElement('button');button.className='quiz-choice';button.setAttribute('aria-label',p.display);const image=document.createElement('img');image.src=artwork(p.id);image.alt=p.display;const label=document.createElement('span');label.textContent=p.display;button.append(image,label);button.onclick=async()=>{
  if(quizSolved||round!==quizRound)return;rotomVoice.unlock();
  if(p.id!==answer.id){button.classList.add('try-again');button.disabled=true;$('quizFeedback').textContent='Good try! Take another look.';rotomVoice.phrase('retry');return}
  quizSolved=true;quizWins++;saveProfile();updateTrainer();$('silhouette').classList.remove('silhouette');$('silhouette').alt=answer.display;$('quizFeedback').textContent='It’s '+answer.display+'! You got it!';$('gamePage').classList.add('quiz-success');for(const b of $('quizChoices').children)b.disabled=true;$('nextQuestion').hidden=false;
  const catalog=await rotomVoice.catalog;if(round!==quizRound||activeApp!=='game'||!voice)return;rotomVoice.sequence([catalog.phrases.correct.audio,catalog.entries[String(answer.id)].audio]);
 };$('quizChoices').append(button)}
 rotomVoice.phrase('quiz');
}
$('nextQuestion').onclick=startQuestion;$('repeatQuestion').onclick=()=>{rotomVoice.unlock();rotomVoice.phrase('quiz')};
fetch('pokedex-data.json?v=8').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{allPokemon=data;for(const id of ['partnerSelect','teachSpecies']){$(id).replaceChildren(...data.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.display;return option}));$(id).value=id==='partnerSelect'?trainerProfile.partner:25}updateTrainer();if(activeApp==='game')startQuestion()}).catch(()=>progressText('Pokédex data could not load. Refresh to try again.'));
fetch('special-forms.json').then(r=>r.json()).then(data=>{specialForms=data;renderForms(current)}).catch(()=>{});
function renderForms(p){const forms=specialForms[String(p.speechId||p.id)]||[];$('specialForms').hidden=!forms.length;$('formsGrid').replaceChildren(...forms.map(f=>{const figure=document.createElement('figure');const img=document.createElement('img');img.src=artwork(f.id);img.alt=f.name;img.loading='lazy';img.onerror=()=>{img.hidden=true};const label=document.createElement('figcaption');label.textContent=f.name;figure.append(img,label);return figure}))}
$('exportProgress').onclick=()=>{try{const toys=JSON.parse(localStorage.getItem('rotom-toys-v1')||'[]');const backup={format:'rotom-backup',version:1,trainer:trainerProfile,discoveries,quizWins,toys};const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='trainer-rotodex-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);progressText('Backup downloaded. Keep it somewhere safe.')}catch{progressText('Could not create the backup. Try again.')}};
$('importProgress').onclick=()=>$('backupFile').click();
$('backupFile').onchange=async()=>{const file=$('backupFile').files[0];$('backupFile').value='';if(!file)return;try{if(file.size>5_000_000)throw Error('This backup is too large.');const data=JSON.parse(await file.text());if(data.format!=='rotom-backup'||data.version!==1||!Array.isArray(data.discoveries)||!Array.isArray(data.toys))throw Error('This is not a Rotodex backup.');
 const valid=data.discoveries.every(p=>Number.isInteger(p.id)&&p.id>=1&&p.id<=1025&&typeof p.name==='string'&&typeof p.display==='string');const validToys=data.toys.length<=100&&data.toys.every(t=>Number.isInteger(t.id)&&t.id>=1&&t.id<=1025&&Array.isArray(t.vector)&&t.vector.length===512&&t.vector.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1));if(!valid||!validToys)throw Error('The backup contains invalid Pokémon data.');
 const nickname=typeof data.trainer?.nickname==='string'?data.trainer.nickname.slice(0,24):'Trainer';const partner=Number.isInteger(data.trainer?.partner)&&data.trainer.partner>=1&&data.trainer.partner<=1025?data.trainer.partner:25;const wins=Number.isSafeInteger(data.quizWins)&&data.quizWins>=0?data.quizWins:0;
 const merged=[...discoveries];for(const p of data.discoveries)if(!merged.some(d=>d.id===p.id))merged.push({id:p.id,name:p.name,display:p.display});
 // Store before swapping in-memory state; never silently report success on quota errors.
 const winsToKeep=Math.max(quizWins,wins),writes={'rotom-toys-v1':JSON.stringify(data.toys),'rotom-discoveries':JSON.stringify(merged),'rotom-trainer':JSON.stringify({nickname,partner}),'rotom-quiz-wins':String(winsToKeep)},previous=Object.fromEntries(Object.keys(writes).map(key=>[key,localStorage.getItem(key)]));try{for(const [key,value] of Object.entries(writes))localStorage.setItem(key,value)}catch{for(const [key,value] of Object.entries(previous)){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}}throw Error('Could not restore the backup. Browser storage may be full or unavailable.')}trainerProfile={nickname,partner};quizWins=winsToKeep;discoveries=merged;$('nickname').value=nickname;$('partnerSelect').value=partner;renderCollection();render();updateTrainer();window.dispatchEvent(new Event('rotom-toys-updated'));progressText('Backup restored. Discoveries merged; taught toy views restored.');
 }catch(e){progressText(e.message||'Could not restore that backup.')}};
updateTrainer();
