/* ================= BUILTINS + TEXT/FILE COMMANDS ================= */
function po(tokens,valued=[]){const pos=[],f={};for(let i=0;i<tokens.length;i++){const t=tokens[i];
 if(t==='--'){pos.push(...tokens.slice(i+1));break;}
 if(t.startsWith('--')){const eq=t.indexOf('=');if(eq>0)f[t.slice(0,eq)]=t.slice(eq+1);else if(valued.includes(t))f[t]=tokens[++i];else f[t]=true;}
 else if(t.startsWith('-')&&t.length>1&&!/^-\d+$/.test(t)){const L=t.slice(1).split('');for(let k=0;k<L.length;k++){const key='-'+L[k];if(valued.includes(key)){if(k<L.length-1){f[key]=t.slice(k+2);break;}f[key]=tokens[++i];}else f[key]=true;}}
 else if(/^-\d+$/.test(t)){f.num=+t.slice(1);f[t]=true;}
 else pos.push(t);}return{pos,f};}
function lead(a,valued=[]){const f={};let i=0;for(;i<a.length;i++){const t=a[i];if(!t.startsWith('-')||t==='-')break;if(t==='--'){i++;break;}const eq=t.indexOf('=');const k=eq>0?t.slice(0,eq):t;if(valued.includes(k)){f[k]=eq>0?t.slice(eq+1):a[++i];}else if(t.startsWith('--'))f[t]=true;else{for(const ch of t.slice(1)){const kk='-'+ch;if(valued.includes(kk)){f[kk]=a[++i];break;}f[kk]=true;}}}return{f,rest:a.slice(i)};}
const hasF=(f,...k)=>k.some(x=>f[x]);const valF=(f,...k)=>{for(const x of k)if(f[x]!==undefined&&f[x]!==true)return f[x];return undefined;};
const fsMsg=(c,cmd,e,verb)=>c.el(`${cmd}: ${verb?verb+" '"+e.path+"'":e.path}: ${ERRTXT[e.code]||e.code}`);
function inputs(c,files,cmd){const out=[];let bad=false;if(!files.length){out.push({name:'-',text:c.rest()});return{out,bad};}
 for(const f of files){if(f==='-'){out.push({name:'-',text:c.rest()});continue;}try{out.push({name:f,text:readF(f)});}catch(e){bad=true;fsMsg(c,cmd,e);}}return{out,bad};}
function escSeq(s){return s.replace(/\\(n|t|r|\\|e|a|0[0-7]{0,3}|x[0-9a-f]{1,2})/gi,(m,x)=>x==='n'?'\n':x==='t'?'\t':x==='r'?'\r':x==='\\'?'\\':x==='e'?'\x1b':x==='a'?'\x07':x[0]==='x'?String.fromCharCode(parseInt(x.slice(1),16)):String.fromCharCode(parseInt(x.slice(1)||'0',8)));}
function modeStr(n){const m=n.m;const t=n.t==='d'?'d':n.t==='l'?'l':n.t==='c'?'c':n.t==='b'?'b':'-';const r=(b,s,sp)=>((m>>b)&4?'r':'-')+((m>>b)&2?'w':'-')+(sp?((m>>b)&1?(s==='t'?'t':'s'):(s==='t'?'T':'S')):((m>>b)&1?'x':'-'));
 return t+r(6,'s',m&0o4000)+r(3,'s',m&0o2000)+r(0,'t',m&0o1000)+(n.acl&&n.acl.length?'+':'');}
const fakeIno=p=>1000000+parseInt(sha(p).slice(0,5),16)%900000;
function printf(fmt,args){let ai=0;const run=()=>fmt.replace(/%(-?\d*)(?:\.(\d+))?([sdifxXoceEgGb%])|\\(n|t|r|\\|e|a|0\d*|")/g,(m,w,pr,t,esc)=>{
  if(esc)return esc==='n'?'\n':esc==='t'?'\t':esc==='r'?'\r':esc==='\\'?'\\':esc==='"'?'"':esc==='e'?'\x1b':esc==='a'?'\x07':'\0';
  if(t==='%')return '%';const a=args[ai++];let v;
  switch(t){case's':case'b':v=a===undefined?'':String(a);if(pr!==undefined)v=v.slice(0,+pr);break;case'c':v=a===undefined?'':String(a)[0]||'';break;case'd':case'i':v=String(parseInt(a||'0',10)||0);break;case'f':case'e':case'E':case'g':case'G':v=(parseFloat(a||'0')||0).toFixed(pr===undefined?6:+pr);break;case'x':v=(parseInt(a||'0',10)||0).toString(16);break;case'X':v=(parseInt(a||'0',10)||0).toString(16).toUpperCase();break;case'o':v=(parseInt(a||'0',10)||0).toString(8);break;default:v='';}
  if(w){const wd=Math.abs(parseInt(w,10));if(w[0]==='-')v=v.padEnd(wd);else v=(w[0]==='0'&&/[dfxXoeEgG]/.test(t))?v.padStart(wd,'0'):v.padStart(wd);}return v;});
 let out=run();if(args.length>ai&&/%[^%]/.test(fmt)){while(ai<args.length){out+=run();}}return out;}

/* ---- builtins ---- */
BUILTIN.cd=(c,a)=>{let t=a[0];if(t==='-'){t=W.vars.OLDPWD||W.cwd;c.pl(t);}if(t===undefined||t==='')t=W.env.HOME||'/';const p=abspath(t);
 try{const n=getN(p);if(n.t!=='d'){c.el(`bash: cd: ${a[0]}: Not a directory`);return 1;}if(!can(n,1)){c.el(`bash: cd: ${a[0]}: Permission denied`);return 1;}}catch(e){c.el(`bash: cd: ${a[0]??t}: ${ERRTXT[e.code]}`);return 1;}
 W.vars.OLDPWD=W.cwd;W.cwd=rp(p);W.env.PWD=W.cwd;return 0;};
BUILTIN.pwd=(c)=>{c.pl(W.cwd);return 0;};
BUILTIN.echo=(c,a)=>{let n=false,e=false,i=0;for(;i<a.length&&/^-[neE]+$/.test(a[i]);i++){if(a[i].includes('n'))n=true;if(a[i].includes('e'))e=true;}let s=a.slice(i).join(' ');if(e)s=escSeq(s);c.o(s+(n?'':'\n'));return 0;};
BUILTIN.printf=(c,a)=>{if(!a.length){c.el('printf: usage: printf format [arguments]');return 2;}let o=printf(a[0],a.slice(1));c.o(o);return 0;};
BUILTIN.true=()=>0;BUILTIN.false=()=>1;BUILTIN[':']=()=>0;
BUILTIN.export=(c,a)=>{for(const x of a){if(x==='-p'){Object.keys(W.env).sort().forEach(k=>c.pl(`declare -x ${k}="${W.env[k]}"`));continue;}if(x.startsWith('-'))continue;const i=x.indexOf('=');if(i>0){const k=x.slice(0,i);W.env[k]=x.slice(i+1);delete W.vars[k];}else{const v=getVar(x);W.env[x]=v===undefined?'':v;delete W.vars[x];}}return 0;};
BUILTIN.unset=(c,a)=>{for(const x of a){if(x==='-f'||x==='-v')continue;delete W.vars[x];delete W.env[x];delete W.funcs[x];}return 0;};
BUILTIN.env=(c,a)=>{const asg={};let i=0;for(;i<a.length&&/^[A-Za-z_]\w*=/.test(a[i]);i++){const k=a[i].split('=')[0];asg[k]=a[i].slice(k.length+1);}
 if(i>=a.length){Object.entries({...W.env,...asg}).forEach(([k,v])=>c.pl(`${k}=${v}`));return 0;}const sv={};for(const k in asg){sv[k]=W.env[k];W.env[k]=asg[k];}try{return c.run(a.slice(i));}finally{for(const k in sv){if(sv[k]===undefined)delete W.env[k];else W.env[k]=sv[k];}}};
BUILTIN.printenv=(c,a)=>{if(!a.length){Object.entries(W.env).forEach(([k,v])=>c.pl(`${k}=${v}`));return 0;}let st=0;a.forEach(k=>{if(W.env[k]!==undefined)c.pl(W.env[k]);else st=1;});return st;};
BUILTIN.set=(c,a)=>{if(!a.length){Object.entries({...W.env,...W.vars}).sort().forEach(([k,v])=>c.pl(`${k}=${Array.isArray(v)?'('+v.join(' ')+')':v}`));return 0;}
 for(let i=0;i<a.length;i++){const x=a[i];if(x==='--'){W.pos=a.slice(i+1);break;}if(x==='-o'||x==='+o'){const o=a[++i];if(o==='pipefail')W.opts.pipefail=x==='-o';if(o==='errexit')W.opts.e=x==='-o';if(o==='nounset')W.opts.u=x==='-o';continue;}
  if(/^[-+][a-z]+$/.test(x)){const on=x[0]==='-';for(const ch of x.slice(1)){if(ch==='e')W.opts.e=on;if(ch==='u')W.opts.u=on;if(ch==='x')W.opts.x=on;}}}return 0;};
BUILTIN.alias=(c,a)=>{if(!a.length){Object.entries(W.aliases).forEach(([k,v])=>c.pl(`alias ${k}='${v}'`));return 0;}for(const x of a){const i=x.indexOf('=');if(i>0)W.aliases[x.slice(0,i)]=x.slice(i+1);else if(W.aliases[x])c.pl(`alias ${x}='${W.aliases[x]}'`);else{c.el(`bash: alias: ${x}: not found`);return 1;}}return 0;};
BUILTIN.unalias=(c,a)=>{a.forEach(x=>{if(x==='-a')W.aliases={};else delete W.aliases[x];});return 0;};
const BNAMES=['cd','pwd','echo','printf','export','unset','set','alias','unalias','type','command','history','source','.','exit','return','break','continue','local','declare','typeset','readonly','read','test','[','[[','true','false',':','shift','trap','eval','wait','jobs','bg','fg','disown','umask','ulimit','let','getopts','mapfile','readarray','shopt','hash','exec','builtin'];
function whichPath(n){for(const d of W.env.PATH.split(':')){const p=d+'/'+n;const nd=W.fs[p];if(nd&&nd.t!=='d')return p;}return null;}
BUILTIN.type=(c,a)=>{let st=0;const{pos,f}=po(a);for(const n of pos){
 if(W.aliases[n])c.pl(hasF(f,'-t')?'alias':`${n} is aliased to \`${W.aliases[n]}'`);else if(W.funcs[n]){c.pl(hasF(f,'-t')?'function':`${n} is a function`);}else if(BNAMES.includes(n)||BUILTIN[n])c.pl(hasF(f,'-t')?'builtin':`${n} is a shell builtin`);
 else{const p=whichPath(n);if(p&&!cmdMissing(n))c.pl(hasF(f,'-t')?'file':`${n} is ${p}`);else{if(!hasF(f,'-t'))c.el(`bash: type: ${n}: not found`);st=1;}}}return st;};
BUILTIN.command=(c,a)=>{if(a[0]==='-v'||a[0]==='-V'){let st=0;for(const n of a.slice(1)){if(W.aliases[n])c.pl(`alias ${n}='${W.aliases[n]}'`);else if(BNAMES.includes(n)||W.funcs[n])c.pl(n);else{const p=whichPath(n);if(p&&!cmdMissing(n))c.pl(p);else st=1;}}return st;}const sv=W.funcs;W.funcs={};try{return c.run(a);}finally{W.funcs=sv;}};
BUILTIN.builtin=(c,a)=>BUILTIN[a[0]]?BUILTIN[a[0]](c,a.slice(1)):1;
BUILTIN.history=(c,a)=>{if(a[0]==='-c'){W.hist=[];return 0;}const n=a[0]?+a[0]:W.hist.length;W.hist.slice(-n).forEach((h,i,arr)=>c.pl(String(W.hist.length-arr.length+i+1).padStart(5)+'  '+h));return 0;};
BUILTIN.source=(c,a)=>{if(!a[0]){c.el('bash: source: filename argument required');return 2;}return runScriptFile(a[0],a.slice(1),c.io,true);};BUILTIN['.']=BUILTIN.source;
BUILTIN.exit=(c,a)=>{throw new Sig('exit',a[0]!==undefined?parseInt(a[0],10)&255:W.status);};
BUILTIN.return=(c,a)=>{throw new Sig('return',a[0]!==undefined?parseInt(a[0],10):W.status);};
BUILTIN.break=(c,a)=>{throw new Sig('break',+a[0]||1);};BUILTIN.continue=(c,a)=>{throw new Sig('continue',+a[0]||1);};
BUILTIN.local=(c,a)=>{for(const x of a){if(x.startsWith('-'))continue;const i=x.indexOf('=');if(i>0)setVar(x.slice(0,i),x.slice(i+1),true);else setVar(x,'',true);}return 0;};
BUILTIN.declare=(c,a)=>{const{pos,f}=po(a);if(hasF(f,'-p')){pos.forEach(n=>{const v=getVar(n);c.pl(`declare -- ${n}="${v??''}"`);});return 0;}
 for(const x of pos){const i=x.indexOf('=');const n=i>0?x.slice(0,i):x;let v=i>0?x.slice(i+1):(hasF(f,'-a')?[]:'');if(hasF(f,'-i'))v=String(arith(String(v)));if(v.startsWith&&v.startsWith('(')&&v.endsWith(')'))v=tokenizeSimple(v.slice(1,-1));setVar(n,v,W.scopes.length>0);if(hasF(f,'-x')){W.env[n]=Array.isArray(v)?v.join(' '):v;}}return 0;};
BUILTIN.typeset=BUILTIN.declare;BUILTIN.readonly=(c,a)=>{a.forEach(x=>{const i=x.indexOf('=');if(i>0)setVar(x.slice(0,i),x.slice(i+1));});return 0;};
BUILTIN.read=(c,a)=>{const{pos,f}=po(a,['-p','-a','-n','-t','-d','-N']);const pr=valF(f,'-p');if(pr)c.e(pr);const line=c.rl();if(line===null)return 1;const ifs=/[ \t]+/;const vars=pos.length?pos:['REPLY'];
 if(hasF(f,'-a')){setVar(valF(f,'-a'),line.trim().split(ifs).filter(Boolean));return 0;}
 let text=hasF(f,'-r')?line:line.replace(/\\(.)/g,'$1');if(vars.length===1&&vars[0]!=='REPLY'){setVar(vars[0],text.replace(/^[ \t]+|[ \t]+$/g,''));return 0;}if(vars[0]==='REPLY'){setVar('REPLY',text);return 0;}
 const parts=text.trim().split(ifs);vars.forEach((v,i)=>{setVar(v,i===vars.length-1?parts.slice(i).join(' '):(parts[i]||''));});return 0;};
BUILTIN.mapfile=(c,a)=>{const{pos,f}=po(a);const t=c.rest();let L=t.split('\n');if(L[L.length-1]==='')L.pop();if(!hasF(f,'-t'))L=L.map(x=>x+'\n');setVar(pos[0]||'MAPFILE',L);return 0;};BUILTIN.readarray=BUILTIN.mapfile;
BUILTIN.test=(c,a)=>testEval(a,false,c.io)?0:1;BUILTIN['[']=(c,a)=>{if(a[a.length-1]!==']'){c.el("bash: [: missing `]'");return 2;}return testEval(a.slice(0,-1),false,c.io)?0:1;};
BUILTIN.shift=(c,a)=>{const n=+a[0]||1;if(n>W.pos.length)return 1;W.pos=W.pos.slice(n);return 0;};
BUILTIN.trap=(c,a)=>{if(!a.length){Object.entries(W.traps).forEach(([k,v])=>c.pl(`trap -- '${v}' ${k}`));return 0;}if(a[0]==='-l'){c.pl('1) SIGHUP 2) SIGINT 3) SIGQUIT 9) SIGKILL 15) SIGTERM');return 0;}
 const cmd=a[0];a.slice(1).forEach(s=>{s=s.replace(/^SIG/,'');if(cmd==='-')delete W.traps[s];else W.traps[s]=cmd;});return 0;};
BUILTIN.eval=(c,a)=>runString(a.join(' '),c.io);BUILTIN.wait=()=>0;BUILTIN.shopt=()=>0;BUILTIN.hash=()=>0;BUILTIN.exec=(c,a)=>a.length?c.run(a):0;
BUILTIN.let=(c,a)=>{let v=0;try{a.forEach(x=>{v=arith(x);});}catch(e){return 1;}return v?0:1;};
BUILTIN.jobs=(c,a)=>{W.jobs=W.jobs.filter(j=>procBy(j.pid));const last=W.jobs.length;W.jobs.forEach((j,i)=>c.pl(`[${j.n}]${i===last-1?'+':i===last-2?'-':' '}  ${hasF(po(a).f,'-l')?j.pid+' ':''}${j.state.padEnd(10)}${j.cmd}${j.state==='Running'?' &':''}`));return 0;};
const jobArg=a=>{const m=(a[0]||'').match(/^%?(\d+)?$/);const js=W.jobs;return m&&m[1]?js.find(j=>j.n===+m[1]):js[js.length-1];};
BUILTIN.fg=(c,a)=>{const j=jobArg(a);if(!j){c.el('bash: fg: current: no such job');return 1;}c.pl(j.cmd);killTree(j.pid);W.jobs=W.jobs.filter(x=>x!==j);c.e('^C\n');return 130;};
BUILTIN.bg=(c,a)=>{const j=jobArg(a);if(!j){c.el('bash: bg: current: no such job');return 1;}j.state='Running';const p=procBy(j.pid);if(p&&p.st==='T')p.st='S';c.pl(`[${j.n}]+ ${j.cmd} &`);return 0;};
BUILTIN.disown=(c,a)=>{const j=jobArg(a);if(j)W.jobs=W.jobs.filter(x=>x!==j);return 0;};
BUILTIN.umask=(c,a)=>{if(!a.length){c.pl(W.umask.toString(8).padStart(4,'0'));return 0;}if(a[0]==='-S'){const m=W.umask;const s=b=>((~m>>b)&4?'r':'')+((~m>>b)&2?'w':'')+((~m>>b)&1?'x':'');c.pl(`u=${s(6)},g=${s(3)},o=${s(0)}`);return 0;}if(!/^[0-7]{3,4}$/.test(a[0])){c.el(`bash: umask: ${a[0]}: octal number out of range`);return 1;}W.umask=parseInt(a[0],8);return 0;};
BUILTIN.ulimit=(c,a)=>{const t={'-n':1024,'-u':31202,'-c':0,'-s':8192,'-v':'unlimited','-t':'unlimited','-f':'unlimited','-m':'unlimited','-l':64,'-i':15601};if(a[0]==='-a'){[['core file size (blocks, -c)','-c'],['file size (blocks, -f)','-f'],['open files (-n)','-n'],['stack size (kbytes, -s)','-s'],['max user processes (-u)','-u'],['virtual memory (kbytes, -v)','-v']].forEach(([l,k])=>c.pl(l.padEnd(32)+t[k]));return 0;}
 if(a.length>1){if(a[0]==='-n')W.ulim=+a[1];return 0;}c.pl(String(a[0]==='-n'&&W.ulim?W.ulim:t[a[0]||'-f']));return 0;};
BUILTIN.getopts=(c,a)=>{const[opts,name]=a;const args=a.length>2?a.slice(2):W.pos;let idx=+(W.vars.OPTIND||1);if(idx>args.length||!args[idx-1]||!args[idx-1].startsWith('-')||args[idx-1]==='-'){return 1;}
 const arg=args[idx-1];const ch=arg[1];const k=opts.replace(/^:/,'');const pi=k.indexOf(ch);if(pi<0){setVar(name,'?');if(!opts.startsWith(':'))c.el(`bash: illegal option -- ${ch}`);W.vars.OPTIND=String(idx+1);return 0;}
 setVar(name,ch);if(k[pi+1]===':'){const v=arg.length>2?arg.slice(2):args[idx];W.vars.OPTARG=v;idx+=arg.length>2?1:2;}else idx++;W.vars.OPTIND=String(idx);return 0;};

/* ---- external-ish commands: files ---- */
CMD.which=(c,a)=>{let st=0;a.forEach(n=>{const p=whichPath(n);if(p&&!cmdMissing(n))c.pl(p);else st=1;});return st;};
CMD.clear=(c)=>{W.clearReq=true;return 0;};
CMD.sleep=(c,a)=>{if(!a.length){c.el("sleep: missing operand");return 1;}if(!/^[\d.]+[smhd]?$/.test(a[0])){c.el(`sleep: invalid time interval '${a[0]}'`);return 1;}return 0;};
CMD.date=(c,a)=>{const{pos,f}=po(a,['-d','--date']);const fmt=pos.find(x=>x.startsWith('+'));const d=dt(W.t,W.seq%60);
 if(!fmt){c.pl(hasF(f,'-u')?dateStr():dateStr());return 0;}
 const m={Y:d.getUTCFullYear(),m:p2(d.getUTCMonth()+1),d:p2(d.getUTCDate()),H:p2(d.getUTCHours()),M:p2(d.getUTCMinutes()),S:p2(d.getUTCSeconds()),F:`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}`,T:`${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`,s:Math.floor(d/1000),a:DOW[d.getUTCDay()],b:MON[d.getUTCMonth()],y:String(d.getUTCFullYear()).slice(2),j:'287',Z:'UTC',z:'+0000',e:String(d.getUTCDate()).padStart(2),A:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()],B:['January','February','March','April','May','June','July','August','September','October','November','December'][d.getUTCMonth()],'%':'%'};
 c.pl(fmt.slice(1).replace(/%([a-zA-Z%])/g,(x,k)=>m[k]!==undefined?m[k]:x));return 0;};
CMD.basename=(c,a)=>{let b=basename(a[0]||'');if(a[1]&&b.endsWith(a[1])&&b!==a[1])b=b.slice(0,-a[1].length);c.pl(b);return 0;};CMD.dirname=(c,a)=>{c.pl(dirname(a[0]||'.')||'.');return 0;};
CMD.realpath=(c,a)=>{a.forEach(x=>{try{c.pl(rp(abspath(x)));}catch(e){fsMsg(c,'realpath',e);}});return 0;};
CMD.readlink=(c,a)=>{const{pos,f}=po(a);const p=pos[0];try{if(hasF(f,'-f')){c.pl(rp(abspath(p)));return 0;}const n=W.fs[rp(abspath(p),false)];if(n&&n.t==='l'){c.pl(n.tg);return 0;}return 1;}catch(e){return 1;}};
CMD.seq=(c,a)=>{const n=a.map(Number);let[s,st,e]=n.length===1?[1,1,n[0]]:n.length===2?[n[0],1,n[1]]:n;const o=[];if(st>0)for(let x=s;x<=e&&o.length<10000;x+=st)o.push(x);else for(let x=s;x>=e&&o.length<10000;x+=st)o.push(x);c.o(o.join('\n')+(o.length?'\n':''));return 0;};
CMD.yes=(c,a)=>{const s=(a.join(' ')||'y')+'\n';c.o(s.repeat(3000));return 0;};
CMD.cat=(c,a)=>{const{pos,f}=po(a);const r=inputs(c,pos,'cat');let n=0;r.out.forEach(x=>{let t=x.text;if(hasF(f,'-n','-b'))t=lines(t).map(l=>String(++n).padStart(6)+'\t'+l).join('\n')+(t.endsWith('\n')?'\n':'');if(hasF(f,'-A','-E'))t=t.replace(/\n/g,'$\n');c.o(t);});return r.bad?1:0;};
CMD.tac=(c,a)=>{const r=inputs(c,po(a).pos,'tac');r.out.forEach(x=>c.o(lines(x.text).reverse().join('\n')+'\n'));return r.bad?1:0;};
CMD.rev=(c,a)=>{const r=inputs(c,po(a).pos,'rev');r.out.forEach(x=>c.o(lines(x.text).map(l=>[...l].reverse().join('')).join('\n')+'\n'));return 0;};
CMD.nl=(c,a)=>{const r=inputs(c,po(a).pos,'nl');let n=0;r.out.forEach(x=>c.o(lines(x.text).map(l=>l===''?'':String(++n).padStart(6)+'\t'+l).join('\n')+'\n'));return 0;};
CMD.head=(c,a)=>{const{pos,f}=po(a,['-n','-c']);let n=10;const nv=valF(f,'-n');if(nv!==undefined)n=parseInt(nv,10);a.forEach(x=>{if(/^-\d+$/.test(x))n=+x.slice(1);});const cb=valF(f,'-c');const r=inputs(c,pos,'head');r.out.forEach((x,i)=>{if(r.out.length>1)c.pl((i?'\n':'')+`==> ${x.name} <==`);if(cb!==undefined)c.o(x.text.slice(0,+cb));else{const L=lines(x.text);const s=n<0?L.slice(0,n):L.slice(0,n);if(s.length)c.o(s.join('\n')+'\n');}});return r.bad?1:0;};
CMD.tail=(c,a)=>{const{pos,f}=po(a,['-n','-c']);let n=10,plus=false;const nv=valF(f,'-n');if(nv!==undefined){plus=String(nv).startsWith('+');n=Math.abs(parseInt(nv,10));}a.forEach(x=>{if(/^-\d+$/.test(x))n=+x.slice(1);});const r=inputs(c,pos,'tail');
 r.out.forEach((x,i)=>{if(r.out.length>1)c.pl((i?'\n':'')+`==> ${x.name} <==`);const L=lines(x.text);const s=plus?L.slice(n-1):L.slice(-n);if(n===0&&!plus)return;if(s.length)c.o(s.join('\n')+'\n');});
 if(hasF(f,'-f','-F'))c.e('^C   (tail -f keeps waiting for new lines; the garden shows a snapshot)\n');return r.bad?1:0;};
CMD.wc=(c,a)=>{const{pos,f}=po(a);const r=inputs(c,pos,'wc');const sel=['-l','-w','-c','-m'].filter(k=>f[k]);const use=sel.length?sel:['-l','-w','-c'];const tot=[0,0,0,0];
 const row=(nm,t)=>{const v={'-l':(t.match(/\n/g)||[]).length,'-w':(t.trim()?t.trim().split(/\s+/).length:0),'-c':t.length,'-m':t.length};use.forEach(k=>{});return v;};
 r.out.forEach(x=>{const v=row(x.name,x.text);const cols=use.map(k=>v[k]);cols.forEach((n,i)=>tot[i]+=n);c.pl((r.out.length===1&&pos.length===0||use.length===1&&!pos.length?cols.join(' '):cols.map(n=>String(n).padStart(use.length===1?0:7)).join(' '))+(pos.length?' '+x.name:''));});
 if(r.out.length>1)c.pl(use.map((k,i)=>String(tot[i]).padStart(7)).join(' ')+' total');return r.bad?1:0;};
function keyFn(spec){const m=spec.match(/^(\d+)(?:,(\d+))?([nrhbfV]*)$/);return m?{from:+m[1],to:m[2]?+m[2]:+m[1],n:/n/.test(m[3]),h:/h/.test(m[3]),r:/r/.test(m[3])}:null;}
const HU={K:1e3,M:1e6,G:1e9,T:1e12};const hnum=s=>{const m=String(s).trim().match(/^([\d.]+)\s*([KMGT])?/i);return m?parseFloat(m[1])*(m[2]?HU[m[2].toUpperCase()]:1):0;};
CMD.sort=(c,a)=>{const{pos,f}=po(a,['-k','-t','-o']);const r=inputs(c,pos,'sort');let L=r.out.flatMap(x=>lines(x.text));const sep=valF(f,'-t');const keys=[];a.forEach((x,i)=>{if(x==='-k')keys.push(keyFn(a[i+1]||''));else if(/^-k./.test(x))keys.push(keyFn(x.slice(2)));});
 const getKey=(l,k)=>{if(!k)return l;const parts=sep?l.split(sep):l.trim().split(/\s+/);return parts.slice(k.from-1,k.to).join(sep||' ');};const glob={n:hasF(f,'-n'),h:hasF(f,'-h'),r:hasF(f,'-r')};
 const cmp=(x,y)=>{const ks=keys.length?keys:[null];for(const k of ks){let a1=getKey(x,k),b1=getKey(y,k);const nn=k?k.n||glob.n:glob.n,hh=k?k.h||glob.h:glob.h,rr=k?k.r:false;let d;
   if(hasF(f,'-V')){d=a1.localeCompare(b1,undefined,{numeric:true});}else if(hh)d=hnum(a1)-hnum(b1);else if(nn)d=(parseFloat(a1)||0)-(parseFloat(b1)||0);else{if(hasF(f,'-f')){a1=a1.toLowerCase();b1=b1.toLowerCase();}d=a1<b1?-1:a1>b1?1:0;}if(rr)d=-d;if(d!==0)return d;}return 0;};
 L.sort(cmp);if(glob.r)L.reverse();if(hasF(f,'-u')){const o=[];L.forEach(l=>{if(!o.length||cmp(o[o.length-1],l)!==0)o.push(l);});L=o;}
 const out=L.join('\n')+(L.length?'\n':'');const of=valF(f,'-o');if(of){try{writeF(of,out);}catch(e){fsMsg(c,'sort',e);return 2;}}else c.o(out);return 0;};
CMD.uniq=(c,a)=>{const{pos,f}=po(a);const r=inputs(c,pos.slice(0,1),'uniq');const L=lines(r.out[0]?r.out[0].text:'');const groups=[];const key=l=>hasF(f,'-i')?l.toLowerCase():l;L.forEach(l=>{const g=groups[groups.length-1];if(g&&key(g.l)===key(l))g.n++;else groups.push({l,n:1});});
 groups.forEach(g=>{if(hasF(f,'-d')&&g.n<2)return;if(hasF(f,'-u')&&g.n>1)return;c.pl((hasF(f,'-c')?String(g.n).padStart(7)+' ':'')+g.l);});return 0;};
function rangeList(spec,max){const out=[];spec.split(',').forEach(p=>{const m=p.match(/^(\d*)-(\d*)$/);if(m){const s=m[1]?+m[1]:1,e=m[2]?+m[2]:max;for(let i=s;i<=e;i++)out.push(i);}else out.push(+p);});return out;}
CMD.cut=(c,a)=>{const{pos,f}=po(a,['-d','-f','-c']);const r=inputs(c,pos,'cut');const d=valF(f,'-d')??'\t';const fl=valF(f,'-f'),cl=valF(f,'-c');if(!fl&&!cl){c.el('cut: you must specify a list of bytes, characters, or fields');return 1;}
 r.out.forEach(x=>lines(x.text).forEach(l=>{if(cl){const ch=[...l];c.pl(rangeList(cl,ch.length).map(i=>ch[i-1]||'').join(''));return;}if(!l.includes(d)){if(!hasF(f,'-s'))c.pl(l);return;}const p=l.split(d);c.pl(rangeList(fl,p.length).filter(i=>i<=p.length).map(i=>p[i-1]).join(valF(f,'--output-delimiter')??d));}));return 0;};
function trSet(s){s=s.replace(/\[:(upper|lower|digit|alpha|alnum|space|punct):\]/g,(m,k)=>({upper:'A-Z',lower:'a-z',digit:'0-9',alpha:'A-Za-z',alnum:'A-Za-z0-9',space:' \\t\\n',punct:'!-\\/:-@\\[-`{-~'}[k]));s=s.replace(/\\n/g,'\n').replace(/\\t/g,'\t');const o=[];for(let i=0;i<s.length;i++){if(s[i]==='\\'&&i+1<s.length){o.push(s[++i]);continue;}if(s[i+1]==='-'&&i+2<s.length){for(let k=s.charCodeAt(i);k<=s.charCodeAt(i+2);k++)o.push(String.fromCharCode(k));i+=2;}else o.push(s[i]);}return o;}
CMD.tr=(c,a)=>{const{pos,f}=po(a);const t=c.rest();let s1=trSet(pos[0]||''),s2=trSet(pos[1]||'');let out='';const comp=hasF(f,'-c','-C');
 const inS=ch=>comp?!s1.includes(ch):s1.includes(ch);
 if(hasF(f,'-d')){out=[...t].filter(ch=>!inS(ch)).join('');}else{if(hasF(f,'-s')&&!pos[1]){let last='';[...t].forEach(ch=>{if(!(inS(ch)&&ch===last))out+=ch;last=ch;});}else{[...t].forEach(ch=>{if(inS(ch)){if(comp)out+=s2[s2.length-1]||ch;else{const i=s1.indexOf(ch);out+=s2.length?(s2[Math.min(i,s2.length-1)]):ch;}}else out+=ch;});if(hasF(f,'-s')){let o2='',last='';[...out].forEach(ch=>{if(!(s2.includes(ch)&&ch===last))o2+=ch;last=ch;});out=o2;}}}c.o(out);return 0;};
CMD.tee=(c,a)=>{const{pos,f}=po(a);const t=c.rest();c.o(t);let st=0;pos.forEach(p=>{try{writeF(p,t,hasF(f,'-a'));}catch(e){fsMsg(c,'tee',e);st=1;}});return st;};
CMD.column=(c,a)=>{const{f}=po(a,['-s','-t','-o']);const t=c.rest();const sep=valF(f,'-s');const rows=lines(t).map(l=>sep?l.split(sep):l.trim().split(/\s+/));if(!hasF(f,'-t')){c.o(t);return 0;}const w=[];rows.forEach(r=>r.forEach((x,i)=>w[i]=Math.max(w[i]||0,x.length)));rows.forEach(r=>c.pl(r.map((x,i)=>i<r.length-1?x.padEnd(w[i]):x).join('  ')));return 0;};
CMD.paste=(c,a)=>{const{pos,f}=po(a,['-d']);const d=valF(f,'-d')??'\t';const r=inputs(c,pos,'paste');if(hasF(f,'-s')){r.out.forEach(x=>c.pl(lines(x.text).join(d)));return 0;}const cols=r.out.map(x=>lines(x.text));const n=Math.max(...cols.map(x=>x.length));for(let i=0;i<n;i++)c.pl(cols.map(x=>x[i]??'').join(d));return 0;};
CMD.expr=(c,a)=>{try{const e=a.join(' ').replace(/\\/g,'');const v=Function('"use strict";return ('+(/^[\d\s+\-*/%()<>=!&|]+$/.test(e)?e:'0')+')')();c.pl(String(v===true?1:v===false?0:Math.trunc(v)));return v?0:1;}catch(e){c.el('expr: syntax error');return 2;}};
CMD.md5sum=(c,a)=>{const r=inputs(c,a,'md5sum');r.out.forEach(x=>c.pl(hex(x.text,32)+'  '+x.name));return 0;};CMD.sha256sum=(c,a)=>{const r=inputs(c,a,'sha256sum');r.out.forEach(x=>c.pl(hex(x.text,64)+'  '+x.name));return 0;};CMD.sha1sum=CMD.sha256sum;
CMD.diff=(c,a)=>{const{pos,f}=po(a);if(pos.length<2){c.el('diff: missing operand');return 2;}const A=[],B=[];let r1,r2;try{r1=readF(pos[0]);r2=readF(pos[1]);}catch(e){fsMsg(c,'diff',e);return 2;}
 const x=lines(r1),y=lines(r2);const n=x.length,m=y.length;const dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=x[i]===y[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out=[];let i=0,j=0;while(i<n&&j<m){if(x[i]===y[j]){out.push([' ',x[i]]);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])out.push(['-',x[i++]]);else out.push(['+',y[j++]]);}while(i<n)out.push(['-',x[i++]]);while(j<m)out.push(['+',y[j++]]);
 if(!out.some(o=>o[0]!==' '))return 0;if(hasF(f,'-u')){c.pl(`--- ${pos[0]}`);c.pl(`+++ ${pos[1]}`);c.pl(`@@ -1,${n} +1,${m} @@`);out.forEach(o=>c.pl(o[0]+o[1]));}else out.forEach(o=>{if(o[0]!==' ')c.pl((o[0]==='-'?'< ':'> ')+o[1]);});return 1;};
CMD.file=(c,a)=>{a.forEach(p=>{try{const n=getN(p);c.pl(`${p}: `+(n.t==='d'?'directory':n.t==='l'?'symbolic link':n.t==='c'?'character special':n.t==='b'?'block special':(n.c||'').startsWith('\x7fELF')?'ELF 64-bit LSB pie executable, x86-64':(n.c||'').startsWith('#!')?`${(n.c.split('\n')[0].match(/(\w+)$/)||[])[1]||'shell'} script, ASCII text executable`:(n.c||'')===''?'empty':(n.c||'').startsWith('\x1f\x8bGZ')?'gzip compressed data':(n.c||'').startsWith('\0TAR')?'POSIX tar archive':'ASCII text'));}catch(e){c.pl(`${p}: cannot open (No such file or directory)`);}});return 0;};

/* ---- ls ---- */
const collate=(x,y)=>{const a=x.replace(/^\./,'').toLowerCase(),b=y.replace(/^\./,'').toLowerCase();return a<b?-1:a>b?1:(x<y?-1:1);};
CMD.ls=(c,a)=>{const{pos,f}=po(a);const long=hasF(f,'-l','-n'),all=hasF(f,'-a'),almost=hasF(f,'-A'),human=hasF(f,'-h'),dflag=hasF(f,'-d'),rec=hasF(f,'-R');let st=0;
 const targets=pos.length?pos:['.'];const fmtSize=n=>human?hsize(sizeOf(n)):String(sizeOf(n));
 const line=(name,full,n)=>{const tn=n;const pre=hasF(f,'-i')?fakeIno(full)+' ':'';if(!long)return pre+name+(hasF(f,'-F')||hasF(f,'-p')?(n.t==='d'?'/':n.t==='l'?(hasF(f,'-F')?'@':''):(hasF(f,'-F')&&(n.m&0o111)&&n.t==='f'?'*':'')):'');
  const links=n.t==='d'?2+Object.keys(W.fs).filter(k=>dirname(k)===full&&W.fs[k].t==='d').length:1;return `${pre}${modeStr(n)} ${String(links).padStart(2)} ${n.u.padEnd(8)} ${n.g.padEnd(8)} ${fmtSize(n).padStart(human?5:8)} ${lsDate(n.mt)} ${name}${n.t==='l'?' -> '+n.tg:''}`;};
 const sorter=(items)=>{if(hasF(f,'-S'))items.sort((x,y)=>sizeOf(y.n)-sizeOf(x.n));else if(hasF(f,'-t'))items.sort((x,y)=>y.n.mt-x.n.mt||collate(x.name,y.name));else items.sort((x,y)=>collate(x.name,y.name));if(hasF(f,'-r'))items.reverse();return items;};
 const listDir=(p,label,first)=>{let names;try{names=lsDir(p);}catch(e){fsMsg(c,'ls',e,e.code==='ENOENT'?'cannot access':e.code==='EACCES'?'cannot open directory':'');st=2;return;}
  if(label!==null)c.pl((first?'':'\n')+label+':');const items=names.filter(n=>all||almost||!n.startsWith('.')).map(name=>{const full=(rp(abspath(p))==='/'?'':rp(abspath(p)))+'/'+name;return{name,full,n:W.fs[full]};});
  if(all){const dp=rp(abspath(p));items.push({name:'.',full:dp,n:W.fs[dp]},{name:'..',full:dirname(dp),n:W.fs[dirname(dp)]||W.fs['/']});}
  sorter(items);if(long){const tot=Math.ceil(items.reduce((s,i)=>s+Math.max(4,Math.ceil(sizeOf(i.n)/1024)*1),0)/1);c.pl('total '+tot);items.forEach(i=>c.pl(line(i.name,i.full,i.n)));}else if(items.length)c.pl(hasF(f,'-1')||long||c.io.notty?items.map(i=>line(i.name,i.full,i.n)).join('\n'):items.map(i=>line(i.name,i.full,i.n)).join('  '));
  if(rec)items.filter(i=>i.n.t==='d'&&i.name!=='.'&&i.name!=='..').forEach(i=>listDir(i.full,i.full,false));};
 const files=[],dirs=[];targets.forEach(t=>{try{const n=getN(t,false);const full=rp(abspath(t),false);const real=n.t==='l'&&!long?getN(t):n;if(real.t==='d'&&!dflag)dirs.push(t);else files.push({name:t,full,n:real===n?n:n});}catch(e){fsMsg(c,'ls',e,'cannot access');st=2;}});
 if(files.length){sorter(files);c.pl(long||c.io.notty?files.map(i=>line(i.name,i.full,i.n)).join('\n'):files.map(i=>line(i.name,i.full,i.n)).join('  '));}
 dirs.forEach((d,i)=>listDir(d,(dirs.length>1||files.length)?d:null,i===0&&!files.length));return st;};
CMD.stat=(c,a)=>{let st=0;const{pos,f}=po(a,['-c','--format']);const fmt=valF(f,'-c','--format');pos.forEach(p=>{try{const n=getN(p,!hasF(f,'-L')&&false);const full=rp(abspath(p),false);
 if(fmt){c.pl(fmt.replace(/%([nsaAuUgGFmyYzZ])/g,(m,k)=>({n:p,s:sizeOf(n),a:(n.m&0o7777).toString(8),A:modeStr(n),u:uidOf(n.u),U:n.u,g:gidOf(n.g),G:n.g,F:n.t==='d'?'directory':'regular file',m:mountOf(full),y:lsDate(n.mt),Y:Math.floor(dt(n.mt)/1000),z:lsDate(n.mt),Z:Math.floor(dt(n.mt)/1000)}[k])));return;}
 c.pl(`  File: ${p}${n.t==='l'?' -> '+n.tg:''}`);c.pl(`  Size: ${String(sizeOf(n)).padEnd(10)}Blocks: ${String(Math.ceil(sizeOf(n)/512)).padEnd(8)}IO Block: 4096   ${n.t==='d'?'directory':n.t==='l'?'symbolic link':'regular file'}`);c.pl(`Device: 802h/2050d\tInode: ${fakeIno(full)}  Links: ${n.t==='d'?2:1}`);
 c.pl(`Access: (${(n.m&0o7777).toString(8).padStart(4,'0')}/${modeStr(n)})  Uid: (${String(uidOf(n.u)).padStart(5)}/${n.u.padStart(8)})   Gid: (${String(gidOf(n.g)).padStart(5)}/${n.g.padStart(8)})`);c.pl(`Access: 2026-${lsDate(n.mt).slice(0,6)}`.replace('2026-Oct  ','2026-10-')+':00.000000000 +0000');c.pl(`Modify: ${lsDate(n.mt)}:00.000000000 +0000`);c.pl(`Change: ${lsDate(n.mt)}:00.000000000 +0000`);c.pl(' Birth: -');}catch(e){fsMsg(c,'stat',e,'cannot statx');st=1;}});return st;};
CMD.touch=(c,a)=>{let st=0;po(a).pos.forEach(p=>{try{const ap=abspath(p);let n;try{n=getN(p);if(!can(n,2)&&!isRoot())throw new FsErr('EACCES',p);n.mt=W.t;}catch(e){if(e.code==='ENOENT')writeF(p,'');else throw e;}}catch(e){fsMsg(c,'touch',e,'cannot touch');st=1;}});return st;};
CMD.mkdir=(c,a)=>{const{pos,f}=po(a,['-m']);let st=0;const mode=valF(f,'-m');pos.forEach(p=>{try{const ap=rp(abspath(p));if(W.fs[ap]){if(hasF(f,'-p'))return;throw new FsErr('EEXIST',p);}
 if(hasF(f,'-p')){const parts=ap.split('/').filter(Boolean);let cur='';for(const s of parts){cur+='/'+s;if(!W.fs[cur]){const par=W.fs[dirname(cur)];if(!can(par,2))throw new FsErr('EACCES',p);W.fs[cur]={t:'d',m:0o777&~W.umask,u:W.user,g:userGroups(W.user)[0]||W.user,mt:W.t};}}}
 else{traverse(ap);const par=W.fs[dirname(ap)];if(!par)throw new FsErr('ENOENT',p);if(!can(par,2)||!can(par,1))throw new FsErr('EACCES',p);W.fs[ap]={t:'d',m:0o777&~W.umask,u:W.user,g:userGroups(W.user)[0]||W.user,mt:W.t};}
 if(mode)W.fs[ap].m=parseInt(mode,8);}catch(e){fsMsg(c,'mkdir',e,'cannot create directory');st=1;}});return st;};
CMD.rmdir=(c,a)=>{let st=0;po(a).pos.forEach(p=>{try{const n=getN(p);if(n.t!=='d')throw new FsErr('ENOTDIR',p);if(lsDir(p).length)throw new FsErr('ENOTEMPTY',p);if(!can(W.fs[dirname(rp(abspath(p)))],2))throw new FsErr('EACCES',p);rmNode(p);}catch(e){fsMsg(c,'rmdir',e,'failed to remove');st=1;}});return st;};
function stickyBlock(p,n){const par=W.fs[dirname(rp(abspath(p),false))];return par&&(par.m&0o1000)&&!isRoot()&&n.u!==W.user&&par.u!==W.user;}
CMD.rm=(c,a)=>{const{pos,f}=po(a);const r=hasF(f,'-r','-R','--recursive'),force=hasF(f,'-f');let st=0;
 if(!pos.length&&!force){c.el('rm: missing operand');return 1;}
 for(const p of pos){const ap=rp(abspath(p),false);if(ap==='/'&&!hasF(f,'--no-preserve-root')){c.el("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe");return 1;}
  try{traverse(ap);const n=W.fs[ap];if(!n){if(force)continue;throw new FsErr('ENOENT',p);}
   if(n.t==='d'&&!r){c.el(`rm: cannot remove '${p}': Is a directory`);st=1;continue;}
   const par=W.fs[dirname(ap)];if(par&&(!can(par,2)||stickyBlock(p,n)))throw new FsErr('EACCES',p);
   if(n.t==='d'){for(const k of Object.keys(W.fs))if(k.startsWith(ap+'/')){const pp=W.fs[dirname(k)];if(pp&&!can(pp,2)){throw new FsErr('EACCES',k);}}}
   if(W.fs[ap]&&W.fs[ap].lock){c.el(`rm: cannot remove '${p}': Operation not permitted`);st=1;continue;}
   if(hasF(f,'-v'))c.pl(`removed '${p}'`);if(n.t!=='d'){W.procs.forEach(pr=>{const i=(pr.openFiles||[]).findIndex(o=>o.path===ap);if(i>=0){const o=pr.openFiles.splice(i,1)[0];(pr.deleted=pr.deleted||[]).push({path:ap,size:sizeOf(n)});}});}rmNode(p);}catch(e){if(e instanceof FsErr){c.el(`rm: cannot remove '${e.path}': ${ERRTXT[e.code]}`);st=1;}else throw e;}}return st;};
function copyNode(src,dst,rec,preserve,c,verbose){const n=getN(src);if(n.t==='d'){if(!rec)throw new FsErr('EISDIR',src);const dap=rp(abspath(dst));if(!W.fs[dap]){const par=W.fs[dirname(dap)];if(!par||!can(par,2))throw new FsErr(par?'EACCES':'ENOENT',dst);W.fs[dap]={...n,u:preserve?n.u:W.user,g:preserve?n.g:(userGroups(W.user)[0]||W.user),mt:W.t};}lsDir(src).forEach(nm=>copyNode(src+'/'+nm,dst+'/'+nm,rec,preserve,c,verbose));return;}
 const data=readF(src);writeF(dst,data,false);const d=W.fs[rp(abspath(dst))];if(n.s!==undefined)d.s=n.s;if(preserve){d.m=n.m;d.u=n.u;d.g=n.g;d.mt=n.mt;}else if(n.m&0o111)d.m|=n.m&0o111&~W.umask;if(verbose)c.pl(`'${src}' -> '${dst}'`);}
CMD.cp=(c,a)=>{const{pos,f}=po(a);const rec=hasF(f,'-r','-R','-a');if(pos.length<2){c.el('cp: missing destination file operand');return 1;}let st=0;const dst=pos[pos.length-1];const srcs=pos.slice(0,-1);const dstIsDir=isDirP(dst);if(srcs.length>1&&!dstIsDir){c.el(`cp: target '${dst}' is not a directory`);return 1;}
 srcs.forEach(s=>{try{const target=dstIsDir?dst.replace(/\/$/,'')+'/'+basename(s):dst;copyNode(s,target,rec,hasF(f,'-a','-p'),c,hasF(f,'-v'));}catch(e){if(e instanceof FsErr){if(e.code==='EISDIR'){c.el(`cp: -r not specified; omitting directory '${s}'`);}else if(e.code==='ENOENT')c.el(`cp: cannot stat '${e.path}': No such file or directory`);else c.el(`cp: cannot ${e.code==='ENOSPC'?'write to':'create regular file'} '${e.path}': ${ERRTXT[e.code]}`);st=1;}else throw e;}});return st;};
CMD.mv=(c,a)=>{const{pos}=po(a);if(pos.length<2){c.el('mv: missing destination file operand');return 1;}const dst=pos[pos.length-1];let st=0;const dir=isDirP(dst);
 pos.slice(0,-1).forEach(s=>{try{const sp=rp(abspath(s),false);const n=W.fs[sp];if(!n)throw new FsErr('ENOENT',s);const dp=rp(abspath(dir?dst.replace(/\/$/,'')+'/'+basename(s):dst));const sparent=W.fs[dirname(sp)],dparent=W.fs[dirname(dp)];if(!dparent)throw new FsErr('ENOENT',dst);if(!can(sparent,2)||!can(dparent,2)||stickyBlock(s,n))throw new FsErr('EACCES',s);
  const moves=Object.keys(W.fs).filter(k=>k===sp||k.startsWith(sp+'/'));moves.forEach(k=>{W.fs[dp+k.slice(sp.length)]=W.fs[k];});moves.forEach(k=>delete W.fs[k]);}catch(e){if(e instanceof FsErr){c.el(`mv: cannot ${e.code==='ENOENT'?'stat':'move'} '${e.path}': ${ERRTXT[e.code]}`);st=1;}else throw e;}});return st;};
CMD.ln=(c,a)=>{const{pos,f}=po(a);if(pos.length<2){c.el('ln: missing file operand');return 1;}const[t,l]=pos;try{const lp=rp(abspath(isDirP(l)?l+'/'+basename(t):l),false);if(W.fs[lp])throw new FsErr('EEXIST',l);if(hasF(f,'-s'))W.fs[lp]={t:'l',m:0o777,u:W.user,g:userGroups(W.user)[0]||W.user,tg:t,mt:W.t};else{const n=getN(t);W.fs[lp]={...n};n.nlink=(n.nlink||1)+1;W.fs[lp].nlink=n.nlink;}}catch(e){fsMsg(c,'ln',e,'failed to create link');return 1;}return 0;};
CMD.mktemp=(c,a)=>{const p='/tmp/tmp.'+hex(String(W.seq++),10);writeF(p,'');c.pl(p);return 0;};
CMD.truncate=(c,a)=>{const{pos,f}=po(a,['-s']);const sz=valF(f,'-s');if(sz===undefined||!pos.length){c.el('truncate: you must specify either --size or --reference');return 1;}let st=0;
 const m=String(sz).match(/^([\d.]+)([KMG]?)$/i);const bytes=m?Math.round(parseFloat(m[1])*({'':1,K:K1,M:M1,G:G1}[m[2].toUpperCase()])):0;pos.forEach(p=>{try{let n;try{n=getN(p);}catch(e){if(e.code!=='ENOENT')throw e;writeF(p,'');n=getN(p);}if(!can(n,2))throw new FsErr('EACCES',p);if(bytes===0){n.c='';delete n.s;}else{n.s=bytes;}n.mt=W.t;}catch(e){fsMsg(c,'truncate',e,'cannot open');st=1;}});return st;};
CMD.fallocate=(c,a)=>{const{pos,f}=po(a,['-l']);const sz=valF(f,'-l');const m=String(sz).match(/^([\d.]+)([KMG]?)$/i);if(!m||!pos.length){c.el('fallocate: no length arguments specified');return 1;}const bytes=Math.round(parseFloat(m[1])*({'':1,K:K1,M:M1,G:G1}[m[2].toUpperCase()]));
 try{const mt=mountOf(rp(abspath(pos[0])));if(usedBytes(mt)+bytes>W.mounts[mt].size)throw new FsErr('ENOSPC',pos[0]);writeF(pos[0],'');getN(pos[0]).s=bytes;}catch(e){c.el(`fallocate: fallocate failed: ${ERRTXT[e.code]||e.message}`);return 1;}return 0;};
CMD.dd=(c,a)=>{const o={};a.forEach(x=>{const i=x.indexOf('=');if(i>0)o[x.slice(0,i)]=x.slice(i+1);});const bs=(s=>{const m=String(s||'512').match(/^(\d+)([KMGkmg]?)/);return +m[1]*({'':1,K:1024,M:M1,G:G1}[m[2].toUpperCase()]);})(o.bs);const cnt=+o.count||1;let total=bs*cnt;
 if(o.if&&o.if!=='/dev/zero'&&o.if!=='/dev/urandom'&&o.if!=='/dev/random'){try{total=Math.min(total,readF(o.if).length||sizeOf(getN(o.if)));}catch(e){c.el(`dd: failed to open '${o.if}': ${ERRTXT[e.code]}`);return 1;}}
 if(o.of&&o.of!=='/dev/null'){try{const ap=rp(abspath(o.of));if(/^\/dev\/(sd|nvme|vd)/.test(ap)){c.el(`dd: failed to open '${o.of}': Permission denied`);return 1;}const mt=mountOf(ap);if(usedBytes(mt)+total>W.mounts[mt].size){writeF(o.of,'');getN(o.of).s=Math.max(0,W.mounts[mt].size-usedBytes(mt));c.el(`dd: error writing '${o.of}': No space left on device`);return 1;}writeF(o.of,'');getN(o.of).s=total;}catch(e){c.el(`dd: failed to open '${o.of}': ${ERRTXT[e.code]}`);return 1;}}
 c.e(`${cnt}+0 records in\n${cnt}+0 records out\n${total} bytes (${hsize(total)}B) copied, 0.${p2(W.seq%90+5)} s, ${Math.round(total/M1/0.3)} MB/s\n`);return 0;};

/* ---- permissions ---- */
function parseMode(spec,cur,isDir){if(/^[0-7]{1,4}$/.test(spec))return parseInt(spec,8);let m=cur&0o7777;
 for(const clause of spec.split(',')){const mm=clause.match(/^([ugoa]*)([-+=])([rwxXst]*)$/);if(!mm)return null;let who=mm[1]||'a';if(who.includes('a'))who='ugo';const op=mm[2];let bits=0;
  for(const ch of who){const sh=ch==='u'?6:ch==='g'?3:0;let b=0;if(mm[3].includes('r'))b|=4;if(mm[3].includes('w'))b|=2;if(mm[3].includes('x')||(mm[3].includes('X')&&(isDir||(cur&0o111))))b|=1;bits|=b<<sh;if(mm[3].includes('s')&&ch==='u')bits|=0o4000;if(mm[3].includes('s')&&ch==='g')bits|=0o2000;if(mm[3].includes('t'))bits|=0o1000;}
  const mask=who.split('').reduce((a,ch)=>a|(7<<(ch==='u'?6:ch==='g'?3:0)),0)|(who.includes('u')?0o4000:0)|(who.includes('g')?0o2000:0)|(who.includes('o')?0o1000:0);
  if(op==='+')m|=bits;else if(op==='-')m&=~bits;else m=(m&~mask)|bits;}return m;}
function walk(path,rec,fn){const ap=rp(abspath(path),false);fn(ap);if(rec&&W.fs[ap]&&W.fs[ap].t==='d')Object.keys(W.fs).filter(k=>k.startsWith(ap==='/'?'/':ap+'/')).sort().forEach(k=>fn(k));}
CMD.chmod=(c,a)=>{const{pos,f}=po(a);const spec=pos[0];if(!spec||pos.length<2){c.el(`chmod: missing operand${spec?` after '${spec}'`:''}`);return 1;}let st=0;
 if(parseMode(spec,0,false)===null){c.el(`chmod: invalid mode: '${spec}'`);return 1;}
 pos.slice(1).forEach(p=>{try{getN(p);walk(p,hasF(f,'-R'),k=>{const n=W.fs[k];if(n.t==='l')return;if(!isRoot()&&n.u!==W.user)throw new FsErr('EPERM',k);const nm=parseMode(spec,n.m,n.t==='d');n.m=nm;n.mt=n.mt;if(hasF(f,'-v'))c.pl(`mode of '${k}' changed to ${(nm&0o7777).toString(8).padStart(4,'0')} (${modeStr(n).slice(1)})`);});}catch(e){if(e instanceof FsErr){c.el(e.code==='ENOENT'?`chmod: cannot access '${p}': No such file or directory`:`chmod: changing permissions of '${e.path}': ${ERRTXT[e.code]}`);st=1;}else throw e;}});return st;};
function doChown(c,cmd,spec,paths,rec,onlyGroup){let st=0;let u=null,g=null;if(onlyGroup)g=spec;else{const m=spec.match(/^([^:.]*)(?:[:.](.*))?$/);u=m[1]||null;g=m[2]||null;}
 if(u&&uidOf(u)===null&&!/^\d+$/.test(u)){c.el(`${cmd}: invalid user: '${spec}'`);return 1;}if(g&&gidOf(g)===null){c.el(`${cmd}: invalid ${cmd==='chgrp'?'group':'group'}: '${spec}'`);return 1;}
 paths.forEach(p=>{try{getN(p);walk(p,rec,k=>{const n=W.fs[k];if(!isRoot()){if(u&&u!==n.u)throw new FsErr('EPERM',k);if(n.u!==W.user||(g&&!userGroups(W.user).includes(g)))throw new FsErr('EPERM',k);}if(u)n.u=u;if(g)n.g=g;});}catch(e){if(e instanceof FsErr){c.el(e.code==='ENOENT'?`${cmd}: cannot access '${p}': No such file or directory`:`${cmd}: changing ownership of '${e.path}': ${ERRTXT[e.code]}`);st=1;}else throw e;}});return st;}
CMD.chown=(c,a)=>{const{pos,f}=po(a);if(pos.length<2){c.el('chown: missing operand');return 1;}return doChown(c,'chown',pos[0],pos.slice(1),hasF(f,'-R'),false);};
CMD.chgrp=(c,a)=>{const{pos,f}=po(a);if(pos.length<2){c.el('chgrp: missing operand');return 1;}return doChown(c,'chgrp',pos[0],pos.slice(1),hasF(f,'-R'),true);};
CMD.getfacl=(c,a)=>{po(a).pos.forEach(p=>{try{const n=getN(p);c.pl(`# file: ${p.replace(/^\//,'')}`);c.pl(`# owner: ${n.u}`);c.pl(`# group: ${n.g}`);c.pl(`user::${modeStr(n).slice(1,4)}`);(n.acl||[]).filter(x=>x.k==='u').forEach(x=>c.pl(`user:${x.n}:${'r-'[x.p&4?0:1]}${'w-'[x.p&2?0:1]}${'x-'[x.p&1?0:1]}`));c.pl(`group::${modeStr(n).slice(4,7)}`);(n.acl||[]).filter(x=>x.k==='g').forEach(x=>c.pl(`group:${x.n}:${'r-'[x.p&4?0:1]}${'w-'[x.p&2?0:1]}${'x-'[x.p&1?0:1]}`));if(n.acl&&n.acl.length)c.pl('mask::rwx');c.pl(`other::${modeStr(n).slice(7,10)}`);c.pl('');}catch(e){fsMsg(c,'getfacl',e);}});return 0;};
CMD.setfacl=(c,a)=>{const{pos,f}=po(a,['-m','-x']);const mod=valF(f,'-m'),del=valF(f,'-x');let st=0;pos.forEach(p=>{try{const n=getN(p);if(!isRoot()&&n.u!==W.user)throw new FsErr('EPERM',p);walk(p,hasF(f,'-R'),k=>{const nd=W.fs[k];nd.acl=nd.acl||[];
 if(hasF(f,'-b'))nd.acl=[];if(mod)mod.split(',').forEach(e=>{const[k2,nm,pm]=e.split(':');const pb=(pm||'').split('').reduce((x,ch)=>x|(ch==='r'?4:ch==='w'?2:ch==='x'?1:0),0);if(!nm)return;nd.acl=nd.acl.filter(x=>!(x.k===k2&&x.n===nm));nd.acl.push({k:k2,n:nm,p:pb});});
 if(del)del.split(',').forEach(e=>{const[k2,nm]=e.split(':');nd.acl=nd.acl.filter(x=>!(x.k===k2&&x.n===nm));});});}catch(e){fsMsg(c,'setfacl',e);st=1;}});return st;};
CMD.lsattr=(c,a)=>{po(a).pos.forEach(p=>{try{const n=getN(p);c.pl(`${n.lock?'----i---------':'--------------e-------'.slice(0,14)} ${p}`);}catch(e){fsMsg(c,'lsattr',e);}});return 0;};
CMD.chattr=(c,a)=>{const{pos}=po(a.filter(x=>!/^[-+]\w$/.test(x)));const flag=a.find(x=>/^[-+]i$/.test(x));if(!isRoot()){c.el(`chattr: Operation not permitted while setting flags on ${pos[0]}`);return 1;}if(flag)pos.forEach(p=>{try{getN(p).lock=flag[0]==='+';}catch(e){fsMsg(c,'chattr',e);}});return 0;};

/* ---- grep / find / xargs ---- */
function toJsRe(p,ere,fixed){if(fixed)return escRe(p);p=p.replace(/\[:(digit|alpha|alnum|upper|lower|space|punct):\]/g,(m,k)=>({digit:'0-9',alpha:'a-zA-Z',alnum:'a-zA-Z0-9',upper:'A-Z',lower:'a-z',space:'\\s',punct:'!-\\/:-@\\[-`{-~'}[k]));
 if(ere)return p.replace(/\\</g,'\\b').replace(/\\>/g,'\\b');let o='';for(let i=0;i<p.length;i++){const ch=p[i];if(ch==='['){const e=p.indexOf(']',i+2);if(e>0){o+=p.slice(i,e+1);i=e;continue;}}
 if(ch==='\\'&&i+1<p.length){const n=p[++i];if('(){}|+?'.includes(n))o+=n;else if(n==='<'||n==='>')o+='\\b';else o+='\\'+n;}else if('(){}|+?'.includes(ch))o+='\\'+ch;else o+=ch;}return o;}
function grepWalk(p,rec,out){const ap=rp(abspath(p));let n;try{n=getN(p);}catch(e){out.push({name:p,err:e});return;}if(n.t==='d'){if(!rec){out.push({name:p,isdir:true});return;}let names=[];try{names=lsDir(p);}catch(e){out.push({name:p,err:e});return;}names.forEach(nm=>grepWalk((p==='/'?'':p.replace(/\/$/,''))+'/'+nm,rec,out));return;}try{out.push({name:p,text:readF(p)});}catch(e){out.push({name:p,err:e});}}
CMD.grep=(c,a)=>{const{pos,f}=po(a,['-e','-A','-B','-C','-m']);const pats=[];a.forEach((x,i)=>{if(x==='-e')pats.push(a[i+1]);});let files=pos;if(!pats.length){pats.push(files.shift());}if(pats[0]===undefined){c.el('Usage: grep [OPTION]... PATTERNS [FILE]...');return 2;}
 const ere=hasF(f,'-E','-P','--extended-regexp'),fixed=hasF(f,'-F');let src=pats.map(p=>toJsRe(p,ere,fixed)).join('|');if(hasF(f,'-w'))src='\\b(?:'+src+')\\b';let re;try{re=new RegExp(src,hasF(f,'-i')?'i':'');}catch(e){c.el('grep: Invalid regular expression');return 2;}
 const rec=hasF(f,'-r','-R');const src2=[];let st=1;if(!files.length){if(rec)files=['.'];else src2.push({name:'(standard input)',text:c.rest()});}files.forEach(p=>grepWalk(p,rec,src2));
 const multi=(files.length>1||rec)&&!hasF(f,'-h');const inv=hasF(f,'-v');const A=+(valF(f,'-A','-C')||0),B=+(valF(f,'-B','-C')||0);const mx=valF(f,'-m')?+valF(f,'-m'):Infinity;let err=false;
 for(const s of src2){if(s.err){if(!hasF(f,'-s'))c.el(`grep: ${s.name}: ${ERRTXT[s.err.code]}`);err=true;continue;}if(s.isdir){c.el(`grep: ${s.name}: Is a directory`);continue;}
  const L=lines(s.text);let cnt=0;const printed=new Set();const emit=(i,sep)=>{if(printed.has(i))return;printed.add(i);c.pl((multi?s.name+sep:'')+(hasF(f,'-n')?(i+1)+sep:'')+L[i]);};let lastIdx=-10;
  for(let i=0;i<L.length&&cnt<mx;i++){const m=re.test(L[i]);if(m!==inv){cnt++;st=0;if(hasF(f,'-q'))return 0;if(hasF(f,'-l','-c'))continue;
    if(hasF(f,'-o')&&!inv){const g=new RegExp(re.source,re.flags+'g');(L[i].match(g)||[]).forEach(x=>c.pl((multi?s.name+':':'')+(hasF(f,'-n')?(i+1)+':':'')+x));continue;}
    if(B||A){if(i-B>lastIdx+1&&printed.size)c.pl('--');for(let k=Math.max(0,i-B);k<i;k++)emit(k,'-');}emit(i,':');if(A)for(let k=i+1;k<=Math.min(L.length-1,i+A);k++){emit(k,'-');}lastIdx=i+A;}}
  if(hasF(f,'-c'))c.pl((multi?s.name+':':'')+cnt);if(hasF(f,'-l')&&cnt)c.pl(s.name);}
 return err&&st?2:st;};
CMD.egrep=(c,a)=>CMD.grep(c,['-E',...a]);CMD.fgrep=(c,a)=>CMD.grep(c,['-F',...a]);
function parseSize(s){const m=String(s).match(/^([+-]?)(\d+)([cwbkKMG]?)$/);if(!m)return null;return{op:m[1],n:+m[2]*({'':512,c:1,w:2,b:512,k:1024,K:1024,M:M1,G:G1}[m[3]])};}
CMD.find=(c,a)=>{let i=0;const paths=[];while(i<a.length&&!/^[-!(]/.test(a[i]))paths.push(a[i++]);if(!paths.length)paths.push('.');const expr=a.slice(i);const preds=[];let maxd=Infinity,mind=0,action='print',execArgs=null,execPlus=false,neg=false;
 for(let k=0;k<expr.length;k++){const t=expr[k];
  if(t==='!'||t==='-not'){neg=true;continue;}const push=fn=>{const g=neg?(n,p)=>!fn(n,p):fn;neg=false;preds.push(g);};
  if(t==='-name'||t==='-iname'){const re=globRe(expr[++k],true);const re2=t==='-iname'?new RegExp(re.source,'i'):re;push((n,p)=>re2.test(basename(p)));}
  else if(t==='-type'){const ty=expr[++k];push(n=>({f:'f',d:'d',l:'l',c:'c',b:'b'}[ty]===n.t));}
  else if(t==='-size'){const s=parseSize(expr[++k]);push(n=>{const z=sizeOf(n);return s.op==='+'?z>s.n:s.op==='-'?z<s.n:Math.ceil(z/s.n)===1&&z<=s.n;});}
  else if(t==='-mtime'||t==='-mmin'||t==='-atime'||t==='-ctime'){const v=expr[++k];const op=v[0]==='+'||v[0]==='-'?v[0]:'';const num=+v.replace(/^[+-]/,'');const unit=t==='-mmin'?1:1440;push(n=>{const age=Math.floor((W.t-n.mt)/unit);return op==='+'?age>num:op==='-'?age<num:age===num;});}
  else if(t==='-user'){const u=expr[++k];push(n=>n.u===u);}else if(t==='-group'){const g=expr[++k];push(n=>n.g===g);}
  else if(t==='-perm'){const v=expr[++k];const any=v[0]==='/',all=v[0]==='-';const m=parseInt(v.replace(/^[-/]/,''),8);push(n=>any?((n.m&0o7777)&m)!==0:all?((n.m&0o7777)&m)===m:(n.m&0o7777)===m);}
  else if(t==='-empty'){push(n=>n.t==='d'?false:sizeOf(n)===0);}else if(t==='-maxdepth')maxd=+expr[++k];else if(t==='-mindepth')mind=+expr[++k];
  else if(t==='-newer'){const rf=expr[++k];push(n=>{try{return n.mt>getN(rf).mt;}catch(e){return false;}});}
  else if(t==='-print')action='print';else if(t==='-delete')action='delete';else if(t==='-ls')action='ls';
  else if(t==='-exec'||t==='-ok'){const cmd=[];k++;while(k<expr.length&&expr[k]!==';'&&expr[k]!=='\\;'&&expr[k]!=='+'){cmd.push(expr[k++]);}execPlus=expr[k]==='+';execArgs=cmd;action='exec';}
  else if(t==='-o'||t==='-a'||t==='-and'||t==='('||t===')'||t==='\\('||t==='\\)'){}else if(t.startsWith('-')){c.el(`find: unknown predicate \`${t}'`);return 1;}}
 let st=0;const hits=[];
 for(const base of paths){let bp;try{getN(base);bp=rp(abspath(base));}catch(e){c.el(`find: '${base}': ${ERRTXT[e.code]}`);st=1;continue;}
  const bn=W.fs[bp];const rel=(k)=>base==='.'?(k===bp?'.':'./'+k.slice(bp==='/'?1:bp.length+1)):(k===bp?base:base.replace(/\/$/,'')+'/'+k.slice(bp==='/'?1:bp.length+1));
  const keys=[bp,...Object.keys(W.fs).filter(k=>k!==bp&&k.startsWith(bp==='/'?'/':bp+'/')).sort()];
  for(const k of keys){const depth=k===bp?0:k.slice(bp.length).split('/').filter(Boolean).length;if(depth>maxd||depth<mind)continue;
   let skip=false;if(k!==bp){const parts=k.split('/').filter(Boolean);let cur='';for(let q=0;q<parts.length-1;q++){cur+='/'+parts[q];if(cur.length>=bp.length){const nd=W.fs[cur];if(nd&&nd.t==='d'&&!isRoot()&&!can(nd,4)){skip=true;break;}}}}
   if(skip){continue;}const n=W.fs[k];if(preds.every(p=>p(n,k)))hits.push({p:rel(k),n,k});}}
 if(action==='print')hits.forEach(h=>c.pl(h.p));else if(action==='ls')hits.forEach(h=>c.pl(`${fakeIno(h.k)} ${String(Math.ceil(sizeOf(h.n)/1024)).padStart(5)} ${modeStr(h.n)} 1 ${h.n.u} ${h.n.g} ${String(sizeOf(h.n)).padStart(8)} ${lsDate(h.n.mt)} ${h.p}`));
 else if(action==='delete')hits.reverse().forEach(h=>{if(h.k!=='/')rmNode(h.k);});
 else if(action==='exec'){if(execPlus&&hits.length){c.run(execArgs.flatMap(x=>x==='{}'?hits.map(h=>h.p):[x]));}else hits.forEach(h=>{const r=c.run(execArgs.map(x=>x.replace(/\{\}/g,h.p)));if(r)st=1;});}return st;};
CMD.xargs=(c,a)=>{const{f,rest:pos}=lead(a,['-n','-I','-P','-d','-L','-s']);const t=c.rest();const I=valF(f,'-I');const n=valF(f,'-n');const delim=hasF(f,'-0')?'\0':valF(f,'-d');let items=delim?t.split(delim).filter(x=>x!==''):tokenizeSimple(t.replace(/\n/g,' '));
 if(hasF(f,'-I')&&!delim)items=lines(t);if(!items.length&&hasF(f,'-r'))return 0;const cmd=pos.length?pos:['echo'];let st=0;
 if(I){items.forEach(it=>{const r=c.run(cmd.map(x=>x.split(I).join(it)));if(r)st=123;});return st;}
 const chunk=n?+n:items.length||1;for(let k=0;k<Math.max(items.length,1);k+=chunk){const r=c.run([...cmd,...items.slice(k,k+chunk)]);if(r)st=123;if(!items.length)break;}return st;};
CMD.timeout=(c,a)=>{const{rest}=lead(a,['-s','-k']);if(rest.length<2){c.el('timeout: missing operand');return 125;}return c.run(rest.slice(1));};
CMD.nohup=(c,a)=>{c.e("nohup: ignoring input and appending output to 'nohup.out'\n");return c.run(a);};
CMD.env=undefined;CMD.watch=(c,a)=>{const{rest:pos}=lead(a,['-n','-d']);c.pl(`Every 2.0s: ${pos.join(' ')}            ${W.host}: ${dateStr()}\n`);const r=c.run(pos);c.e('^C   (watch refreshes every 2s; the garden runs the command once)\n');return r;};
CMD.time=(c,a)=>c.run(a);

/* ---- awk ---- */
function awkRun(prog,files,opt,c){
 const T=[];let i=0;const s=prog;const prevRegexOK=()=>{const l=T[T.length-1];return !l||(l.t==='op'&&![')',']'].includes(l.v))||(l.t==='kw');};
 while(i<s.length){const ch=s[i];if(/\s/.test(ch)){if(ch==='\n')T.push({t:'op',v:';',nl:true});i++;continue;}if(ch==='#'){while(i<s.length&&s[i]!=='\n')i++;continue;}
  if(/\d|\./.test(ch)&&!(ch==='.'&&!/\d/.test(s[i+1]||''))){const m=s.slice(i).match(/^(\d+\.?\d*([eE][+-]?\d+)?|\.\d+)/);T.push({t:'num',v:parseFloat(m[0])});i+=m[0].length;continue;}
  if(ch==='"'){let j=i+1,o='';while(j<s.length&&s[j]!=='"'){if(s[j]==='\\'){const n=s[++j];o+=n==='n'?'\n':n==='t'?'\t':n;}else o+=s[j];j++;}T.push({t:'str',v:o});i=j+1;continue;}
  if(ch==='/'&&prevRegexOK()){let j=i+1,o='';while(j<s.length&&s[j]!=='/'){if(s[j]==='\\'&&s[j+1]==='/'){o+='/';j+=2;continue;}o+=s[j];j++;}T.push({t:'re',v:o});i=j+1;continue;}
  const id=s.slice(i).match(/^[A-Za-z_]\w*/);if(id){T.push({t:['BEGIN','END','if','else','for','while','in','print','printf','next','exit','delete','function','do','getline'].includes(id[0])?'kw':'id',v:id[0]});i+=id[0].length;continue;}
  const op=s.slice(i).match(/^(\+\+|--|\+=|-=|\*=|\/=|%=|\^=|==|!=|<=|>=|&&|\|\||!~|[-+*\/%^!<>=~?:,;{}()\[\]$|])/);if(op){T.push({t:'op',v:op[0]});i+=op[0].length;continue;}throw new Error('syntax error at source line 1\n context is\n\t>>> '+s.slice(i,i+8)+' <<<');}
 let p=0;const pk=()=>T[p],nx=()=>T[p++];const isOp=v=>pk()&&pk().t==='op'&&pk().v===v;const isKw=v=>pk()&&pk().t==='kw'&&pk().v===v;const skipT=()=>{while(isOp(';'))p++;};
 function prog_(){const rules=[];skipT();while(p<T.length){let pat=null,act=null,kind='rule';
   if(isKw('BEGIN')){p++;kind='begin';}else if(isKw('END')){p++;kind='end';}else if(isKw('function')){p++;const nm=nx().v;nx();const ps=[];while(!isOp(')')){const t=nx();if(t.t==='id')ps.push(t.v);}p++;skipT();const body=block();W.awkF=W.awkF||{};(prog_.funcs=prog_.funcs||{})[nm]={ps,body};skipT();continue;}
   else if(!isOp('{')){pat=expr();if(isOp(',')){p++;const p2_=expr();pat={range:[pat,p2_]};}}
   if(isOp('{'))act=block();rules.push({kind,pat,act});skipT();}return rules;}
 function block(){p++;const st=[];skipT();while(!isOp('}')){if(p>=T.length)throw new Error('syntax error: missing }');st.push(stmt());skipT();}p++;return st;}
 function simple(){if(isKw('print')||isKw('printf')){const k=nx().v;const args=[];if(!(isOp(';')||isOp('}')||isOp('>')||isOp('|'))){args.push(expr(true));while(isOp(',')){p++;args.push(expr(true));}}let redir=null;if(isOp('>')){p++;redir={op:'>',e:conc()};}return{k,args,redir};}
  if(isKw('next')){p++;return{k:'next'};}if(isKw('exit')){p++;let e=null;if(!isOp(';')&&!isOp('}'))e=expr();return{k:'exit',e};}if(isKw('delete')){p++;const nm=nx().v;nx();const ix=expr();nx();return{k:'delete',nm,ix};}return{k:'expr',e:expr()};}
 function stmt(){if(isOp('{'))return{k:'block',b:block()};
  if(isKw('if')){p++;nx();const c_=expr();nx();skipT();const th=stmt();skipT();let el=null;if(isKw('else')){p++;skipT();el=stmt();}return{k:'if',c:c_,th,el};}
  if(isKw('while')){p++;nx();const c_=expr();nx();skipT();return{k:'while',c:c_,b:stmt()};}
  if(isKw('for')){p++;nx();if(pk().t==='id'&&T[p+1]&&T[p+1].t==='kw'&&T[p+1].v==='in'){const v=nx().v;p++;const arr=nx().v;nx();skipT();return{k:'forin',v,arr,b:stmt()};}
   const init=isOp(';')?null:simple();nx();const c_=isOp(';')?null:expr();nx();const stp=isOp(')')?null:simple();nx();skipT();return{k:'for',init,c:c_,stp,b:stmt()};}
  return simple();}
 const PREC=[['?'],['||'],['&&'],['in'],['~','!~'],['<','<=','>','>=','==','!=']];
 function expr(noGt){return tern(noGt);}
 function tern(ng){const c_=bin(1,ng);if(isOp('?')){p++;const a=tern(ng);nx();const b=tern(ng);return{k:'tern',c:c_,a,b};}return c_;}
 function bin(l,ng){if(l>=PREC.length)return conc(ng);let left=bin(l+1,ng);for(;;){const t=pk();if(!t)break;const v=t.v;
   if(PREC[l].includes(v)&&(t.t==='op'||t.t==='kw')){if(ng&&v==='>')break;p++;if(v==='in'){const nm=nx().v;left={k:'in',l:left,nm};}else{const r=bin(l+1,ng);left={k:'bin',o:v,l:left,r};}}else break;}return left;}
 const startsPrimary=t=>t&&(t.t==='num'||t.t==='str'||t.t==='id'||(t.t==='op'&&['$','(','!','-','+','++','--'].includes(t.v))||t.t==='re');
 function conc(ng){let left=add();while(startsPrimary(pk())&&!(pk().t==='op'&&['+','-'].includes(pk().v))&&!isKw('in')){left={k:'cat',l:left,r:add()};}return left;}
 function add(){let l=mul();while(pk()&&pk().t==='op'&&(pk().v==='+'||pk().v==='-')){const o=nx().v;l={k:'bin',o,l,r:mul()};}return l;}
 function mul(){let l=pow();while(pk()&&pk().t==='op'&&['*','/','%'].includes(pk().v)){const o=nx().v;l={k:'bin',o,l,r:pow()};}return l;}
 function pow(){let l=unary_();if(isOp('^')){p++;return{k:'bin',o:'^',l,r:pow()};}return l;}
 function unary_(){if(isOp('!')){p++;return{k:'not',e:unary_()};}if(isOp('-')){p++;return{k:'neg',e:unary_()};}if(isOp('+')){p++;return unary_();}
  if(isOp('++')||isOp('--')){const o=nx().v;const lv=primary();return{k:'incr',lv,d:o==='++'?1:-1,pre:true};}
  let e=primary();if(isOp('++')||isOp('--')){const o=nx().v;e={k:'incr',lv:e,d:o==='++'?1:-1,pre:false};}else if(pk()&&pk().t==='op'&&['=','+=','-=','*=','/=','%=','^='].includes(pk().v)&&(e.k==='var'||e.k==='idx'||e.k==='field')){const o=nx().v;e={k:'asg',o,lv:e,r:tern()};}return e;}
 function primary(){const t=nx();if(!t)throw new Error('syntax error: unexpected end');
  if(t.t==='num')return{k:'num',v:t.v};if(t.t==='str')return{k:'str',v:t.v};if(t.t==='re')return{k:'re',v:t.v};
  if(t.t==='op'&&t.v==='('){const e=expr();nx();return e;}if(t.t==='op'&&t.v==='$'){const e=unary_();return{k:'field',e};}
  if(t.t==='id'||t.t==='kw'&&t.v==='getline'){if(isOp('(')&&['length','substr','index','split','sub','gsub','sprintf','tolower','toupper','int','sqrt','match','systime','rand','srand','sin','cos','exp','log'].includes(t.v)||isOp('(')&&prog_.funcs&&prog_.funcs[t.v]){p++;const args=[];if(!isOp(')')){args.push(expr());while(isOp(',')){p++;args.push(expr());}}nx();return{k:'call',n:t.v,args};}
   if(t.v==='length'&&!isOp('('))return{k:'call',n:'length',args:[]};if(isOp('[')){p++;const ix=expr();while(isOp(',')){p++;expr();}nx();return{k:'idx',nm:t.v,ix};}return{k:'var',nm:t.v};}
  throw new Error('syntax error at source line 1\n context is\n\t>>> '+(t.v||'')+' <<<');}
 prog_.funcs={};const rules=prog_();
 const V={NR:0,NF:0,FS:opt.FS,OFS:' ',ORS:'\n',RS:'\n',FILENAME:'',...opt.vars};const A={};let F=[''];let exitCode=null;
 const num=x=>typeof x==='number'?x:(parseFloat(x)||0);const str=x=>typeof x==='number'?(Number.isInteger(x)?String(x):String(+x.toPrecision(6))):String(x??'');
 const isNumStr=x=>typeof x==='number'||(typeof x==='string'&&/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(x));
 const mkRe=(r)=>new RegExp(r);
 function setRec(l){F=[l];const fs=V.FS;let parts;if(fs===' ')parts=l.trim()===''?[]:l.trim().split(/\s+/);else if(fs.length===1)parts=l===''?[]:l.split(fs);else parts=l.split(new RegExp(fs));F=[l,...parts];V.NF=parts.length;}
 function rebuild(){F[0]=F.slice(1).join(V.OFS);}
 const out=[];const emit=s=>c.o(s);
 function lval_set(lv,val){if(lv.k==='var'){V[lv.nm]=val;if(lv.nm==='NF'){F=F.slice(0,num(val)+1);while(F.length<=num(val))F.push('');rebuild();}}else if(lv.k==='idx'){(A[lv.nm]=A[lv.nm]||{})[str(ev(lv.ix))]=val;}else if(lv.k==='field'){const n=num(ev(lv.e));if(n===0)setRec(str(val));else{while(F.length<=n)F.push('');F[n]=str(val);V.NF=Math.max(V.NF,n);rebuild();}}}
 function ev(e){switch(e.k){case'num':return e.v;case'str':return e.v;case're':return mkRe(e.v).test(F[0])?1:0;
  case'var':return e.nm in V?V[e.nm]:(A[e.nm]?'':'');case'field':{const n=num(ev(e.e));return F[n]===undefined?'':(isNumStr(F[n])&&n>0?F[n]:F[n]);}case'idx':{const a=A[e.nm];const k=str(ev(e.ix));return a&&k in a?a[k]:'';}
  case'neg':return-num(ev(e.e));case'not':return ev(e.e)&&ev(e.e)!=='0'&&ev(e.e)!==''?0:1;case'cat':return str(ev(e.l))+str(ev(e.r));
  case'tern':return truthy(ev(e.c))?ev(e.a):ev(e.b);case'in':{const a=A[e.nm];return a&&str(ev(e.l))in a?1:0;}
  case'asg':{let v=ev(e.r);if(e.o!=='='){const cur=ev(e.lv);const o=e.o[0];v=o==='+'?num(cur)+num(v):o==='-'?num(cur)-num(v):o==='*'?num(cur)*num(v):o==='/'?num(cur)/num(v):o==='%'?num(cur)%num(v):Math.pow(num(cur),num(v));}lval_set(e.lv,v);return v;}
  case'incr':{const cur=num(ev(e.lv));lval_set(e.lv,cur+e.d);return e.pre?cur+e.d:cur;}
  case'bin':{const o=e.o;if(o==='&&')return truthy(ev(e.l))&&truthy(ev(e.r))?1:0;if(o==='||')return truthy(ev(e.l))||truthy(ev(e.r))?1:0;
   if(o==='~'||o==='!~'){const r=e.r.k==='re'?mkRe(e.r.v):mkRe(str(ev(e.r)));const m=r.test(str(ev(e.l)));return(o==='~'?m:!m)?1:0;}
   const l=ev(e.l),r=ev(e.r);if(['<','<=','>','>=','==','!='].includes(o)){let a=l,b=r;const numeric=isNumStr(a)&&isNumStr(b);if(numeric){a=num(a);b=num(b);}else{a=str(a);b=str(b);}return(o==='<'?a<b:o==='<='?a<=b:o==='>'?a>b:o==='>='?a>=b:o==='=='?a===b:a!==b)?1:0;}
   const a=num(l),b=num(r);return o==='+'?a+b:o==='-'?a-b:o==='*'?a*b:o==='/'?a/b:o==='%'?a%b:Math.pow(a,b);}
  case'call':return call(e);}return '';}
 const truthy=v=>typeof v==='number'?v!==0:(v!==''&&v!=='0'&&!(isNumStr(v)&&num(v)===0&&typeof v!=='string'));
 const tv=v=>typeof v==='number'?v!==0:(isNumStr(v)?num(v)!==0:v!=='');
 function call(e){const a=e.args;const fn=prog_.funcs[e.n];if(fn){const sv={};fn.ps.forEach((pn,i)=>{sv[pn]=V[pn];V[pn]=a[i]?ev(a[i]):'';});let rv='';try{exec(fn.body);}catch(x){if(x&&x.ret!==undefined)rv=x.ret;else throw x;}fn.ps.forEach(pn=>{V[pn]=sv[pn];});return rv;}
  switch(e.n){case'length':return a.length?(a[0].k==='var'&&A[a[0].nm]?Object.keys(A[a[0].nm]).length:str(ev(a[0])).length):F[0].length;
   case'substr':{const s2=str(ev(a[0]));let st=Math.round(num(ev(a[1])));let ln=a[2]?Math.round(num(ev(a[2]))):s2.length;let end=st+ln;if(st<1){st=1;}return s2.slice(st-1,Math.max(st-1,end-1));}
   case'index':return str(ev(a[0])).indexOf(str(ev(a[1])))+1;case'tolower':return str(ev(a[0])).toLowerCase();case'toupper':return str(ev(a[0])).toUpperCase();case'int':return Math.trunc(num(ev(a[0])));case'sqrt':return Math.sqrt(num(ev(a[0])));case'sin':return Math.sin(num(ev(a[0])));case'cos':return Math.cos(num(ev(a[0])));case'exp':return Math.exp(num(ev(a[0])));case'log':return Math.log(num(ev(a[0])));case'rand':return Math.random();case'srand':return 0;case'systime':return Math.floor(dt(W.t)/1000);
   case'sprintf':return printf(str(ev(a[0])),a.slice(1).map(x=>ev(x)).map(str));
   case'split':{const s2=str(ev(a[0]));const nm=a[1].nm;const sep=a[2]?(a[2].k==='re'?new RegExp(a[2].v):str(ev(a[2]))):V.FS;const parts=sep===' '?(s2.trim()?s2.trim().split(/\s+/):[]):s2===''?[]:s2.split(sep);A[nm]={};parts.forEach((x,i)=>A[nm][String(i+1)]=x);return parts.length;}
   case'match':{const m=str(ev(a[0])).match(a[1].k==='re'?new RegExp(a[1].v):new RegExp(str(ev(a[1]))));V.RSTART=m?m.index+1:0;V.RLENGTH=m?m[0].length:-1;return V.RSTART;}
   case'sub':case'gsub':{const re=new RegExp(a[0].k==='re'?a[0].v:str(ev(a[0])),e.n==='gsub'?'g':'');const target=a[2]||{k:'field',e:{k:'num',v:0}};const cur=str(ev(target));let n=0;const rep=str(ev(a[1])).replace(/\\&/g,'\u0001');const res=cur.replace(re,(m)=>{n++;return rep.replace(/&/g,m).replace(/\u0001/g,'&');});if(n)lval_set(target,res);return n;}}return 0;}
 function exec(list){for(const s of list){run1(s);}}
 function run1(s){switch(s.k){case'block':exec(s.b);break;case'expr':ev(s.e);break;
  case'print':{const parts=s.args.length?s.args.map(x=>str(ev(x))):[F[0]];const line=parts.join(V.OFS)+V.ORS;if(s.redir){const fnm=str(ev(s.redir.e));try{writeF(fnm,line,true);}catch(e){}}else emit(line);break;}
  case'printf':{const vals=s.args.map(x=>ev(x));emit(printf(str(vals[0]),vals.slice(1).map(str)));break;}
  case'if':if(tv(ev(s.c)))run1(s.th);else if(s.el)run1(s.el);break;
  case'while':{let g=0;while(tv(ev(s.c))&&g++<100000){try{run1(s.b);}catch(x){if(x==='brk')break;throw x;}}break;}
  case'for':{if(s.init)run1(s.init);let g=0;while((!s.c||tv(ev(s.c)))&&g++<100000){run1(s.b);if(s.stp)run1(s.stp);}break;}
  case'forin':{const keys=Object.keys(A[s.arr]||{});keys.sort((a,b)=>(isNaN(a)||isNaN(b))?0:a-b);for(const k of keys){V[s.v]=k;run1(s.b);}break;}
  case'delete':if(A[s.nm])delete A[s.nm][str(ev(s.ix))];break;case'next':throw'next';case'exit':exitCode=s.e?num(ev(s.e)):0;throw'exit';}}
 try{for(const r of rules.filter(r=>r.kind==='begin'))exec(r.act||[]);}catch(x){if(x!=='exit')throw x;}
 if(exitCode===null){const main=rules.filter(r=>r.kind==='rule'),ends=rules.filter(r=>r.kind==='end');
  let stop=false;const inRange=new Map();
  const srcs=files.length?files:[{name:'',text:c.rest()}];
  outer:for(const f of srcs){V.FILENAME=f.name;for(const l of lines(f.text)){V.NR++;setRec(l);try{for(const r of main){let ok=true;if(r.pat){if(r.pat.range){let on=inRange.get(r);if(!on){if(tv(ev(r.pat.range[0]))){inRange.set(r,true);on=true;}}if(on){ok=true;if(tv(ev(r.pat.range[1])))inRange.set(r,false);}else ok=false;}else ok=tv(ev(r.pat));}
     if(ok){if(r.act)exec(r.act);else emit(F[0]+V.ORS);}}}catch(x){if(x==='next')continue;if(x==='exit'){stop=true;break outer;}throw x;}}}
  try{for(const r of ends)exec(r.act||[]);}catch(x){if(x!=='exit')throw x;}}
 return exitCode||0;}
CMD.awk=(c,a)=>{const{pos,f}=po(a,['-F','-v','-f']);let prog=valF(f,'-f')?null:pos.shift();if(valF(f,'-f')){try{prog=readF(valF(f,'-f'));}catch(e){fsMsg(c,'awk',e);return 2;}}if(prog===undefined){c.el('usage: awk [-F fs][-v var=value][prog | -f progfile][file ...]');return 2;}
 const vars={};a.forEach((x,i)=>{if(x==='-v'){const[k,...v]=a[i+1].split('=');vars[k]=v.join('=');}});let FS=valF(f,'-F')??' ';if(FS==='\\t')FS='\t';if(FS.length>1&&FS.startsWith('\\'))FS=FS.slice(1);
 const r=inputs(c,pos,'awk');try{return awkRun(prog,r.out,{FS,vars},c);}catch(e){c.el('awk: '+e.message);return 2;}};
CMD.gawk=CMD.awk;CMD.mawk=CMD.awk;

/* ---- sed ---- */
function sedParse(script){const cmds=[];let i=0;const s=script;
 const addr=()=>{let m;if((m=s.slice(i).match(/^(\d+|\$)/))){i+=m[0].length;return m[0]==='$'?{t:'last'}:{t:'n',n:+m[0]};}if(s[i]==='/'){let j=i+1,o='';while(j<s.length&&s[j]!=='/'){if(s[j]==='\\'&&s[j+1]==='/'){o+='/';j+=2;continue;}o+=s[j++];}i=j+1;return{t:'re',re:o};}return null;};
 while(i<s.length){while(/[\s;]/.test(s[i]||'x')&&i<s.length)i++;if(i>=s.length)break;let a1=addr(),a2=null;if(a1&&s[i]===','){i++;a2=addr();}let neg=false;while(s[i]===' ')i++;if(s[i]==='!'){neg=true;i++;}while(s[i]===' ')i++;const cmd=s[i++];
  if(cmd==='s'){const d=s[i++];let parts=[],cur='';while(i<s.length&&parts.length<2){if(s[i]==='\\'&&s[i+1]===d){cur+=d;i+=2;continue;}if(s[i]==='\\'){cur+=s[i]+s[i+1];i+=2;continue;}if(s[i]===d){parts.push(cur);cur='';i++;continue;}cur+=s[i++];}let fl='';while(i<s.length&&/[gpiI0-9]/.test(s[i]))fl+=s[i++];cmds.push({a1,a2,neg,c:'s',re:parts[0],rep:parts[1]??'',fl});}
  else if(cmd==='y'){const d=s[i++];let p1='',p2='';while(s[i]!==d)p1+=s[i++];i++;while(s[i]!==d)p2+=s[i++];i++;cmds.push({a1,a2,neg,c:'y',p1,p2});}
  else if('aic'.includes(cmd)){let t=s.slice(i).replace(/^\\?\s*/,'');const e=t.indexOf('\n');const txt=e<0?t:t.slice(0,e);i=e<0?s.length:i+(s.slice(i).length-t.length)+e;cmds.push({a1,a2,neg,c:cmd,txt});}
  else if('dpqQ='.includes(cmd))cmds.push({a1,a2,neg,c:cmd});else if(cmd==='{'||cmd==='}'){}else throw new Error(`unknown command: \`${cmd}'`);}
 return cmds;}
CMD.sed=(c,a)=>{const{pos,f}=po(a,['-e','-f']);const scripts=[];a.forEach((x,i)=>{if(x==='-e')scripts.push(a[i+1]);else if(x==='-f'){try{scripts.push(readF(a[i+1]));}catch(e){}}});let files=pos;if(!scripts.length){scripts.push(files.shift());}if(scripts[0]===undefined){c.el('Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...');return 1;}
 const ere=hasF(f,'-E','-r','--regexp-extended');const inplace=a.some(x=>/^-i/.test(x))||hasF(f,'--in-place');const quiet=hasF(f,'-n','--quiet','--silent');let cmds;try{cmds=sedParse(scripts.join('\n'));}catch(e){c.el('sed: -e expression #1, char 0: '+e.message);return 1;}
 const proc=(text)=>{const L=lines(text);const outL=[];let quitNow=false;const states=cmds.map(()=>false);
  for(let n=0;n<L.length&&!quitNow;n++){let line=L[n];let del=false,printed=false;const ln=n+1,last=n===L.length-1;
   const match=(ad)=>ad.t==='n'?ln===ad.n:ad.t==='last'?last:new RegExp(toJsRe(ad.re,ere)).test(line);
   for(let k=0;k<cmds.length&&!del;k++){const cm=cmds[k];let ok=true;if(cm.a1){if(cm.a2){if(!states[k]){if(match(cm.a1)){states[k]=true;ok=true;if(cm.a2.t==='n'&&cm.a2.n<=ln)states[k]=false;}else ok=false;}else{ok=true;if(match(cm.a2))states[k]=false;}}else ok=match(cm.a1);}if(cm.neg)ok=!ok;if(!ok)continue;
    switch(cm.c){case's':{const flags=(cm.fl.includes('g')?'g':'')+(/[iI]/.test(cm.fl)?'i':'');const re=new RegExp(toJsRe(cm.re,ere),flags);const nth=cm.fl.match(/\d+/);let cnt=0;const before=line;line=line.replace(re,(m,...g)=>{cnt++;if(nth&&!cm.fl.includes('g')&&cnt!==+nth[0])return m;const groups=g.filter(x=>typeof x==='string'||x===undefined);return cm.rep.replace(/\\(\d)|&|\\n|\\t|\\&/g,(x,d)=>d?(groups[d-1]??''):x==='&'?m:x==='\\n'?'\n':x==='\\t'?'\t':'&');});if(cm.fl.includes('p')&&line!==before){outL.push(line);}break;}
     case'd':del=true;break;case'p':outL.push(line);break;case'q':quitNow=true;break;case'Q':quitNow=true;del=true;break;case'=':outL.push(String(ln));break;
     case'y':{const m={};[...cm.p1].forEach((ch,i)=>m[ch]=cm.p2[i]);line=[...line].map(ch=>m[ch]??ch).join('');break;}case'a':outL.push(null);outL.push({after:cm.txt});break;case'i':outL.push(cm.txt);break;case'c':line=cm.txt;break;}}
   if(!del&&!quiet)outL.push(line);else if(!del&&quiet&&false)outL.push(line);
   // handle appended text
   for(let q=0;q<outL.length;q++){if(outL[q]===null){outL.splice(q,1);q--;}else if(outL[q]&&outL[q].after!==undefined){const t=outL[q].after;outL.splice(q,1);outL.push(t);}}}
  return outL.join('\n')+(outL.length?'\n':'');};
 if(!files.length){c.o(proc(c.rest()));return 0;}let st=0;
 files.forEach(fl=>{try{const t=readF(fl);const res=proc(t);if(inplace){writeF(fl,res);const sfx=(a.find(x=>/^-i./.test(x))||'').slice(2);if(sfx)writeF(fl+sfx,t);}else c.o(res);}catch(e){fsMsg(c,'sed',e,"can't read");st=2;}});return st;};

/* ---- archives ---- */
function tarCollect(paths,exclude){const out=[];paths.forEach(p=>{const ap=rp(abspath(p));const n=getN(p);const base=p.replace(/^\.\//,'').replace(/\/$/,'');out.push({p:base+(n.t==='d'?'/':''),n:{...n}});
 if(n.t==='d')Object.keys(W.fs).filter(k=>k.startsWith(ap+'/')).sort().forEach(k=>{const rel=base+k.slice(ap.length);if(exclude&&exclude.some(e=>globRe(e).test(basename(k))))return;const nd=W.fs[k];out.push({p:rel+(nd.t==='d'?'/':''),n:{...nd}});});});return out;}
CMD.tar=(c,a)=>{let args=a.slice();let fl=args[0]&&!args[0].startsWith('-')?'-'+args.shift():args[0]&&/^-[a-zA-Z]+$/.test(args[0])?args.shift():'';const{pos,f}=po(args,['-f','-C','--exclude','-T']);const letters=fl.replace('-','');const has_=ch=>letters.includes(ch)||hasF(f,'-'+ch);
 let file=valF(f,'-f');if(!file&&letters.includes('f')){file=pos.shift();}if(!file){c.el("tar: Refusing to read archive contents from terminal (missing -f option?)");return 2;}
 const gz=has_('z')||/\.t?gz$/.test(file);const dir=valF(f,'-C');const ex=a.filter((x,i)=>a[i-1]==='--exclude').concat(a.filter(x=>x.startsWith('--exclude=')).map(x=>x.slice(10)));
 if(has_('c')){if(!pos.length){c.el('tar: Cowardly refusing to create an empty archive');return 2;}let items;try{items=tarCollect(pos,ex);}catch(e){c.el(`tar: ${e.path}: Cannot stat: ${ERRTXT[e.code]}`);return 2;}
  const payload=items.map(i=>({p:i.p,t:i.n.t,m:i.n.m,u:i.n.u,g:i.n.g,c:i.n.c||'',s:i.n.s,mt:i.n.mt,tg:i.n.tg}));const raw=JSON.stringify(payload);const size=Math.max(512,items.reduce((s,i)=>s+sizeOf(i.n),0))*(gz?0.3:1.05);
  try{writeF(file,(gz?'\x1f\x8bGZ':'\0TAR')+'\n'+raw);getN(file).s=Math.round(size);}catch(e){c.el(`tar: ${file}: Cannot open: ${ERRTXT[e.code]}`);return 2;}if(has_('v'))items.forEach(i=>c.pl(i.p));return 0;}
 let txt;try{txt=readF(file);}catch(e){c.el(`tar: ${file}: Cannot open: ${ERRTXT[e.code]}`);return 2;}if(!/^(\0TAR|\x1f\x8bGZ)\n/.test(txt)){c.el('tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors');return 2;}const items=JSON.parse(txt.slice(txt.indexOf('\n')+1));
 if(has_('t')){items.forEach(i=>{if(has_('v'))c.pl(`${modeStr({t:i.t,m:i.m})} ${i.u}/${i.g} ${String(i.s??i.c.length).padStart(8)} ${lsDate(i.mt)} ${i.p}`);else c.pl(i.p);});return 0;}
 if(has_('x')){const base=dir?abspath(dir):W.cwd;let st=0;for(const i of items){if(pos.length&&!pos.some(p=>i.p===p||i.p.startsWith(p.replace(/\/$/,'')+'/')))continue;const dest=abspath(i.p,base);try{if(i.t==='d'){if(!W.fs[dest]){const par=W.fs[dirname(dest)];if(!par)mkdirp(dest,{u:W.user});else{if(!can(par,2))throw new FsErr('EACCES',dest);W.fs[dest]={t:'d',m:i.m,u:isRoot()?i.u:W.user,g:isRoot()?i.g:userGroups(W.user)[0],mt:W.t};}}}else{writeF(dest,i.c);const nd=W.fs[rp(dest)];if(i.s!==undefined)nd.s=i.s;nd.m=i.m;if(isRoot()){nd.u=i.u;nd.g=i.g;}nd.mt=i.mt;}
   if(has_('v'))c.pl(i.p);}catch(e){c.el(`tar: ${i.p}: Cannot open: ${ERRTXT[e.code]||e.message}`);st=2;}}return st;}
 c.el('tar: You must specify one of the -Acdtrux options');return 2;};
CMD.gzip=(c,a)=>{const{pos,f}=po(a);let st=0;pos.forEach(p=>{try{const n=getN(p);if(hasF(f,'-d')){const t=readF(p);const out=p.replace(/\.gz$/,'');writeF(out,t.replace(/^\x1f\x8bGZ\n/,''));if(n.s)getN(out).s=Math.round(n.s/0.35);if(!hasF(f,'-k'))rmNode(p);return;}
 const sz=sizeOf(n);writeF(p+'.gz','\x1f\x8bGZ\n'+(n.c||''));getN(p+'.gz').s=Math.max(30,Math.round(sz*0.18));if(!hasF(f,'-k'))rmNode(p);}catch(e){fsMsg(c,'gzip',e);st=1;}});return st;};
CMD.gunzip=(c,a)=>CMD.gzip(c,['-d',...a]);CMD.zcat=(c,a)=>{a.forEach(p=>{try{c.o(readF(p).replace(/^\x1f\x8bGZ\n/,''));}catch(e){fsMsg(c,'zcat',e);}});return 0;};
CMD.rsync=(c,a)=>{const{pos,f}=po(a,['-e','--exclude','--bwlimit']);if(pos.length<2){c.el('rsync: missing source or destination');return 1;}const[src,dst]=[pos[0],pos[pos.length-1]];
 if(/^[\w.-]+@[\w.-]+:|^[\w.-]+:\//.test(src+dst)){c.pl(`sending incremental file list${hasF(f,'--dry-run','-n')?' (dry-run)':''}`);c.pl('(remote transfer simulated)');c.pl('sent 1,234 bytes  received 35 bytes  846.00 bytes/sec\ntotal size is 8,912  speedup is 7.02');return 0;}
 try{const sn=getN(src);const slash=src.endsWith('/');const list=[];const rel=(k,base)=>k.slice(base.length+1);const sp=rp(abspath(src));
  if(sn.t==='d'){const dp=slash?abspath(dst):abspath(dst)+'/'+basename(sp);const keys=Object.keys(W.fs).filter(k=>k.startsWith(sp+'/')).sort();if(!hasF(f,'--dry-run','-n'))mkdirp(dp,{u:W.user});keys.forEach(k=>{const nd=W.fs[k];const t=dp+'/'+rel(k,sp);if(nd.t==='d'){if(!hasF(f,'--dry-run','-n'))mkdirp(t,{u:W.user});list.push(rel(k,sp)+'/');}else{const ex=W.fs[t];if(!ex||ex.c!==nd.c||sizeOf(ex)!==sizeOf(nd)){list.push(rel(k,sp));if(!hasF(f,'--dry-run','-n')){writeF(t,nd.c||'');if(nd.s!==undefined)W.fs[rp(t)].s=nd.s;}}}});
   if(hasF(f,'--delete')&&!hasF(f,'--dry-run','-n')){Object.keys(W.fs).filter(k=>k.startsWith(dp+'/')&&!W.fs[sp+k.slice(dp.length)]).forEach(k=>{list.push('deleting '+k.slice(dp.length+1));rmNode(k);});}}
  else{const t=isDirP(dst)?abspath(dst)+'/'+basename(sp):abspath(dst);list.push(basename(sp));if(!hasF(f,'--dry-run','-n')){writeF(t,sn.c||'');if(sn.s!==undefined)W.fs[rp(t)].s=sn.s;}}
  c.pl('sending incremental file list'+(hasF(f,'--dry-run','-n')?' (dry-run)':''));list.forEach(l=>c.pl(l));c.pl('');c.pl(`sent ${1000+list.length*312} bytes  received ${35+list.length*18} bytes  ${(2070+list.length*100).toLocaleString()}.00 bytes/sec`);c.pl(`total size is ${list.length*1400}  speedup is ${(1.2+list.length/10).toFixed(2)}${hasF(f,'--dry-run','-n')?' (DRY RUN)':''}`);}catch(e){c.el(`rsync: [sender] link_stat "${src}" failed: ${ERRTXT[e.code]||e.message} (2)`);return 23;}return 0;};

CMD.bash=(c,a)=>{const flags=[];let i=0;for(;i<a.length&&a[i].startsWith('-')&&a[i]!=='--';i++){flags.push(a[i]);if(a[i]==='-c'||a[i]==='-o'){i++;if(a[i-1]==='-c')break;}}
 const so={...W.opts},sp=W.pos,ss=W.script;const fl=flags.join('');if(/e/.test(fl.replace('-o','')))W.opts.e=true;if(/u/.test(fl))W.opts.u=true;if(/x/.test(fl))W.opts.x=true;if(flags.join(' ').includes('pipefail'))W.opts.pipefail=true;
 try{if(flags.includes('-c')){const cmd=a[i];if(cmd===undefined){c.el('bash: -c: option requires an argument');return 2;}const rest=a.slice(i+1);W.pos=rest.slice(1);W.script=rest[0]||'bash';if(flags.includes('-n')){try{parse(cmd);return 0;}catch(e){c.el('bash: syntax error');return 2;}}try{return runString(cmd,c.io);}catch(e){if(e instanceof Sig&&(e.t==='exit'||e.t==='return'))return e.n;throw e;}}
  const file=a[i];if(!file){c.el('(interactive bash is your terminal already — try: bash -c "cmd" or bash script.sh)');return 0;}if(flags.includes('-n')){try{parse(readF(file));return 0;}catch(e){c.el(`${file}: syntax error`);return 2;}}
  try{return runScriptFile(file,a.slice(i+1),c.io,true);}catch(e){if(e instanceof Sig&&e.t==='exit')return e.n;throw e;}}finally{W.opts=so;W.pos=sp;W.script=ss;}};
CMD.sh=CMD.bash;CMD.dash=CMD.bash;
