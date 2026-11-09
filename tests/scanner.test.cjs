const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/app.js','utf8');
const slice=source.slice(source.indexOf('function distance('),source.indexOf('function prepare('));
const context={normalize:s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')};
vm.createContext(context);vm.runInContext(slice,context);
const names=JSON.parse(fs.readFileSync('dist/pokemon-names.json')).map(p=>({...p,key:context.normalize(p.name)}));
for(const [text,expected] of [['BASIC Pikachu HP 60','pikachu'],['Charizard ex HP 330','charizard'],['Mewtwo GX','mewtwo'],['Raichu\nEvolves from Pikachu','raichu'],['Eevee VMAX','eevee'],['vie gBikachuVyay (ESIR[] 45','pikachu'],['Mr. Mime','mr-mime']]){
 const result=context.candidates(text,names);assert.equal(result[0]?.name,expected,text);console.log('PASS',expected);
}
assert.equal(context.candidates('ENERGY\nTRAINER\nSwitch your Active Pokémon',names).length,0);
console.log('PASS non-Pokémon card text');
