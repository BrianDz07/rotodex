import sys,json,pathlib,numpy as np,onnxruntime as rt
from tokenizers import Tokenizer
src=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2])
opt=rt.SessionOptions();opt.intra_op_num_threads=1;opt.inter_op_num_threads=1
model=rt.InferenceSession(str(src/'clip-model/text_model_quantized.onnx'),sess_options=opt)
t=Tokenizer.from_file(str(src/'clip-model/tokenizer.json'));t.enable_truncation(max_length=77);t.enable_padding(pad_id=49407,pad_token='<|endoftext|>')
labels=[{'id':p['id'],'name':p['name'],'display':p['display']} for p in json.loads((out/'pokedex-data.json').read_text())]
for n in ['a person','a human face','a hand','a dog','a cat','a teddy bear','a toy car','a chair','a desk','a room','a wall','a window','a blanket','an empty surface','a television','a phone','a book','a shoe','a bottle','a plant','a dinosaur toy','a Mario toy','a Sonic toy','a Mickey Mouse toy','a stuffed animal that is not a Pokemon']:
 labels.append({'id':0,'name':'none','display':n})
print([(i.name,i.shape) for i in model.get_inputs()],flush=True)
vectors=[]
for i,label in enumerate(labels):
 prompts=[f"a picture of {label['display']}, the Pokemon.",f"a photo of a {label['display']} Pokemon plush toy or figurine."] if label['id'] else [f"a photo of {label['display']}."]*2
 enc=t.encode_batch(prompts);inp={'input_ids':np.array([e.ids for e in enc],dtype=np.int64),'attention_mask':np.array([e.attention_mask for e in enc],dtype=np.int64)}
 v=model.run(None,{k:v for k,v in inp.items() if k in [x.name for x in model.get_inputs()]})[0];v=v/np.linalg.norm(v,axis=1,keepdims=True);v=v.mean(axis=0);v/=np.linalg.norm(v);vectors.append(v)
 if i%100==0:print(i,flush=True)
np.asarray(vectors,dtype=np.float32).tofile(out/'visual-labels.f32');(out/'visual-labels.json').write_text(json.dumps(labels,ensure_ascii=False));print('DONE',len(labels),flush=True)
