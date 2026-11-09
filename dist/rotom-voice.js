// The phone plays small prerecorded Kokoro clips; no TTS model or API key is needed.
class RotomVoice {
  constructor({onTalking=()=>{},onError=()=>{}}={}) {
    this.audio=new Audio();this.audio.id='rotomAudio';this.audio.hidden=true;if(typeof document!=='undefined')document.body.append(this.audio);this.audio.preload='none';this.audio.volume=.85;
    this.chime=new ScanChime();this.enabled=true;this.serial=0;this.onTalking=onTalking;this.onError=onError;
    this.preloads=new Map();this.catalog=this.loadCatalog();
    this.audio.addEventListener('playing',()=>this.onTalking(true));
    for(const event of ['pause','ended','error'])this.audio.addEventListener(event,()=>this.onTalking(false));
  }
  async loadCatalog(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch('voice-catalog.json?v=8',{signal:controller.signal});if(!response.ok)throw new Error('voice catalog');return await response.json()}catch{return null}finally{clearTimeout(timer)}}
  stop(){this.serial++;this.finishClip?.(false);this.finishClip=null;this.chime.stop();this.audio.pause();this.audio.currentTime=0;this.onTalking(false)}
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.stop()}
  async playPath(path){if(!this.enabled)return false;this.stop();const serial=this.serial;this.audio.src=path;
    try{await this.audio.play();if(serial!==this.serial){return false}return true}
    catch(error){if(serial===this.serial&&error?.name!=='AbortError')this.onError(error);return false}
  }
  preloadEntry(id){if(!/^\d+$/.test(String(id))||this.preloads.has(id))return;const audio=new Audio();audio.preload='auto';audio.src='audio/kokoro-v8/'+id+'.mp3';audio.load?.();this.preloads.set(id,audio);if(this.preloads.size>2){const first=this.preloads.keys().next().value;this.preloads.get(first).src='';this.preloads.delete(first)}}
  unlock(){this.chime.unlock()}
  welcome(){this.unlock();// Called directly by the Start button to unlock audio on mobile.
    return this.phrase('welcome');
  }
  async entry(speciesId,{confirmation=false}={}){this.stop();const serial=this.serial,catalog=await this.catalog;if(!this.enabled||serial!==this.serial)return false;const recording=catalog?.entries[String(speciesId)];if(!recording){this.onError(new Error('No recording for this Pokémon yet'));return false}if(confirmation){await this.chime.play();if(!this.enabled||serial!==this.serial)return false}return this.playPath(recording.audio)}
  async sequence(paths){this.stop();const serial=this.serial;if(!this.enabled)return false;for(const path of paths){if(serial!==this.serial||!this.enabled)return false;this.audio.src=path;const finished=new Promise(resolve=>{const done=()=>finish(true),error=()=>finish(false),finish=ok=>{this.audio.removeEventListener('ended',done);this.audio.removeEventListener('error',error);this.finishClip=null;resolve(ok)};this.finishClip=finish;this.audio.addEventListener('ended',done);this.audio.addEventListener('error',error)});try{await this.audio.play()}catch{this.finishClip?.(false);this.onError(new Error('Audio playback failed'));return false}if(!await finished)return false}return true}
  async phrase(name){this.stop();const serial=this.serial,catalog=await this.catalog;if(!this.enabled||serial!==this.serial)return false;const recording=catalog?.phrases[name];if(!recording)return false;return this.playPath(recording.audio)}
}
