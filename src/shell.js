/* ================= BASH INTERPRETER ================= */
class Sig{constructor(t,n){this.t=t;this.n=n||0;}}
const INC={incomplete:true};
const isWS=c=>c===' '||c==='\t';
function skipParen(s,j){let d=0;for(;j<s.length;j++){const c=s[j];if(c==='\\'){j++;continue;}if(c==="'"){const e=s.indexOf("'",j+1);if(e<0)throw INC;j=e;continue;}if(c==='"'){j=skipDq(s,j)-1;continue;}if(c==='(')d++;else if(c===')'){d--;if(d===0)return j+1;}}throw INC;}
function skipBrace(s,j){let d=0;for(;j<s.length;j++){const c=s[j];if(c==='\\'){j++;continue;}if(c==="'"){const e=s.indexOf("'",j+1);if(e<0)throw INC;j=e;continue;}if(c==='"'){j=skipDq(s,j)-1;continue;}if(c==='{')d++;else if(c==='}'){d--;if(d===0)return j+1;}}throw INC;}
function skipDq(s,j){j++;for(;j<s.length;j++){const c=s[j];if(c==='\\'){j++;continue;}if(c==='"')return j+1;if(c==='$'&&s[j+1]==='('){j=skipParen(s,j+1)-1;continue;}if(c==='$'&&s[j+1]==='{'){j=skipBrace(s,j+1)-1;continue;}if(c==='`'){const e=s.indexOf('`',j+1);if(e<0)throw INC;j=e;}}throw INC;}
function lex(src){const toks=[],pend=[],n=src.length;let i=0;
 while(i<n){const c=src[i];
  if(isWS(c)){i++;continue;}
  if(c==='\\'&&src[i+1]==='\n'){i+=2;continue;}
  if(c==='#'){while(i<n&&src[i]!=='\n')i++;continue;}
  if(c==='\n'){toks.push({k:'op',v:'\n'});i++;
   while(pend.length){const hd=pend.shift();const L=[];let found=false;while(i<n){let e=src.indexOf('\n',i);if(e<0)e=n;let line=src.slice(i,e);i=e+1;if(hd.strip)line=line.replace(/^\t+/,'');if(line===hd.delim){found=true;break;}L.push(line);}
    if(!found)throw INC;hd.body=L.join('\n')+(L.length?'\n':'');}continue;}
  if(src.startsWith('((',i)){let d=0,j=i;for(;j<n;j++){if(src[j]==='(')d++;else if(src[j]===')'){d--;if(d===0)break;}}if(j>=n)throw INC;toks.push({k:'arith',v:src.slice(i+2,j-1)});i=j+1;continue;}
  let m;
  if((m=src.slice(i).match(/^(\d*)(<<<|<<-?|>>|>&|>|<)/))||src.startsWith('&>',i)){
   if(src.startsWith('&>',i)){let op='&>';i+=2;if(src[i]==='>'){op='&>>';i++;}toks.push({k:'redir',op,fd:1});continue;}
   const fd=m[1]===''?(m[2][0]==='<'?0:1):+m[1];let op=m[2];i+=m[0].length;
   if(op.startsWith('<<')&&op!=='<<<'){const strip=op==='<<-';while(isWS(src[i]))i++;let j=i,q=false,d='';while(j<n&&!' \t\n;&|<>()'.includes(src[j])){if(src[j]==="'"||src[j]==='"'){q=true;j++;continue;}d+=src[j];j++;}i=j;const t={k:'redir',op:'<<',fd:0,delim:d,quoted:q,strip,body:''};toks.push(t);pend.push(t);continue;}
   toks.push({k:'redir',op,fd});continue;}
  const two=src.slice(i,i+2);
  if(two==='&&'||two==='||'||two===';;'){toks.push({k:'op',v:two});i+=2;continue;}
  if(c===';'||c==='&'||c==='|'||c==='('||c===')'){toks.push({k:'op',v:c});i++;continue;}
  let j=i;
  while(j<n){const d=src[j];
   if(d==='\\'){j+=2;continue;}
   if(d==="'"){const e=src.indexOf("'",j+1);if(e<0)throw INC;j=e+1;continue;}
   if(d==='"'){j=skipDq(src,j);continue;}
   if(d==='`'){const e=src.indexOf('`',j+1);if(e<0)throw INC;j=e+1;continue;}
   if(d==='$'&&src[j+1]==='('){j=skipParen(src,j+1);continue;}
   if(d==='$'&&src[j+1]==='{'){j=skipBrace(src,j+1);continue;}
   if(d==='='&&src[j+1]==='('&&/^[A-Za-z_]\w*$/.test(src.slice(i,j))){j=skipParen(src,j+1);continue;}
   if(' \t\n;&|<>()'.includes(d))break;j++;}
  if(j===i){i++;continue;}
  toks.push({k:'w',raw:src.slice(i,j)});i=j;}
 if(pend.length)throw INC;return toks;}
function parse(src){const toks=lex(src);let p=0;const peek=()=>toks[p];
 const isOp=(t,v)=>t&&t.k==='op'&&t.v===v;const isKw=(t,v)=>t&&t.k==='w'&&t.raw===v;
 const synt=t=>{const e=new Error(`syntax error near unexpected token \`${t?(t.raw||t.v||'newline'):'newline'}'`);e.syntax=true;return e;};
 const skipNL=()=>{while(peek()&&peek().k==='op'&&(peek().v==='\n'||peek().v===';'))p++;};
 const need=kw=>{if(!peek())throw INC;if(!isKw(peek(),kw))throw synt(peek());p++;};
 function plist(stop){const items=[];skipNL();
  while(p<toks.length){const t=peek();if(isOp(t,')')||isOp(t,';;'))break;if(t.k==='w'&&stop.has(t.raw))break;
   const node=pandor();let bg=false;const s=peek();if(s&&s.k==='op'&&(s.v===';'||s.v==='\n'||s.v==='&')){if(s.v==='&')bg=true;p++;}items.push({node,bg});skipNL();}
  return{type:'list',items};}
 function pandor(){const first=ppipe();const rest=[];while(peek()&&(isOp(peek(),'&&')||isOp(peek(),'||'))){const op=toks[p++].v;while(peek()&&isOp(peek(),'\n'))p++;if(!peek())throw INC;rest.push({op,node:ppipe()});}return rest.length?{type:'andor',first,rest}:first;}
 function ppipe(){let neg=false;if(isKw(peek(),'!')){neg=true;p++;}const cmds=[pcmd()];while(isOp(peek(),'|')){p++;skipNLonly();if(!peek())throw INC;cmds.push(pcmd());}return cmds.length===1&&!neg?cmds[0]:{type:'pipe',cmds,neg};}
 function skipNLonly(){while(peek()&&isOp(peek(),'\n'))p++;}
 function redirs(node){while(peek()&&peek().k==='redir'){const r=toks[p++];if(r.op!=='<<'){const t=toks[p++];if(!t)throw INC;if(t.k!=='w')throw synt(t);r.target=t.raw;}(node.redirs=node.redirs||[]).push(r);}return node;}
 function pcmd(){const t=peek();if(!t)throw INC;
  if(t.k==='arith'){p++;return redirs({type:'arith',expr:t.v});}
  if(isOp(t,'(')){p++;const body=plist(new Set());if(!peek())throw INC;if(!isOp(peek(),')'))throw synt(peek());p++;return redirs({type:'subshell',body});}
  if(t.k==='w'){const r=t.raw;
   if(r==='if'){p++;const conds=[];let c=plist(new Set(['then']));need('then');let b=plist(new Set(['elif','else','fi']));conds.push({c,b});let els=null;
    for(;;){if(!peek())throw INC;if(isKw(peek(),'elif')){p++;c=plist(new Set(['then']));need('then');b=plist(new Set(['elif','else','fi']));conds.push({c,b});}else if(isKw(peek(),'else')){p++;els=plist(new Set(['fi']));}else break;}need('fi');return redirs({type:'if',conds,els});}
   if(r==='while'||r==='until'){p++;const cond=plist(new Set(['do']));need('do');const body=plist(new Set(['done']));need('done');return redirs({type:'while',until:r==='until',cond,body});}
   if(r==='for'){p++;const t2=peek();if(!t2)throw INC;
    if(t2.k==='arith'){p++;const parts=t2.v.split(';');skipNL();need('do');const body=plist(new Set(['done']));need('done');return redirs({type:'cfor',init:parts[0]||'',cond:parts[1]||'1',step:parts[2]||'',body});}
    const v=toks[p++].raw;let items=null;skipNLonly();if(isKw(peek(),'in')){p++;items=[];while(peek()&&peek().k==='w')items.push(toks[p++].raw);}skipNL();need('do');const body=plist(new Set(['done']));need('done');return redirs({type:'for',v,items,body});}
   if(r==='case'){p++;const w=toks[p++];if(!w)throw INC;skipNLonly();need('in');skipNL();const cl=[];
    while(peek()&&!isKw(peek(),'esac')){if(isOp(peek(),'('))p++;const pats=[];while(peek()&&!isOp(peek(),')')){const x=toks[p++];if(x.k==='w')pats.push(x.raw);}if(!peek())throw INC;p++;const body=plist(new Set(['esac']));cl.push({pats,body});if(isOp(peek(),';;'))p++;skipNL();}
    need('esac');return redirs({type:'case',word:w.raw,cl});}
   if(r==='function'){p++;const nm=toks[p++];if(!nm)throw INC;if(isOp(peek(),'(')){p++;p++;}skipNL();const body=pcmd();return{type:'func',name:nm.raw,body};}
   if(r==='{'){p++;const body=plist(new Set(['}']));need('}');return redirs({type:'group',body});}
   if(r==='[['){p++;const w=[];while(peek()&&!isKw(peek(),']]')){const x=toks[p++];w.push(x.k==='w'?x.raw:x.v||'');}if(!peek())throw INC;p++;return redirs({type:'dbrack',words:w});}
   if(r==='time'){p++;return{type:'time',node:ppipe()};}
   if(toks[p+1]&&isOp(toks[p+1],'(')&&toks[p+2]&&isOp(toks[p+2],')')&&/^[\w.-]+$/.test(r)){p+=3;skipNL();const body=pcmd();return{type:'func',name:r,body};}}
  return psimple();}
 function psimple(){const assigns=[],words=[],rd=[];let src=[];
  while(p<toks.length){const t=peek();if(t.k==='redir'){const r=toks[p++];if(r.op!=='<<'){const x=toks[p++];if(!x)throw INC;if(x.k!=='w')throw synt(x);r.target=x.raw;}rd.push(r);continue;}
   if(t.k!=='w')break;
   if(!words.length&&/^[A-Za-z_]\w*(\[[^\]]*\])?\+?=/.test(t.raw)){assigns.push(t.raw);p++;src.push(t.raw);continue;}
   words.push(t.raw);src.push(t.raw);p++;}
  if(!words.length&&!assigns.length&&!rd.length){throw synt(peek());}
  return{type:'simple',assigns,words,redirs:rd,src:src.join(' ')};}
 const list=plist(new Set());if(p<toks.length)throw synt(peek());return list;}

/* ---------- variables ---------- */
const SPECIAL=new Set(['?','$','#','@','*','!','0','_','-']);
function getArr(name){for(let i=W.scopes.length-1;i>=0;i--)if(name in W.scopes[i].vars){const v=W.scopes[i].vars[name];return Array.isArray(v)?v:null;}const v=W.vars[name];return Array.isArray(v)?v:null;}
function getVar(name){
 if(/^\d+$/.test(name)){return name==='0'?W.script:W.pos[+name-1];}
 switch(name){case'?':return String(W.status);case'$':return '1122';case'#':return String(W.pos.length);case'@':case'*':return W.pos.join(' ');case'!':return W.lastBg?String(W.lastBg):'';case'RANDOM':return String(Math.floor(Math.random()*32768));case'UID':case'EUID':return String(uidOf(W.user));case'SECONDS':return String((W.t-W.sessStart)*60+W.seq%60);case'HOSTNAME':return W.host;case'LINENO':return '1';case'USER':case'LOGNAME':return W.user;case'HOME':return W.env.HOME||homeOf(W.user);case'PWD':return W.cwd;case'BASH_VERSION':return '5.2.21(1)-release';case'PPID':return '1';}
 for(let i=W.scopes.length-1;i>=0;i--)if(name in W.scopes[i].vars){const v=W.scopes[i].vars[name];return Array.isArray(v)?v[0]:v;}
 if(name in W.vars){const v=W.vars[name];return Array.isArray(v)?v[0]:v;}
 if(name in W.env)return W.env[name];return undefined;}
function setVar(name,val,local){
 if(local&&W.scopes.length){W.scopes[W.scopes.length-1].vars[name]=val;return;}
 for(let i=W.scopes.length-1;i>=0;i--)if(name in W.scopes[i].vars){W.scopes[i].vars[name]=val;return;}
 if(name in W.env&&!Array.isArray(val))W.env[name]=val;else W.vars[name]=val;}
function unbound(name,io){if(W.opts.u&&getVar(name)===undefined&&!SPECIAL.has(name)&&!getArr(name)){io.err.push(`bash: ${name}: unbound variable\n`);throw new Sig('exit',1);}}

/* ---------- arithmetic ---------- */
function arith(src){const T=src.match(/0x[\da-f]+|\d+|[A-Za-z_]\w*|\*\*|<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--|[-+*\/%&|^]=|[-+*\/%()<>=!~&|^?:,]/gi)||[];let i=0;
 const num=n=>{const v=getVar(n);const x=parseInt(v===undefined||v===''?'0':v,10);return isNaN(x)?0:x;};
 const BIN={',':1,'||':4,'&&':5,'|':6,'^':7,'&':8,'==':9,'!=':9,'<':10,'<=':10,'>':10,'>=':10,'<<':11,'>>':11,'+':12,'-':12,'*':13,'/':13,'%':13,'**':14};
 const bin=(o,a,b)=>{switch(o){case',':return b;case'||':return(a||b)?1:0;case'&&':return(a&&b)?1:0;case'|':return a|b;case'^':return a^b;case'&':return a&b;case'==':return a===b?1:0;case'!=':return a!==b?1:0;case'<':return a<b?1:0;case'<=':return a<=b?1:0;case'>':return a>b?1:0;case'>=':return a>=b?1:0;case'<<':return a<<b;case'>>':return a>>b;case'+':return a+b;case'-':return a-b;case'*':return a*b;case'/':if(b===0)throw new Error('division by 0 (error token is "'+b+'")');return Math.trunc(a/b);case'%':if(b===0)throw new Error('division by 0');return a%b;case'**':return Math.pow(a,b);}return 0;};
 function unary(){const t=T[i++];if(t===undefined)return 0;
  if(t==='('){const v=expr(0);i++;return v;}if(t==='-')return -unary();if(t==='+')return unary();if(t==='!')return unary()?0:1;if(t==='~')return ~unary();
  if(t==='++'||t==='--'){const n=T[i++];const v=num(n)+(t==='++'?1:-1);setVar(n,String(v));return v;}
  if(/^0x/i.test(t))return parseInt(t,16);if(/^\d/.test(t))return /^0\d/.test(t)?parseInt(t,8):parseInt(t,10);
  if(/^[A-Za-z_]/.test(t)){if(T[i]==='++'||T[i]==='--'){const v=num(t);setVar(t,String(v+(T[i]==='++'?1:-1)));i++;return v;}return num(t);}return 0;}
 function expr(min){
  if(/^[A-Za-z_]/.test(T[i]||'')&&/^([-+*\/%&|^]?=)$/.test(T[i+1]||'')&&T[i+1]!=='=='){const n=T[i],op=T[i+1];i+=2;const r=expr(2);const v=op==='='?r:bin(op.slice(0,-1),num(n),r);setVar(n,String(v));return v;}
  let l=unary();
  for(;;){const o=T[i];if(o==='?'&&min<=3){i++;const a=expr(2);i++;const b=expr(3);l=l?a:b;continue;}const pr=BIN[o];if(!pr||pr<min||pr<=0)break;if(pr<min)break;i++;const r=o==='**'?expr(pr):expr(pr+1);l=bin(o,l,r);}
  return l;}
 return T.length?expr(0):0;}

/* ---------- glob / pattern helpers ---------- */
function globRe(p,anch=true){let r='';for(let i=0;i<p.length;i++){const c=p[i];if(c==='*')r+='.*';else if(c==='?')r+='.';else if(c==='['){const e=p.indexOf(']',i+2);if(e>0){r+='['+p.slice(i+1,e).replace(/^!/,'^').replace(/\\/g,'\\\\')+']';i=e;}else r+='\\[';}else if(c==='\\'&&i+1<p.length){r+=escRe(p[++i]);}else r+=escRe(c);}return new RegExp(anch?'^'+r+'$':r,'s');}
function expandGlob(pat){const abs=pat.startsWith('/');const segs=pat.split('/').filter((s,i)=>s!==''||i===0).filter(s=>s!=='');let cur=[abs?'/':''];
 for(let k=0;k<segs.length;k++){const seg=segs[k],next=[];const isLast=k===segs.length-1;
  for(const base of cur){if(!/[*?\[]/.test(seg)){const np=base==='/'?'/'+seg:base?base+'/'+seg:seg;if(existsP(np)||!isLast&&isDirP(np))next.push(np);continue;}
   let names=[];try{names=lsDir(base===''?'.':base);}catch(e){continue;}const re=globRe(seg);
   for(const nm of names){if(nm.startsWith('.')&&!seg.startsWith('.'))continue;if(!re.test(nm))continue;const np=base==='/'?'/'+nm:base?base+'/'+nm:nm;if(isLast||isDirP(np))next.push(np);}}
  cur=next;}
 return cur.sort();}
function braceExpand(w){let depth=0,start=-1;for(let i=0;i<w.length;i++){const c=w[i];if(c==='\\'){i++;continue;}if(c==="'"){const e=w.indexOf("'",i+1);if(e<0)return[w];i=e;continue;}if(c==='"'){try{i=skipDq(w,i)-1;}catch(e){return[w];}continue;}
  if(c==='$'&&w[i+1]==='{'){try{i=skipBrace(w,i+1)-1;}catch(e){return[w];}continue;}if(c==='$'&&w[i+1]==='('){try{i=skipParen(w,i+1)-1;}catch(e){return[w];}continue;}
  if(c==='{'){if(depth===0)start=i;depth++;}else if(c==='}'&&depth>0){depth--;if(depth===0){const inner=w.slice(start+1,i);const pre=w.slice(0,start),post=w.slice(i+1);
    const parts=[];let d=0,last=0;for(let k=0;k<inner.length;k++){if(inner[k]==='{')d++;else if(inner[k]==='}')d--;else if(inner[k]===','&&d===0){parts.push(inner.slice(last,k));last=k+1;}}parts.push(inner.slice(last));
    if(parts.length>1)return parts.flatMap(x=>braceExpand(pre+x+post));
    const m=inner.match(/^(-?\d+|[a-zA-Z])\.\.(-?\d+|[a-zA-Z])(?:\.\.(-?\d+))?$/);
    if(m){let a=m[1],b=m[2];const step=Math.abs(+m[3]||1);const out=[];if(/\d/.test(a)){let x=+a,y=+b;const pad=/^-?0\d/.test(m[1])||/^-?0\d/.test(m[2])?Math.max(m[1].length,m[2].length):0;if(x<=y)for(;x<=y;x+=step)out.push(String(x).padStart(pad,'0'));else for(;x>=y;x-=step)out.push(String(x).padStart(pad,'0'));}else{let x=a.charCodeAt(0),y=b.charCodeAt(0);if(x<=y)for(;x<=y;x+=step)out.push(String.fromCharCode(x));else for(;x>=y;x-=step)out.push(String.fromCharCode(x));}return out.flatMap(x=>braceExpand(pre+x+post));}
    start=-1;}}}
 return[w];}

/* ---------- expansion ---------- */
function cmdSub(src,io){const out=[];const sub={inp:{s:'',p:0},out,err:io.err,notty:true};let st=0;try{const ast=parse(src);st=runList(ast,sub,false);}catch(e){if(e instanceof Sig&&e.t==='exit')st=e.n;else if(e&&e.syntax)io.err.push('bash: '+e.message+'\n');else if(!(e instanceof Sig))throw e;}W.status=st;return out.join('').replace(/\n+$/,'');}
function listVal(v){return Array.isArray(v)?v:[v];}
function pexp(s,io,dq){
 let m;if(s[0]==='#'&&s.length>1){const nm=s.slice(1);const am=nm.match(/^(\w+)\[[@*]\]$/);if(am)return String((getArr(am[1])||[]).length);return String((getVar(nm)??'').length);}
 if(s[0]==='!'){const am=s.slice(1).match(/^(\w+)\[[@*]\]$/);if(am){const a=getArr(am[1])||[];return a.map((_,i)=>String(i));}}
 m=s.match(/^([A-Za-z_]\w*|\d+|[@*?$#!-])(?:\[([^\]]*)\])?([\s\S]*)$/);if(!m)return '';
 const name=m[1],idx=m[2],rest=m[3];let val,isArr=false;
 if(idx!==undefined){const a=getArr(name);if(idx==='@'||idx==='*'){val=a||(getVar(name)!==undefined?[getVar(name)]:[]);isArr=true;}else{const k=/^\d+$/.test(idx)?+idx:arith(idx);val=a?a[k]:(k===0?getVar(name):undefined);}}
 else if(name==='@'||name==='*'){val=W.pos.slice();isArr=true;}else{val=getVar(name);}
 if(!rest){if(val===undefined&&idx===undefined)unbound(name,io);return isArr?val:(val??'');}
 const unset=val===undefined||(!isArr&&val==='');const exw=w=>expandStr(w,io);
 let mm;
 if((mm=rest.match(/^(:?)-([\s\S]*)$/)))return(mm[1]?unset:val===undefined)?exw(mm[2]):val;
 if((mm=rest.match(/^(:?)=([\s\S]*)$/))){if(mm[1]?unset:val===undefined){const v=exw(mm[2]);setVar(name,v);return v;}return val;}
 if((mm=rest.match(/^(:?)\+([\s\S]*)$/)))return(mm[1]?!unset:val!==undefined)?exw(mm[2]):'';
 if((mm=rest.match(/^(:?)\?([\s\S]*)$/))){if(mm[1]?unset:val===undefined){io.err.push(`bash: ${name}: ${mm[2]?exw(mm[2]):'parameter null or not set'}\n`);throw new Sig('exit',1);}return val;}
 const apply=f=>isArr?val.map(f):f(String(val??''));
 if((mm=rest.match(/^(##?)([\s\S]*)$/))){const pat=exw(mm[2]);return apply(v=>{const re=globRe(pat,false);if(mm[1]==='#'){for(let k=0;k<=v.length;k++)if(globRe(pat).test(v.slice(0,k)))return v.slice(k);return v;}for(let k=v.length;k>=0;k--)if(globRe(pat).test(v.slice(0,k)))return v.slice(k);return v;});}
 if((mm=rest.match(/^(%%?)([\s\S]*)$/))){const pat=exw(mm[2]);return apply(v=>{if(mm[1]==='%'){for(let k=v.length;k>=0;k--)if(globRe(pat).test(v.slice(k)))return v.slice(0,k);return v;}for(let k=0;k<=v.length;k++)if(globRe(pat).test(v.slice(k)))return v.slice(0,k);return v;});}
 if((mm=rest.match(/^(\/\/?)([^\/]*)(?:\/([\s\S]*))?$/))){const pat=exw(mm[2]),rep=mm[3]!==undefined?exw(mm[3]):'';return apply(v=>{const re=new RegExp(globRe(pat,false).source,mm[1]==='//'?'gs':'s');return v.replace(re,rep);});}
 if((mm=rest.match(/^:(-?\d+)(?::(-?\d+))?$/))){const a=+mm[1];if(isArr)return val.slice(a,mm[2]!==undefined?a+ +mm[2]:undefined);const v=String(val??'');return mm[2]!==undefined?v.substr(a<0?v.length+a:a,+mm[2]):v.slice(a<0?v.length+a:a);}
 if(rest==='^^')return apply(v=>v.toUpperCase());if(rest===',,')return apply(v=>v.toLowerCase());if(rest==='^')return apply(v=>v.charAt(0).toUpperCase()+v.slice(1));
 return isArr?val:(val??'');}
function dollar(w,i,io,dq){
 const q=!!dq;const mk=(s)=>({s:String(s),q,split:!q,glob:false});
 if(w[i+1]==='('){if(w[i+2]==='('){const e=skipParen(w,i+1);const inner=w.slice(i+3,e-2);return{atoms:[mk(String(arithExpand(inner,io)))],end:e};}const e=skipParen(w,i+1);return{atoms:[mk(cmdSub(w.slice(i+2,e-1),io))],end:e};}
 if(w[i+1]==='{'){const e=skipBrace(w,i+1);const v=pexp(w.slice(i+2,e-1),io,dq);if(Array.isArray(v)){const at=[];v.forEach((x,k)=>{if(k)at.push({sep:true});at.push(mk(x));});if(!v.length&&!dq)return{atoms:[],end:e};return{atoms:at,end:e};}return{atoms:[mk(v)],end:e};}
 const m=w.slice(i+1).match(/^([A-Za-z_]\w*|\d|[?$#@*!-])/);if(!m)return{atoms:[{s:'$',q:true}],end:i+1};
 const nm=m[1];if(nm==='@'||nm==='*'){const v=W.pos;const at=[];v.forEach((x,k)=>{if(k)at.push(dq&&nm==='@'?{sep:true}:{s:' ',q:true});at.push(mk(x));});return{atoms:at,end:i+2};}
 const v=getVar(nm);if(v===undefined)unbound(nm,io);return{atoms:[mk(v??'')],end:i+1+nm.length};}
function arithExpand(s,io){const t=s.replace(/\$\(([^()]*)\)/g,(_,c)=>cmdSub(c,io)).replace(/\$\{?(\w+)\}?/g,(_,n)=>getVar(n)??'0');try{return arith(t);}catch(e){io.err.push('bash: '+e.message+'\n');return 0;}}
function expandDq(c,io){const at=[];let i=0;while(i<c.length){const ch=c[i];
 if(ch==='\\'&&'$`"\\\n'.includes(c[i+1]||'')){at.push({s:c[i+1]==='\n'?'':c[i+1],q:true});i+=2;continue;}
 if(ch==='$'){const r=dollar(c,i,io,true);at.push(...r.atoms);i=r.end;continue;}
 if(ch==='`'){const e=c.indexOf('`',i+1);at.push({s:cmdSub(c.slice(i+1,e),io),q:true});i=e+1;continue;}
 let j=i;while(j<c.length&&!'\\$`'.includes(c[j]))j++;if(j===i)j++;at.push({s:c.slice(i,j),q:true});i=j;}
 if(!at.length)at.push({s:'',q:true});return at;}
function expandOne(w,io,noSplit){const at=[];let i=0;if(/^[A-Za-z_]\w*=/.test(w))w=w.replace(/(=|:)~(?=\/|:|$)/g,(m,p)=>p+(W.env.HOME||'/'));
 if(w[0]==='~'){const m=w.match(/^~([\w-]*)(?=\/|$)/);if(m){at.push({s:m[1]===''?(W.env.HOME||'/'):homeOf(m[1]),q:true});i=m[0].length;}}
 while(i<w.length){const ch=w[i];
  if(ch==='\\'){at.push({s:w[i+1]??'',q:true});i+=2;continue;}
  if(ch==="'"){const j=w.indexOf("'",i+1);at.push({s:w.slice(i+1,j),q:true});i=j+1;continue;}
  if(ch==='"'){const e=skipDq(w,i);at.push(...expandDq(w.slice(i+1,e-1),io));i=e;continue;}
  if(ch==='$'){const r=dollar(w,i,io,false);at.push(...r.atoms);i=r.end;continue;}
  if(ch==='`'){const j=w.indexOf('`',i+1);at.push({s:cmdSub(w.slice(i+1,j),io),q:false,split:true});i=j+1;continue;}
  let j=i;while(j<w.length&&!'\\\'"$`'.includes(w[j]))j++;at.push({s:w.slice(i,j),q:false,glob:true});i=j;}
 const fields=[];let cur=null;const flush=()=>{if(cur){fields.push(cur);cur=null;}};
 for(const a of at){if(a.sep){flush();continue;}
  if(a.split&&!noSplit){const parts=a.s.split(/[ \t\n]+/);if(/^[ \t\n]/.test(a.s))flush();parts.forEach((p,k)=>{if(p==='')return;if(!cur)cur={s:'',glob:false,q:false};cur.s+=p;if(k<parts.length-1)flush();});if(/[ \t\n]$/.test(a.s))flush();}
  else{if(!cur)cur={s:'',glob:false,q:false};cur.s+=a.s;if(a.q)cur.q=true;if(a.glob)cur.glob=true;}}
 flush();const out=[];
 for(const f of fields){if(!noSplit&&f.glob&&/[*?\[]/.test(f.s)){const g=expandGlob(f.s);if(g.length){out.push(...g);continue;}}out.push(f.s);}
 return out;}
function expandWords(raws,io){const o=[];for(const r of raws)for(const w of braceExpand(r))o.push(...expandOne(w,io,false));return o;}
function expandStr(raw,io){return expandOne(raw,io,true).join('');}
function expandHeredoc(body,io){return expandDq(body.replace(/\\\n/g,''),io).map(a=>a.s).join('');}

/* ---------- test / [[ ---------- */
function testUnary(op,a,io){try{switch(op){case'-e':return existsP(a);case'-f':return getN(a).t==='f';case'-d':return getN(a).t==='d';case'-L':case'-h':return W.fs[rp(abspath(a),false)]?.t==='l';case'-r':return can(getN(a),4);case'-w':return can(getN(a),2);case'-x':return can(getN(a),1);case'-s':return sizeOf(getN(a))>0;case'-z':return a==='';case'-n':return a!=='';case'-v':return getVar(a)!==undefined;case'-t':return false;case'-b':return getN(a).t==='b';case'-c':return getN(a).t==='c';}}catch(e){return false;}return false;}
function testBin(a,op,b){const n=x=>parseInt(x,10);switch(op){case'=':case'==':return a===b;case'!=':return a!==b;case'-eq':return n(a)===n(b);case'-ne':return n(a)!==n(b);case'-lt':return n(a)<n(b);case'-le':return n(a)<=n(b);case'-gt':return n(a)>n(b);case'-ge':return n(a)>=n(b);case'<':return a<b;case'>':return a>b;case'-nt':case'-ot':case'-ef':return false;}return null;}
function testEval(a,dbl,io){let i=0;
 const prim=()=>{const t=a[i];if(t==='!'){i++;return!prim();}if(t==='('){i++;const v=or();if(a[i]===')')i++;return v;}
  if(a.length-i>=3||(dbl&&i+2<a.length&&['=~','==','=','!=','<','>'].includes(a[i+1]))){const op=a[i+1];if(op==='=~'&&dbl){const re=new RegExp(a[i+2]);const mm=a[i].match(re);W.vars.BASH_REMATCH=mm?[...mm]:[];i+=3;return!!mm;}
    if(dbl&&(op==='=='||op==='='||op==='!=')){const r=globRe(a[i+2]).test(a[i]);i+=3;return op==='!='?!r:r;}const r=testBin(a[i],op,a[i+2]);if(r!==null){i+=3;return r;}}
  if(/^-[a-zA-Z]$/.test(t||'')&&i+1<a.length){const r=testUnary(t,a[i+1],io);i+=2;return r;}i++;return t!==undefined&&t!=='';};
 const and=()=>{let v=prim();while(a[i]==='&&'||a[i]==='-a'){i++;const r=prim();v=v&&r;}return v;};
 const or=()=>{let v=and();while(a[i]==='||'||a[i]==='-o'){i++;const r=and();v=v||r;}return v;};
 return a.length?or():false;}

/* ---------- execution ---------- */
function tlArr(tl,k){const a=[];a.push=function(...x){x.forEach(s=>tl.push({k,s}));return Array.prototype.push.apply(this,x);};return a;}
const mkIO=(inp)=>({inp:inp||{s:'',p:0},out:[],err:[]});
function mkCtx(io){return{io,o:s=>io.out.push(s),e:s=>io.err.push(s),pl:s=>io.out.push(s+'\n'),el:s=>io.err.push(s+'\n'),rest:()=>{const s=io.inp.s.slice(io.inp.p);io.inp.p=io.inp.s.length;return s;},rl:()=>{if(io.inp.p>=io.inp.s.length)return null;let e=io.inp.s.indexOf('\n',io.inp.p);if(e<0)e=io.inp.s.length;const l=io.inp.s.slice(io.inp.p,e);io.inp.p=e+1;return l;},get hasIn(){return io.inp.s.length>0;},run:(argv,sio)=>dispatch(argv,sio||io),sh:(src,sio)=>runString(src,sio||io)};}
function runString(src,io,cond){try{const ast=parse(src);return runList(ast,io,cond);}catch(e){if(e&&e.syntax){io.err.push('bash: '+e.message+'\n');return 2;}if(e===INC){io.err.push('bash: syntax error: unexpected end of file\n');return 2;}throw e;}}
function runList(list,io,cond){let st=0;for(const it of list.items){if(it.bg)st=runBg(it.node,io);else st=runNode(it.node,io,cond);W.status=st;}return st;}
function runBg(node,io){const src=node.src||(node.cmds?node.cmds.map(c=>c.src||'').join(' | '):'job');const argv0=(node.words||[''])[0]||'';
 const longRun=/^(sleep|yes|tail|ping|nc|python3?|watch|stress|dd|cat|tcpdump|top)$/.test(argv0)||node.type==='pipe';
 if(!longRun){const st=runNode(node,io,false);return st;}
 const cpu=/^(yes|stress|dd)$/.test(argv0)||/yes/.test(src)?97:0;const p=addProc({user:W.user,ppid:1122,cmd:src,args:src,st:cpu?'R':'S',cpu,tty:'pts/0',rss:cpu?1500:1100});
 const n=(W.jobs.reduce((a,j)=>Math.max(a,j.n),0)||0)+1;const lm=src.match(/(?:\bnc|ncat|netcat)\s+(?:-\w+\s+)*-\w*l\w*\s+(?:-p\s+)?(\d+)/)||src.match(/-p\s+(\d+).*-\w*l|http\.server\s+(\d+)/)||src.match(/ssh\s+.*-\w*[NfL]\w*.*-L\s*(\d+):/);if(lm){const port=+(lm[1]||lm[2]);p.listen=[{port,proto:'tcp',addr:'0.0.0.0'}];}W.jobs.push({n,pid:p.pid,cmd:src,state:'Running'});W.lastBg=p.pid;io.err.push(`[${n}] ${p.pid}\n`);return 0;}
function runNode(node,io,cond){
 switch(node.type){
  case'list':return runList(node,io,cond);
  case'andor':{let st=runNode(node.first,io,true);for(let k=0;k<node.rest.length;k++){const r=node.rest[k];const last=k===node.rest.length-1;if(r.op==='&&'?st===0:st!==0)st=runNode(r.node,io,last?cond:true);}W.status=st;if(st!==0&&W.opts.e&&!cond)throw new Sig('exit',st);return st;}
  case'pipe':return runPipe(node,io,cond);
  default:return runCmd(node,io,cond);}}
function runPipe(node,io,cond){const cmds=node.cmds;let st=0;const top=W.depth===0;const stages=[];
 if(cmds.length===1)st=runNode(cmds[0],io,node.neg?true:cond);
 else{let prev=io.inp;const sts=[];for(let k=0;k<cmds.length;k++){const last=k===cmds.length-1;const sio={inp:prev,out:last?io.out:[],err:io.err,notty:!last||io.notty};const before=last?io.out.length:0;W.depth++;let s;try{s=runNode(cmds[k],sio,true);}finally{W.depth--;}sts.push(s);
   const outS=last?io.out.slice(before).join(''):sio.out.join('');if(top)stages.push({src:cmds[k].src||cmds[k].type,n:lines(outS).length,pre:lines(outS).slice(0,2)});prev={s:last?'':outS,p:0};}
  st=W.opts.pipefail?([...sts].reverse().find(x=>x!==0)||0):sts[sts.length-1];if(top&&W.trace)W.trace.push(stages);}
 if(node.neg)st=st===0?1:0;W.status=st;if(st!==0&&W.opts.e&&!cond)throw new Sig('exit',st);return st;}
function withRedirs(reds,io,fn){if(!reds||!reds.length)return fn(io);const lio={inp:io.inp,out:io.out,err:io.err,notty:io.notty};const writes=[];
 for(const r of reds){const tgt=r.op==='<<'?null:expandStr(r.target,io);
  switch(r.op){
   case'>':case'>>':{const fd=r.fd;if(tgt==='/dev/null'){if(fd===1)lio.out=[];else lio.err=[];break;}try{writeF(tgt,'',r.op==='>>');}catch(e){io.err.push(`bash: ${tgt}: ${ERRTXT[e.code]||e.message}\n`);return 1;}const buf=[];if(fd===2)lio.err=buf;else{lio.out=buf;lio.notty=true;}writes.push({buf,tgt});break;}
   case'&>':case'&>>':{try{writeF(tgt,'',r.op==='&>>');}catch(e){io.err.push(`bash: ${tgt}: ${ERRTXT[e.code]||e.message}\n`);return 1;}const buf=[];lio.out=buf;lio.err=buf;writes.push({buf,tgt});break;}
   case'>&':if(r.fd===2&&tgt==='1')lio.err=lio.out;else if(r.fd===1&&tgt==='2')lio.out=lio.err;break;
   case'<':try{lio.inp={s:readF(tgt),p:0};}catch(e){io.err.push(`bash: ${tgt}: ${ERRTXT[e.code]||e.message}\n`);return 1;}break;
   case'<<':lio.inp={s:r.quoted?r.body:expandHeredoc(r.body,io),p:0};break;
   case'<<<':lio.inp={s:tgt+'\n',p:0};break;}}
 const st=fn(lio);for(const w of writes){try{writeF(w.tgt,w.buf.join(''),true);}catch(e){io.err.push(`bash: ${w.tgt}: ${ERRTXT[e.code]||e.message}\n`);}}return st;}
function runCmd(node,io,cond){
 if(node.type==='func'){W.funcs[node.name]=node.body;return 0;}
 if(node.type==='time'){const t0=W.seq;const st=runNode(node.node,io,cond);io.err.push(`\nreal\t0m0.0${(W.seq%7)+3}s\nuser\t0m0.00${W.seq%5}s\nsys\t0m0.00${W.seq%3}s\n`);return st;}
 return withRedirs(node.redirs,io,lio=>{let st;
  switch(node.type){
   case'simple':st=runSimple(node,lio,cond);break;
   case'if':{st=0;let done=false;for(const{c,b}of node.conds){if(runList(c,lio,true)===0){st=runList(b,lio,cond);done=true;break;}}if(!done&&node.els)st=runList(node.els,lio,cond);break;}
   case'while':{st=0;let guard=0;while(guard++<5000){const c=runList(node.cond,lio,true);if(node.until?c===0:c!==0)break;try{st=runList(node.body,lio,cond);}catch(e){if(e instanceof Sig&&e.t==='break'){if(e.n>1)throw new Sig('break',e.n-1);break;}if(e instanceof Sig&&e.t==='continue'){if(e.n>1)throw new Sig('continue',e.n-1);continue;}throw e;}}break;}
   case'for':{st=0;const items=node.items===null?W.pos.slice():expandWords(node.items,lio);for(const it of items){setVar(node.v,it);try{st=runList(node.body,lio,cond);}catch(e){if(e instanceof Sig&&e.t==='break'){if(e.n>1)throw new Sig('break',e.n-1);break;}if(e instanceof Sig&&e.t==='continue'){if(e.n>1)throw new Sig('continue',e.n-1);continue;}throw e;}}break;}
   case'cfor':{st=0;if(node.init.trim())arith(node.init);let guard=0;while(guard++<5000&&(node.cond.trim()?arith(node.cond):1)){try{st=runList(node.body,lio,cond);}catch(e){if(e instanceof Sig&&e.t==='break')break;if(e instanceof Sig&&e.t==='continue'){}else throw e;}if(node.step.trim())arith(node.step);}break;}
   case'case':{const w=expandStr(node.word,lio);st=0;outer:for(const c of node.cl){for(const p of c.pats){if(globRe(expandStr(p,lio)).test(w)){st=runList(c.body,lio,cond);break outer;}}}break;}
   case'group':st=runList(node.body,lio,cond);break;
   case'subshell':{const save={vars:{...W.vars},env:{...W.env},cwd:W.cwd,pos:W.pos.slice()};try{st=runList(node.body,lio,cond);}catch(e){if(e instanceof Sig&&e.t==='exit')st=e.n;else throw e;}W.vars=save.vars;W.env=save.env;W.cwd=save.cwd;W.pos=save.pos;break;}
   case'dbrack':{const ws=node.words.map(x=>/^(&&|\|\||\(|\)|!|=~|==|!=|<|>|=)$/.test(x)?x:expandStr(x,lio));st=testEval(ws,true,lio)?0:1;break;}
   case'arith':try{st=arith(node.expr)?0:1;}catch(e){lio.err.push('bash: '+e.message+'\n');st=1;}break;
   default:st=0;}
  return st;});}
function runSimple(node,io,cond){
 const tmp={};const arrAssign=[];
 for(const a of node.assigns){const m=a.match(/^([A-Za-z_]\w*)(?:\[([^\]]*)\])?(\+?)=([\s\S]*)$/);const nm=m[1];let v=m[4];
  if(v.startsWith('(')&&v.endsWith(')')&&m[2]===undefined){const items=expandWords(tokenizeSimple(v.slice(1,-1)),io);const val=m[3]?[...(getArr(nm)||[]),...items]:items;if(node.words.length)tmp[nm]=val;else setVar(nm,val);continue;}
  const val=expandStr(v.replace(/(^|:)~(?=\/|:|$)/g,(mm,pp)=>pp+(W.env.HOME||'/')),io);if(m[2]!==undefined){const arr=(getArr(nm)||[]).slice();arr[/^\d+$/.test(m[2])?+m[2]:arith(m[2])]=val;setVar(nm,arr);continue;}
  const fin=m[3]?(getVar(nm)||'')+val:val;if(node.words.length)tmp[nm]=fin;else setVar(nm,fin);}
 if(!node.words.length)return 0;
 let argv=expandWords(node.words,io);if(!argv.length)return 0;
 for(let guard=0;guard<4&&W.aliases[argv[0]]&&!node.noalias;guard++){const rep=tokenizeSimple(W.aliases[argv[0]]).flatMap(x=>expandOne(x,io,false));const nm=argv[0];argv=[...rep,...argv.slice(1)];if(argv[0]===nm)break;}
 const saved={};for(const k in tmp){saved[k]=W.env[k];W.env[k]=Array.isArray(tmp[k])?tmp[k].join(' '):tmp[k];}
 if(W.opts.x)io.err.push('+ '+argv.join(' ')+'\n');
 let st;try{st=dispatch(argv,io);}finally{for(const k in saved){if(saved[k]===undefined)delete W.env[k];else W.env[k]=saved[k];}}
 if(st!==0&&W.traps.ERR&&!cond&&!W.inTrap){W.inTrap=true;try{runString(W.traps.ERR,io);}finally{W.inTrap=false;}}
 if(st!==0&&W.opts.e&&!cond)throw new Sig('exit',st);return st;}
function tokenizeSimple(s){try{return lex(s).filter(t=>t.k==='w').map(t=>t.raw);}catch(e){return s.split(/\s+/).filter(Boolean);}}
const BUILTIN={};const CMD={};
function callFunc(name,args,io){if(W.scopes.length>60){io.err.push('bash: maximum function nesting level exceeded\n');return 1;}const saved=W.pos;W.pos=args;W.scopes.push({vars:{}});let st=0;try{st=runNode(W.funcs[name],io,false);}catch(e){if(e instanceof Sig&&e.t==='return')st=e.n;else throw e;}finally{W.scopes.pop();W.pos=saved;}return st;}
function runScriptFile(path,args,io,viaBash){let n;try{n=getN(path);}catch(e){io.err.push(`bash: ${path}: ${ERRTXT[e.code]}\n`);return 127;}
 if(n.t==='d'){io.err.push(`bash: ${path}: Is a directory\n`);return 126;}
 if(!viaBash&&!can(n,1)){io.err.push(`bash: ${path}: Permission denied\n`);return 126;}
 let src;try{src=readF(path);}catch(e){io.err.push(`bash: ${path}: ${ERRTXT[e.code]}\n`);return 126;}
 const first=src.split('\n')[0];const interp=first.startsWith('#!')?first:'';
 if(src.startsWith('\x7fELF')){return 0;}
 if(interp&&/python/.test(interp)){io.out.push('(python scripts are not simulated in the garden)\n');return 0;}
 const sp=W.pos,ss=W.script,so=W.opts;W.pos=args;W.script=path;W.opts={...so};W.scopes.push({vars:{}});let st=0;
 try{const ast=parse(src);st=runList(ast,io,false);}catch(e){if(e instanceof Sig&&(e.t==='exit'||e.t==='return'))st=e.n;else if(e&&e.syntax){io.err.push(`${path}: ${e.message}\n`);st=2;}else if(e===INC){io.err.push(`${path}: syntax error: unexpected end of file\n`);st=2;}else throw e;}
 finally{if(W.traps.EXIT){const t=W.traps.EXIT;delete W.traps.EXIT;try{runString(t,io);}catch(e){}}W.scopes.pop();W.pos=sp;W.script=ss;W.opts=so;}return st;}
function dispatch(argv,io){const name=argv[0];const args=argv.slice(1);
 try{
  if(W.funcs[name])return callFunc(name,args,io);
  if(BUILTIN[name])return BUILTIN[name](mkCtx(io),args)||0;
  if(name.includes('/')){const ap=abspath(name);const base=basename(ap);const nd=W.fs[rp(ap)];
   if(nd&&nd.t==='f'&&/^\/(usr\/)?(s?bin|local\/bin)\//.test(ap)&&CMD[base]&&!(nd.c&&!nd.c.startsWith('\x7fELF')))return CMD[base](mkCtx(io),args)||0;
   return runScriptFile(name,args,io,false);}
  const miss=cmdMissing(name);
  if(CMD[name]&&!miss)return CMD[name](mkCtx(io),args)||0;
  if(CMD[name]&&miss){io.err.push(`Command '${name}' not found, but can be installed with:\nsudo apt install ${miss}\n`);return 127;}
  {const pth=whichPath(name);if(pth){const nd=W.fs[pth];if(nd&&nd.t==='f'&&(nd.c||'').startsWith('\x7fELF'))return 0;if(nd&&nd.t==='f'&&can(nd,1))return runScriptFile(pth,args,io,false);}}
  io.err.push(`${name}: command not found\n`);return 127;
 }catch(e){
  if(e instanceof Sig)throw e;
  if(e instanceof FsErr){io.err.push(`${name}: ${e.path}: ${ERRTXT[e.code]||e.code}\n`);return 1;}
  io.err.push(`bash: ${name}: internal simulator error (${e.message})\n`);return 1;}}

/* top-level entry: returns {chunks:[{k,s}], status, trace, incomplete} */
function execLine(src){W.note='';W.curLine=src;const tl=[];const io={inp:{s:'',p:0},out:tlArr(tl,'o'),err:tlArr(tl,'e')};W.trace=[];W.depth=0;let st=0;
 let ast;try{ast=parse(src);}catch(e){if(e===INC)return{incomplete:true};if(e&&e.syntax){io.err.push('bash: '+e.message+'\n');return{chunks:tl,status:2,trace:[]};}throw e;}
 try{st=runList(ast,io,false);}catch(e){if(e instanceof Sig){if(e.t==='exit'){st=e.n;W.exited=true;}else st=e.n;}else throw e;}
 W.status=st;return{chunks:tl,status:st,trace:W.trace,note:W.note};}
function runSilent(line){const r=execLine(line);return r.chunks?r.chunks.map(c=>c.s).join(''):'';}
