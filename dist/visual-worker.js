import {env,AutoProcessor,CLIPVisionModelWithProjection,RawImage} from './vendor/vision/transformers.min.js';
env.allowLocalModels=false;env.backends.onnx.wasm.wasmPaths=new URL('./vendor/vision/',self.location.href).href;env.backends.onnx.wasm.numThreads=1;
let processor,encoder,labels,vectors,artLabels,artVectors;
const unit=v=>{const n=Math.hypot(...v)||1;return Array.from(v,x=>x/n)};
const dot=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)n+=a[i]*b[i];return n};
self.onmessage=async({data:m})=>{try{
 if(m.type==='load'){
  const revision='6b7c523703ae26e39be4b03774966f8571c7f523';const report=p=>{if(p.status==='progress')self.postMessage({type:'progress',text:'Downloading image model… '+Math.round(p.progress||0)+'%'})};
  [processor,encoder]=await Promise.all([AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32',{revision}),CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32',{revision,quantized:true,progress_callback:report})]);
  const [l,v,a,av]=await Promise.all([fetch('visual-labels.json').then(r=>r.json()),fetch('visual-labels.f32').then(r=>r.arrayBuffer()),fetch('visual-art.json').then(r=>r.json()),fetch('visual-art.f32').then(r=>r.arrayBuffer())]);labels=l;vectors=new Float32Array(v);artLabels=a;artVectors=new Float32Array(av);if(artVectors.length!==artLabels.length*512)throw Error('Reference artwork is incomplete');if(vectors.length!==labels.length*512)throw Error('Label data is incomplete');self.postMessage({type:'ready'});return;
 }
 if(m.type==='image'){
  if(!encoder)throw Error('Model is not loaded');const pixels=new Uint8ClampedArray(m.pixels);for(let i=0;i<pixels.length;i+=4){const a=pixels[i+3]/255;if(a<1){for(let c=0;c<3;c++)pixels[i+c]=pixels[i+c]*a+255*(1-a);pixels[i+3]=255}}const image=new RawImage(pixels,m.width,m.height,4);const inputs=await processor(image);const output=await encoder(inputs);const vector=unit(output.image_embeds.data);const ranks=labels.map((l,i)=>({...l,score:dot(vector,vectors.subarray(i*512,(i+1)*512))})).sort((a,b)=>b.score-a.score).slice(0,4);
  const artRanks=artLabels.map((l,i)=>({...l,score:dot(vector,artVectors.subarray(i*512,(i+1)*512))})).sort((a,b)=>b.score-a.score).slice(0,4);self.postMessage({type:'result',request:m.request,session:m.session,ranks,artRanks,vector});
 }
}catch(e){self.postMessage({type:'error',request:m.request,message:e.message||String(e)})}};
