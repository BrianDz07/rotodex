// A small, bounded buffer keeps sampling while OCR runs in its worker.
class MotionFrameBank {
  constructor({maxAgeMs=500,maxFrames=4}={}){this.maxAgeMs=maxAgeMs;this.maxFrames=maxFrames;this.frames=[]}
  add(frame,now=frame.at){this.frames=this.frames.filter(f=>now-f.at<=this.maxAgeMs);this.frames.push(frame);if(this.frames.length>this.maxFrames)this.frames.splice(0,this.frames.length-this.maxFrames)}
  take(now){this.frames=this.frames.filter(f=>now-f.at<=this.maxAgeMs&&now>=f.at);let best=null,bestRank=-1;
    for(const frame of this.frames){const rank=frame.sharpness*(1-(now-frame.at)/this.maxAgeMs*.25);if(rank>bestRank||(rank===bestRank&&frame.at>best.at)){best=frame;bestRank=rank}}
    if(best)this.frames=this.frames.filter(f=>f.at>best.at);return best;
  }
  clear(){this.frames=[]}
}
function sharpnessFromPixels(pixels,width,height){
  const gray=new Float32Array(width*height);for(let i=0;i<gray.length;i++)gray[i]=pixels[i*4]*.299+pixels[i*4+1]*.587+pixels[i*4+2]*.114;
  let sum=0,squares=0,count=0;
  for(let y=1;y<height-1;y+=2)for(let x=1;x<width-1;x+=2){const i=y*width+x,lap=4*gray[i]-gray[i-1]-gray[i+1]-gray[i-width]-gray[i+width];sum+=lap;squares+=lap*lap;count++}
  return count?Math.max(0,squares/count-(sum/count)**2):0;
}
let qualityCanvas=null;
function measureFrameSharpness(image){qualityCanvas ||= document.createElement('canvas');const scale=Math.min(1,224/Math.max(image.width,image.height));qualityCanvas.width=Math.max(3,Math.round(image.width*scale));qualityCanvas.height=Math.max(3,Math.round(image.height*scale));const ctx=qualityCanvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,qualityCanvas.width,qualityCanvas.height);return sharpnessFromPixels(ctx.getImageData(0,0,qualityCanvas.width,qualityCanvas.height).data,qualityCanvas.width,qualityCanvas.height)}
