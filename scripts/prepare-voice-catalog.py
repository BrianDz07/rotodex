"""Build deterministic narration metadata from the PokeAPI CSV export."""
import csv,json,pathlib,re,sys
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2])
def rows(name):return list(csv.DictReader((src/name).open()))
species=json.loads((out/'pokemon-names.json').read_text());names={int(r['pokemon_species_id']):r for r in rows('pokemon_species_names.csv') if r['local_language_id']=='9'}
pokemon={int(r['species_id']):r for r in rows('pokemon.csv') if r['is_default']=='1'}
types={r['id']:r['identifier'] for r in rows('types.csv')};pokemon_types={}
for r in rows('pokemon_types.csv'):pokemon_types.setdefault(r['pokemon_id'],[]).append((int(r['slot']),types[r['type_id']]))
flavors={}
for r in rows('pokemon_flavor.csv'):
 if r['language_id']=='9':flavors.setdefault(int(r['species_id']),[]).append((int(r['version_id']),r['flavor_text']))
scary=re.compile(r'\b(kill|kills|killed|dead|death|die|dies|dying|blood|soul|souls|kidnap|kidnaps|kidnapped|abduct|abducts|corpse|corpses|drown|drowns|funeral|funerals)\b',re.I)
entries={}
for species in species:
 i=species['id'];name=names[i]['name'];genus=names[i]['genus'];ty=[t for _,t in sorted(pokemon_types[pokemon[i]['id']])]
 options=[]
 for version,raw in flavors.get(i,[]):
  text=' '.join(raw.replace('\f',' ').split()).replace('POKéMON','Pokémon').replace('POKÉMON','Pokémon')
  text=re.sub(r'\b[A-Z]{3,}\b',lambda m:m.group().title(),text)
  first=re.split(r'(?<=[.!?])\s+',text)[0]
  if len(first)<=145 and not scary.search(text):options.append((version,first))
 description=max(options,key=lambda x:x[0])[1] if options else f'{name} is known as the {genus}.'
 type_text=' and '.join(ty);article='An' if type_text[0] in 'aeiou' else 'A'
 text=f"It's {name}! {article} {type_text} type Pokémon. {description}"
 entries[str(i)]={'id':i,'name':name,'slug':species['name'],'types':ty,'description':description,'text':text,'audio':f'audio/kokoro/{i}.mp3'}
manifest={'engine':'Kokoro-82M','voice':'am_puck','version':1,'generated':True,'entries':entries,'phrases':{'welcome':{'text':"Hi, Trainer! I'm Rotom, your Pokémon buddy! Show me a card. Let's see who we can find!",'audio':'audio/kokoro/welcome.mp3'},'discovered':{'text':"Awesome! A new discovery! You're becoming a great Pokémon explorer!",'audio':'audio/kokoro/discovered.mp3'}}}
(out/'voice-catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Prepared',len(entries),'Pokémon narrations')
