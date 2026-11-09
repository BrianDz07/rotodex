import sys,pathlib,json,urllib.request,concurrent.futures,time,threading,numpy as np,onnxruntime as rt
from PIL import Image
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);cache=src/'reference-art';cache.mkdir(exist_ok=True)
labels=[{'id':p['id'],'name':p['name'],'display':p['display']} for p in json.loads((out/'pokedex-data.json').read_text())];priority=[25,6,1,4,7,133,172,390,26,143,39,150,151,448,658,810,813,816,906,909,912];labels.sort(key=lambda p:priority.index(p['id']) if p['id'] in priority else p['id']+1000)
opt=rt.SessionOptions();opt.intra_op_num_threads=1;opt.inter_op_num_threads=1
m=rt.InferenceSession(str(src/'clip-model/vision_model_quantized.onnx'),sess_options=opt)
def fetch(p):
 file=cache/f"{p['id']}.png"
 for retry in range(3):
  try:
   if not file.exists():
    data=urllib.request.urlopen(f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{p['id']}.png",timeout=30).read();file.write_bytes(data)
   Image.open(file).verify();return p,file
  except Exception as e:
   if retry==2:raise
   time.sleep(1)
def embedding(im):
 im=im.convert('RGB');w,h=im.size;scale=224/min(w,h);im=im.resize((int(w*scale),int(h*scale)),Image.Resampling.BICUBIC);w,h=im.size;im=im.crop(((w-224)//2,(h-224)//2,(w+224)//2,(h+224)//2));a=np.asarray(im,dtype=np.float32)/255;a=(a-np.array([.48145466,.4578275,.40821073]))/np.array([.26862954,.26130258,.27577711]);a=a.transpose(2,0,1)[None].astype('float32');v=m.run(None,{'pixel_values':a})[0][0];return v/np.linalg.norm(v)
valid=[];vectors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for p,file in pool.map(fetch,labels):
  im=Image.open(file).convert('RGBA');bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);v=embedding(bg.convert('RGB'));vectors.append(v);valid.append(p)
  if len(valid)%25==0:
   np.array(vectors,dtype='float32').tofile(out/'visual-art.f32');(out/'visual-art.json').write_text(json.dumps(valid));print(len(valid),flush=True)
np.array(vectors,dtype='float32').tofile(out/'visual-art.f32');(out/'visual-art.json').write_text(json.dumps(valid));print('DONE',len(valid),flush=True)
