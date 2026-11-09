function cosine(a,b){let d=0,aa=0,bb=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return d/Math.sqrt(aa*bb||1)}
function visualDecision(ranks,artRanks,vector,toys){
 const matches=toys.map(t=>({id:t.id,score:cosine(vector,t.vector)})).sort((a,b)=>b.score-a.score),first=matches[0],different=matches.find(m=>m.id!==first?.id);
 if(first?.score>=.92&&(!different||first.score-different.score>=.05))return {id:first.id,score:1.01,source:'learned toy'};
 // A reference image and language model must agree, with a clear visual lead.
 const art=artRanks?.[0],nextArt=artRanks?.[1],text=ranks?.[0];
 if(art?.id&&art.score>=.98&&art.score-(nextArt?.score||0)>=.035)return {id:art.id,score:1.001,source:'reference artwork'};
 if(art?.id&&art.score>=.80&&art.score-(nextArt?.score||0)>=.045&&ranks.some(r=>r.id===art.id)&&text?.id!==0)return {id:art.id,score:1.001,source:'reference artwork'};
 // Language scores alone are not calibrated probabilities: require a large margin.
 if(text?.id&&text.score>=.29&&text.score-(ranks[1]?.score||0)>=.035)return {id:text.id,score:.90,source:'image model'};
 return null;
}
