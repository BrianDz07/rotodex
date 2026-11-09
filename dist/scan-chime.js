// Original retro handheld-style confirmation sound, synthesized without an audio service.
class ScanChime {
  constructor(){this.serial=0;this.context=null;this.nodes=new Set();this.pending=new Set()}
  unlock(){try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;this.context ||= new Context();if(this.context.state==='suspended')this.context.resume().catch(()=>{})}catch{}}
  stop(){this.serial++;for(const node of this.nodes){try{node.stop()}catch{}}this.nodes.clear();for(const finish of [...this.pending])finish();this.pending.clear()}
  async play(){const serial=this.serial;this.unlock();const ctx=this.context;if(!ctx)return;try{if(ctx.state==='suspended')await ctx.resume()}catch{return}if(serial!==this.serial||ctx.state!=='running')return;
    const start=ctx.currentTime+.01;
    // Three ascending square-wave notes, softly filtered to avoid a piercing phone-speaker sound.
    const notes=[{frequency:1046.5,offset:0,duration:.075},{frequency:1568,offset:.08,duration:.075},{frequency:2093,offset:.16,duration:.12}];
    for(const note of notes){const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='square';osc.frequency.value=note.frequency;filter.type='lowpass';filter.frequency.value=3400;const t=start+note.offset;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.005);gain.gain.exponentialRampToValueAtTime(.001,t+note.duration);osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();filter.disconnect();gain.disconnect()};osc.start(t);osc.stop(t+note.duration+.01)}
    return new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);this.pending.delete(finish);resolve()};this.pending.add(finish);timer=setTimeout(finish,325)});
  }
}
