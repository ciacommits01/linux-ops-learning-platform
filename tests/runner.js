let bad=0;
for(const q of QUESTS){
  newWorld();W.user='devops';W.cwd='/home/devops';
  try{q.setup();}catch(e){console.log('SETUP THROW',q.id,e.message);bad++;continue;}
  W.user='devops';W.cwd='/home/devops';W.env.HOME='/home/devops';W.flags={};
  const h=[];const pre=q.goals.map(g=>{try{return !!g.ok(h);}catch(e){return false;}});
  const sol=SOL[q.id];if(!sol){console.log('NO SOLUTION',q.id);bad++;continue;}
  for(const c of sol){h.push(c);execLine(c);}
  const post=q.goals.map(g=>{try{return !!g.ok(h);}catch(e){return false;}});
  if(!post.every(Boolean)||pre.every(Boolean)){bad++;console.log(post.every(Boolean)?'ALREADY DONE':'FAIL',q.id);}
}
console.log('missions failing:',bad,'of',QUESTS.length);
process.exit(bad?1:0);
