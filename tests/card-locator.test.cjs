const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cv=require('../dist/vendor/opencv.js');
function run(){
  let sourceMat,warps=0;
  const originalRead=cv.imread,originalShow=cv.imshow;
  cv.imread=()=>sourceMat.clone();cv.imshow=(canvas,mat)=>{canvas.width=mat.cols;canvas.height=mat.rows;warps++};
  const context=vm.createContext({console,window:{},injectedCv:cv,document:{createElement:()=>({width:0,height:0,getContext:()=>({drawImage(){}})})},setTimeout,clearTimeout,URL,Promise});
  vm.runInContext(fs.readFileSync('dist/card-locator.js','utf8'),context);vm.runInContext('cardVision=injectedCv',context);
  sourceMat=new cv.Mat(506,900,cv.CV_8UC4,new cv.Scalar(221,221,221,255));
  assert.equal(context.locateCard({width:900,height:506}),null,'blank frame must not become a card');
  const quad=cv.matFromArray(4,1,cv.CV_32SC2,[335,55,565,97,506,413,278,371]);
  cv.fillConvexPoly(sourceMat,quad,new cv.Scalar(248,220,70,255));
  const result=context.locateCard({width:900,height:506});assert.ok(result,'tilted low-contrast yellow card must be detected');assert.equal(result.width,630);assert.equal(result.height,880);assert.equal(warps,1);
  quad.delete();sourceMat.delete();cv.imread=originalRead;cv.imshow=originalShow;
  console.log('PASS blank frame, tilted low-contrast card, and perspective correction');
}
if(cv.Mat)run();else cv.onRuntimeInitialized=run;
