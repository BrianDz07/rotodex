"""Package local entry metadata so a confirmed scan never waits for PokéAPI."""
import csv,json,pathlib,sys
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2])
def rows(name):return list(csv.DictReader((src/name).open()))
catalog=json.loads((out/'voice-catalog.json').read_text())['entries']
species={int(r['id']):r for r in rows('pokemon_species.csv')};pokemon={int(r['species_id']):r for r in rows('pokemon.csv') if r['is_default']=='1'}
names={int(r['pokemon_species_id']):r for r in rows('pokemon_species_names.csv') if r['local_language_id']=='9'};abilities={r['id']:r['identifier'] for r in rows('abilities.csv')};choices={}
for r in rows('pokemon_abilities.csv'):
 if r['is_hidden']=='0':choices.setdefault(r['pokemon_id'],[]).append((int(r['slot']),abilities[r['ability_id']]))
chains={}
for i,r in species.items():chains.setdefault(r['evolution_chain_id'],[]).append(i)
def family(i):
 members=chains[species[i]['evolution_chain_id']];parent={j:int(species[j]['evolves_from_species_id'] or 0) for j in members};result=[]
 def walk(j):
  result.append({'id':j,'name':species[j]['identifier']})
  for child in members:
   if parent[child]==j:walk(child)
 for j in members:
  if parent[j] not in members:walk(j)
 return result
entries=[]
for key,voice in catalog.items():
 i=int(key);p=pokemon[i];entries.append({'id':i,'speechId':i,'name':voice['slug'],'display':voice['name'],'description':voice['description'],'types':voice['types'],'height':int(p['height']),'weight':int(p['weight']),'ability':min(choices[p['id']])[1],'genus':names[i]['genus'],'family':family(i)})
(out/'pokedex-data.json').write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')))
print('Packaged',len(entries),'local Pokémon entries;',round((out/'pokedex-data.json').stat().st_size/1024),'KB')
