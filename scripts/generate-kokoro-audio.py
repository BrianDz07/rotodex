"""Generate resumable prerecorded speech. Model files stay outside the Site."""
import concurrent.futures,json,multiprocessing,os,pathlib,subprocess,sys,time
import numpy as np
import re
engine=None

def initialize(model,voices):
 global engine
 import onnxruntime as rt
 from kokoro_onnx import Kokoro
 opt=rt.SessionOptions();opt.intra_op_num_threads=1;opt.inter_op_num_threads=1
 engine=Kokoro.from_session(rt.InferenceSession(model,sess_options=opt,providers=['CPUExecutionProvider']),voices)

def render(job):
 import soundfile as sf
 key,item,root=job;path=pathlib.Path(root)/item['audio'];path.parent.mkdir(parents=True,exist_ok=True)
 if path.exists() and path.stat().st_size>1500:return key,'cached',path.stat().st_size
 text=item['text']
 # Pronunciation spelling changes only the recording, never the displayed name.
 pronunciation={'Pokémon':'pˈoʊkeɪmɑːn','Pikachu':'pˈiːkətʃuː','Raichu':'ɹˈaɪtʃuː','Pichu':'pˈiːtʃuː','Eevee':'ˈiːviː','Mewtwo':'mˈjuːtuː','Mew':'mˈjuː','Chimchar':'tʃˈɪmtʃɑːɹ','Charizard':'tʃˈɑːɹɪzɑːɹd','Charmander':'tʃˈɑːɹmændɚ','Charmeleon':'tʃɑːɹmˈiːliən','Bulbasaur':'bˈʌlbəsɔːɹ','Ivysaur':'ˈaɪvisɔːɹ','Venusaur':'vˈiːnəsɔːɹ','Squirtle':'skwˈɜːɹtəl','Wartortle':'wˈɔːɹtɔːɹtəl','Blastoise':'blˈæstɔɪs','Gengar':'ɡˈɛŋɡɑːɹ','Snorlax':'snˈɔːɹlæks','Jigglypuff':'dʒˈɪɡlipʌf','Meowth':'mjˈaʊθ','Lucario':'luːkˈɑːɹioʊ','Greninja':'ɡɹɛnˈɪndʒə','Monferno':'mɑnfˈɜːɹnoʊ','Infernape':'ɪnfˈɜːɹneɪp','Sizzlipede':'sˈɪzəlɪpiːd'}
 pronunciation.update({name+ending:phonemes+'z ' for name,phonemes in list(pronunciation.items()) for ending in ["'s","’s"]})
 lookup={name.casefold():value for name,value in pronunciation.items()}
 pattern=r'(?<!\w)('+ '|'.join(re.escape(k) for k in sorted(pronunciation,key=len,reverse=True))+r')(?!\w)'
 phonemes=''.join(lookup[part.casefold()] if part.casefold() in lookup else engine.tokenizer.phonemize(part,lang='en-us')+' ' for part in re.split(pattern,text,flags=re.I) if part)
 samples,sr=engine.create(phonemes,voice='am_puck',speed=1.0,lang='en-us',is_phonemes=True);samples=np.asarray(samples,dtype=np.float32)
 if not len(samples) or not np.isfinite(samples).all():raise ValueError(f'Invalid audio for {key}')
 samples=samples/max(float(np.max(np.abs(samples))),.1)*.83
 wav=path.with_suffix('.wav');part=path.with_suffix('.partial.mp3');sf.write(wav,samples,sr)
 # A slight pitch lift gives the sidekick a lighter timbre; avoid heavy robot effects.
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','asetrate=25080,aresample=24000,highpass=f=75,alimiter=limit=0.9','-c:a','libmp3lame','-b:a','48k','-ac','1','-ar','24000',str(part)],check=True)
 part.replace(path);wav.unlink();return key,round(len(samples)/sr,2),path.stat().st_size

if __name__=='__main__':
 root=pathlib.Path(sys.argv[1]).resolve();catalog=json.loads((root/'voice-catalog.json').read_text());jobs=[(k,v,str(root)) for k,v in catalog['entries'].items()]+[(k,v,str(root)) for k,v in catalog['phrases'].items()]
 # Make the initial demo and familiar Pokémon available first.
 priority=['trainer','quiz','correct','retry','welcome','25','390','6','133','1','7','4','discovered'];jobs.sort(key=lambda x:priority.index(x[0]) if x[0] in priority else 999+int(x[0]) if x[0].isdigit() else 9999)
 started=time.time();done=0;failures=[];total=len(jobs)
 with concurrent.futures.ProcessPoolExecutor(max_workers=8,mp_context=multiprocessing.get_context('spawn'),initializer=initialize,initargs=(sys.argv[2],sys.argv[3])) as pool:
  futures={pool.submit(render,j):j[0] for j in jobs}
  for future in concurrent.futures.as_completed(futures):
   key=futures[future]
   try:future.result();done+=1
   except Exception as e:failures.append((key,str(e)));print('ERROR',key,str(e),flush=True)
   if done%25==0 or key in priority:print(json.dumps({'completed':done,'total':total,'elapsed_seconds':round(time.time()-started),'last':key,'failures':len(failures)}),flush=True)
 if failures:print(failures,flush=True);sys.exit(1)
 print('COMPLETE',done,'clips',round(time.time()-started),'seconds',flush=True)
