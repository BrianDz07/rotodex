// Agreeing independent readings may be separated by brief motion blur.
class ScanTracker {
  constructor({windowMs=5000}={}){this.windowMs=windowMs;this.reset()}
  reset(){this.lastRecognized='';this.clearEvidence()}
  clearEvidence(){this.votes=[];this.pending='';this.hits=0;this.lastFrameId=null}
  observe(matches,now=Date.now(),frameId=null){
    this.votes=this.votes.filter(v=>now-v.at<=this.windowMs&&now>=v.at);
    this.pending=this.votes[0]?.name||'';this.hits=this.votes.length;
    if(frameId!==null&&frameId===this.lastFrameId)return null;
    if(frameId!==null)this.lastFrameId=frameId;
    const best=matches[0],next=matches[1];
    const strong=best&&best.score>=.82&&(!next||best.score-next.score>=.10);
    // Missing, blurry and ambiguous frames neither vote nor erase recent good evidence.
    if(!strong)return null;
    if(best.name===this.lastRecognized){this.clearEvidence();return null}
    // A clear different name starts a new candidate immediately.
    if(this.pending&&this.pending!==best.name)this.votes=[];
    this.votes.push({name:best.name,score:best.score,at:now});
    this.pending=best.name;this.hits=this.votes.length;
    const required=this.votes.some(v=>v.score>=1)?2:3;
    if(this.hits<required)return null;
    this.lastRecognized=best.name;this.clearEvidence();return best;
  }
  retry(name){if(this.lastRecognized===name)this.lastRecognized='';this.clearEvidence()}
}
