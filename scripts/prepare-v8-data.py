"""Run after prepare-voice-catalog.py and prepare-local-pokedex.py using the same CSV directory."""
import json,csv,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1];d=root/'dist';src=pathlib.Path(sys.argv[1])
rows={int(r['id']):r for r in csv.DictReader((src/'pokemon_species.csv').open())}
entries=json.loads((d/'pokedex-data.json').read_text());byid={p['id']:p for p in entries}
for p in entries:
 chain=[];i=p['id']
 while i:
  chain.append(i);i=int(rows[i]['evolves_from_species_id'] or 0)
 chain.reverse();p['stage']=len(chain);p['baseId']=chain[0];p['baseName']=byid[chain[0]]['display'];p['parentId']=int(rows[p['id']]['evolves_from_species_id'] or 0)
 p['evolutionDescription']=f"{p['display']} is " + (f"the first stage of its evolutionary family." if len(chain)==1 and len(p['family'])>1 else f"a Pokémon that does not evolve." if len(p['family'])==1 else f"{p['baseName']}'s {['first','second','third'][min(len(chain),3)-1]} evolutionary stage.")
(d/'pokedex-data.json').write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')))
c=json.loads((d/'voice-catalog.json').read_text());c['version']=8
for k,e in c['entries'].items():
 p=byid[int(k)];e['text']=f"{e['name']}! {p['evolutionDescription'].split(' is ',1)[1].capitalize()} " + ('An' if e['types'][0][0] in 'aeiou' else 'A')+' '+ ' and '.join(e['types'])+' type Pokémon. '+e['description'];e['audio']=f'audio/kokoro-v8/{k}.mp3'
c['phrases'].update({'welcome':{'text':"Hi, Trainer! I'm Rotom, your Pokémon buddy! Show me a Pokémon. Let's see who we can find!",'audio':'audio/kokoro-v8/welcome.mp3'},'discovered':{'text':"Awesome! A new discovery! You're becoming a great Pokémon explorer!",'audio':'audio/kokoro-v8/discovered.mp3'},'quiz':{'text':"Who's that Pokémon? Tap a picture to choose!",'audio':'audio/kokoro-v8/quiz.mp3'},'correct':{'text':"You got it! Great job, Trainer Trainer!",'audio':'audio/kokoro-v8/correct.mp3'},'retry':{'text':"Good try! Take another look. You've got this!",'audio':'audio/kokoro-v8/retry.mp3'},'trainer':{'text':"Pokémon trainer identification. This Pokédex belongs to Trainer! A curious explorer, and a friend to Pokémon everywhere!",'audio':'audio/kokoro-v8/trainer.mp3'}})
c['phrases']['uncertain']={'text':"Hmm! Let's take another look. Show me one Pokémon at a time!",'audio':'audio/kokoro-v8/uncertain.mp3'}
(d/'voice-catalog.json').write_text(json.dumps(c,ensure_ascii=False,indent=2))

forms={}
for p in csv.DictReader((src/'pokemon.csv').open()):
 n=p['identifier']
 if '-mega' not in n and '-gmax' not in n:continue
 base=n.split('-mega')[0].split('-gmax')[0]
 label=('Mega '+base.title()+(' '+n.rsplit('-',1)[-1].upper() if n.endswith(('-x','-y')) else '')) if '-mega' in n else 'Gigantamax '+base.title()
 forms.setdefault(p['species_id'],[]).append({'id':int(p['id']),'name':label})
(d/'special-forms.json').write_text(json.dumps(forms))
