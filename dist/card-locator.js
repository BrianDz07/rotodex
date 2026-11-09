// Locate a card's outer rectangle, then undo tilt/perspective before name OCR.
let cardVisionPromise=null,cardVision=null;
function getCardVision(){
  if(cardVision)return Promise.resolve(true);
  if(cardVisionPromise)return cardVisionPromise;
  cardVisionPromise=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Card locator startup timed out')),30000);
    const script=document.createElement('script');script.src=new URL('vendor/opencv.js',document.baseURI).href;
    script.onerror=()=>{clearTimeout(timer);reject(new Error('Card locator unavailable'))};
    script.onload=()=>{try{const module=window.cv;const ready=()=>{if(!module?.Mat){clearTimeout(timer);reject(new Error('Card locator unavailable'));return}cardVision=module;clearTimeout(timer);resolve(true)};if(module?.Mat)ready();else if(module){const previous=module.onRuntimeInitialized;module.onRuntimeInitialized=()=>{previous?.();ready()}}else{clearTimeout(timer);reject(new Error('Card locator unavailable'))}}catch(e){clearTimeout(timer);reject(e)}};
    document.head.append(script);
  });
  return cardVisionPromise;
}
function locateCard(source){
  const cv=cardVision;if(!cv)return null;
  const small=document.createElement('canvas'),scale=Math.min(1,900/source.width);small.width=Math.round(source.width*scale);small.height=Math.round(source.height*scale);small.getContext('2d').drawImage(source,0,0,small.width,small.height);
  let src,fullSource,gray,edges,contours,hierarchy,kernel,points,target,transform,warped;
  try{
    src=cv.imread(small);gray=new cv.Mat();edges=new cv.Mat();contours=new cv.MatVector();hierarchy=new cv.Mat();
    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,gray,new cv.Size(5,5),0);cv.Canny(gray,edges,8,30);kernel=cv.Mat.ones(3,3,cv.CV_8U);cv.morphologyEx(edges,edges,cv.MORPH_CLOSE,kernel);
    cv.findContours(edges,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    let best=null,bestArea=0;const frameArea=small.width*small.height;
    for(let i=0;i<contours.size();i++){
      const contour=contours.get(i),approx=new cv.Mat();
      try{const area=cv.contourArea(contour);if(area<frameArea*.035||area>frameArea*.96||area<=bestArea)continue;
        for(const epsilon of [.02,.035,.05]){cv.approxPolyDP(contour,approx,epsilon*cv.arcLength(contour,true),true);if(approx.rows===4&&cv.isContourConvex(approx))break}
        if(approx.rows!==4||!cv.isContourConvex(approx))continue;
        const p=Array.from({length:4},(_,j)=>({x:approx.data32S[j*2],y:approx.data32S[j*2+1]}));
        const bySum=[...p].sort((a,b)=>(a.x+a.y)-(b.x+b.y)),byDiff=[...p].sort((a,b)=>(a.y-a.x)-(b.y-b.x));
        let ordered=[bySum[0],byDiff[0],bySum[3],byDiff[3]];
        if(new Set(ordered).size!==4)continue;
        const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);let w=(dist(ordered[0],ordered[1])+dist(ordered[3],ordered[2]))/2,h=(dist(ordered[0],ordered[3])+dist(ordered[1],ordered[2]))/2;
        const ratio=Math.min(w,h)/Math.max(w,h);if(ratio<.48||ratio>.88)continue;
        if(w>h)ordered=[ordered[3],ordered[0],ordered[1],ordered[2]];
        best=ordered;bestArea=area;
      }finally{approx.delete();contour.delete()}
    }
    if(!best)return null;
    fullSource=cv.imread(source);points=cv.matFromArray(4,1,cv.CV_32FC2,best.flatMap(p=>[p.x/scale,p.y/scale]));target=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,629,0,629,879,0,879]);transform=cv.getPerspectiveTransform(points,target);warped=new cv.Mat();cv.warpPerspective(fullSource,warped,transform,new cv.Size(630,880),cv.INTER_CUBIC,cv.BORDER_REPLICATE);
    const card=document.createElement('canvas');cv.imshow(card,warped);return card;
  }catch(e){console.warn('Card locator:',e);return null}
  finally{for(const mat of [warped,transform,target,points,fullSource,kernel,hierarchy,contours,edges,gray,src])if(mat)mat.delete()}
}
function rotateCard(source){const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d');ctx.translate(c.width,c.height);ctx.rotate(Math.PI);ctx.drawImage(source,0,0);return c}
