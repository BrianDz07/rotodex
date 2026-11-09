class PokedexStore {
  constructor(){this.index=new Map();this.ready=this.load()}
  key(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
  async load(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetch('pokedex-data.json?v=8',{signal:controller.signal});if(!response.ok)throw new Error('local Pokédex');const entries=await response.json();for(const entry of entries){for(const value of [entry.id,entry.name,entry.display]){const key=this.key(value);if(!this.index.has(key))this.index.set(key,entry);else if(this.index.get(key)?.id!==entry.id)this.index.set(key,null)}}return true}catch{return false}finally{clearTimeout(timer)}}
  async get(query){await this.ready;const raw=String(query).trim();return this.index.get(this.key(/^\d+$/.test(raw)?Number(raw):raw))||null}
}
