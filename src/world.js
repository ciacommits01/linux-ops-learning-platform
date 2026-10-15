/* ================= WORLD MODEL: a tiny, self-consistent Linux server ================= */
const BASE_T=Date.UTC(2026,9,14,9,0,0),K1=1024,M1=K1*K1,G1=M1*K1;
let W=null;
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const p2=n=>String(n).padStart(2,'0');
const dt=(min,sec=0)=>new Date(BASE_T+min*60000+sec*1000);
const ts=(min,sec=0)=>{const d=dt(min,sec);return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;};
const lsDate=min=>{const d=dt(min);return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;};
const dateStr=()=>{const d=dt(W.t,W.seq%60);return `${DOW[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC 2026`;};
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const hsize=(b,si)=>{const u=['','K','M','G','T'];let i=0,v=b;while(v>=1024&&i<4){v/=1024;i++;}return (v<10&&i>0?v.toFixed(1):Math.round(v))+u[i];};
const lines=s=>(s===undefined||s==='')?[]:s.replace(/\n$/,'').split('\n');
const uniq=a=>[...new Set(a)];
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const plural=(n,w)=>n+' '+w+(n===1?'':'s');
function sha(s){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return((h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0'));}
const hex=(s,n)=>{let o='';let i=0;while(o.length<n)o+=sha(s+i++);return o.slice(0,n);};

/* ---------- filesystem ---------- */
class FsErr extends Error{constructor(code,path){super(code);this.code=code;this.path=path;}}
const ERRTXT={ENOENT:'No such file or directory',EACCES:'Permission denied',EEXIST:'File exists',EISDIR:'Is a directory',ENOTDIR:'Not a directory',ENOTEMPTY:'Directory not empty',ENOSPC:'No space left on device',EROFS:'Read-only file system',EPERM:'Operation not permitted',EINVAL:'Invalid argument'};
const dirname=p=>{const i=p.lastIndexOf('/');return i<=0?'/':p.slice(0,i);};
const basename=p=>{const s=p.replace(/\/+$/,'');return s.slice(s.lastIndexOf('/')+1)||'/';};
function homeOf(u){const x=getUsers().find(y=>y.n===u);return x?x.home:'/';}
function abspath(p,cwd){cwd=cwd||W.cwd;if(p===undefined||p==='')return cwd;if(p==='~'||p.startsWith('~/'))p=homeOf(W.user)+p.slice(1);else if(/^~[a-z_][\w-]*/.test(p)){const m=p.match(/^~([\w-]+)(.*)$/);p=homeOf(m[1])+m[2];}
 if(!p.startsWith('/'))p=cwd+'/'+p;const o=[];for(const s of p.split('/')){if(!s||s==='.')continue;if(s==='..')o.pop();else o.push(s);}return '/'+o.join('/');}
function rp(p,follow=true){let parts=p.split('/').filter(Boolean),cur='',n=0;
 for(let i=0;i<parts.length;i++){cur+='/'+parts[i];const nd=W.fs[cur];if(nd&&nd.t==='l'&&(follow||i<parts.length-1)){if(++n>8)throw new FsErr('EINVAL',p);const t=abspath(nd.tg,dirname(cur));return rp(t+(parts.slice(i+1).length?'/'+parts.slice(i+1).join('/'):''),follow);}}
 return cur||'/';}
const isRoot=()=>W.user==='root';
function userGroups(u){const g=getGroups(),us=getUsers().find(x=>x.n===u);const r=[];if(us){const pg=g.find(x=>x.gid===us.gid);if(pg)r.push(pg.n);}g.forEach(x=>{if(x.mem.includes(u)&&!r.includes(x.n))r.push(x.n);});return r;}
function perm(n,bit){if(isRoot())return bit!==1||n.t==='d'||(n.m&0o111)!==0;const sh=n.u===W.user?6:userGroups(W.user).includes(n.g)?3:0;return(((n.m>>sh)&7)&bit)!==0;}
function aclAllows(n,bit){if(!n.acl||isRoot())return null;const ug=userGroups(W.user);for(const a of n.acl){if((a.k==='u'&&a.n===W.user)||(a.k==='g'&&ug.includes(a.n)))return(a.p&bit)!==0;}return null;}
function can(n,bit){const a=aclAllows(n,bit);if(a===true)return true;return perm(n,bit);}
function traverse(p){const parts=p.split('/').filter(Boolean);let cur='';for(let i=0;i<parts.length-1;i++){cur+='/'+parts[i];const n=W.fs[cur];if(!n)throw new FsErr('ENOENT',p);if(n.t==='d'&&!can(n,1))throw new FsErr('EACCES',p);}}
function acc(p,op,ok){if(W.strace)W.strace.push({p,op,ok});}
function getN(path,follow=true){let p;try{p=rp(abspath(path),follow);traverse(p);}catch(e){acc(abspath(path),'stat',e.code);throw e;}const n=W.fs[p];if(!n){acc(p,'stat','ENOENT');throw new FsErr('ENOENT',path);}return n;}
const sizeOf=n=>n.s!==undefined?n.s:n.t==='d'?4096:n.t==='l'?n.tg.length:n.f?n.f().length:(n.c||'').length;
function mountOf(p){let b='/';for(const m of Object.keys(W.mounts))if(m!=='/'&&(p===m||p.startsWith(m+'/'))&&m.length>b.length)b=m;return b;}
function usedBytes(m){let u=W.mounts[m].base;for(const[p,n]of Object.entries(W.fs))if(n.t==='f'&&mountOf(p)===m)u+=sizeOf(n);W.procs.forEach(p=>(p.deleted||[]).forEach(d=>{if(mountOf(d.path)===m)u+=d.size;}));return u;}
function usedInodes(m){let u=W.mounts[m].ibase;for(const[p,n]of Object.entries(W.fs))if(mountOf(p)===m)u+=1+(n.ino||0);return u;}
function readF(path){const n=getN(path);if(n.t==='d')throw new FsErr('EISDIR',path);if(n.t==='c'){const nm=rp(abspath(path));return nm==='/dev/zero'?'\0'.repeat(8192):/random/.test(nm)?hex(String(W.seq),8192):'';}if(!can(n,4)){acc(abspath(path),'read','EACCES');throw new FsErr('EACCES',path);}acc(abspath(path),'read',0);return n.f?n.f():(n.c||'');}
function sysRead(p){const n=W.fs[p];return n?(n.f?n.f():n.c||''):'';}
function writeF(path,data,append){const ap=abspath(path);acc(ap,'write',0);const p=rp(ap);traverse(p);let n=W.fs[p];
 if(n&&n.t==='c')return;if(n&&n.t==='d')throw new FsErr('EISDIR',path);
 const par=W.fs[dirname(p)];if(!par)throw new FsErr('ENOENT',path);if(par.t!=='d')throw new FsErr('ENOTDIR',path);
 if(n){if(!can(n,2))throw new FsErr('EACCES',path);}else if(!can(par,2)||!can(par,1))throw new FsErr('EACCES',path);
 const m=mountOf(p);if(W.mounts[m].ro)throw new FsErr('EROFS',path);
 const add=data.length-(n&&append?0:(n?sizeOf(n):0));if(add>0&&usedBytes(m)+add>W.mounts[m].size&&!isRoot())throw new FsErr('ENOSPC',path);if(add>0&&usedBytes(m)+add>W.mounts[m].size)throw new FsErr('ENOSPC',path);
 if(n){n.c=append?(n.c||'')+data:data;if(n.s!==undefined&&!append)delete n.s;n.mt=W.t;}else W.fs[p]={t:'f',m:0o666&~(W.umask===undefined?0o022:W.umask),u:W.user,g:(par.m&0o2000)?par.g:(userGroups(W.user)[0]||W.user),c:data,mt:W.t};}
function put(path,c,o={}){const p=abspath(path,'/');mkdirp(dirname(p));W.fs[p]={t:'f',m:o.m??0o644,u:o.u||'root',g:o.g||o.u||'root',c:c,mt:o.mt??-300,...(o.s!==undefined?{s:o.s}:{})};return W.fs[p];}
function mkdirp(path,o={}){const p=abspath(path,'/');const parts=p.split('/').filter(Boolean);let cur='';for(const s of parts){cur+='/'+s;if(!W.fs[cur])W.fs[cur]={t:'d',m:o.m??0o755,u:o.u||'root',g:o.g||o.u||'root',mt:o.mt??-300};}return W.fs[p]||W.fs['/'];}
function lsDir(path){const p=rp(abspath(path));const n=W.fs[p];if(!n)throw new FsErr('ENOENT',path);if(n.t!=='d')throw new FsErr('ENOTDIR',path);try{traverse(p+'/x');}catch(e){throw new FsErr(e.code,path);}if(!can(n,4))throw new FsErr('EACCES',path);
 const pre=p==='/'?'/':p+'/';const o=[];for(const k of Object.keys(W.fs)){if(k!==p&&k.startsWith(pre)&&!k.slice(pre.length).includes('/'))o.push(k.slice(pre.length));}return o.sort();}
function rmNode(p){const ap=rp(abspath(p),false);for(const k of Object.keys(W.fs))if(k===ap||k.startsWith(ap+'/'))delete W.fs[k];}
const isDirP=p=>{try{return getN(p).t==='d';}catch(e){return false;}};
const existsP=p=>{try{getN(p);return true;}catch(e){return false;}};

/* ---------- users & groups (parsed from the real files, so they stay consistent) ---------- */
function getUsers(){return lines(sysRead('/etc/passwd')).filter(l=>l&&!l.startsWith('#')).map(l=>{const a=l.split(':');return{n:a[0],uid:+a[2],gid:+a[3],gecos:a[4],home:a[5],shell:a[6]};});}
function getGroups(){return lines(sysRead('/etc/group')).filter(Boolean).map(l=>{const a=l.split(':');return{n:a[0],gid:+a[2],mem:a[3]?a[3].split(','):[]};});}
function setGroups(gs){W.fs['/etc/group'].c=gs.map(g=>`${g.n}:x:${g.gid}:${g.mem.join(',')}`).join('\n')+'\n';}
function setUsers(us){W.fs['/etc/passwd'].c=us.map(u=>`${u.n}:x:${u.uid}:${u.gid}:${u.gecos||''}:${u.home}:${u.shell}`).join('\n')+'\n';}
function getShadow(){return lines(sysRead('/etc/shadow')).filter(Boolean).map(l=>{const a=l.split(':');return{n:a[0],h:a[1],last:a[2],min:a[3],max:a[4],warn:a[5],inact:a[6],exp:a[7]};});}
function setShadow(ss){W.fs['/etc/shadow'].c=ss.map(s=>`${s.n}:${s.h}:${s.last||''}:${s.min||'0'}:${s.max||'99999'}:${s.warn||'7'}:${s.inact||''}:${s.exp||''}:`).join('\n')+'\n';}
const uidOf=n=>{const u=getUsers().find(x=>x.n===n);return u?u.uid:null;};
const gidOf=n=>{const g=getGroups().find(x=>x.n===n);return g?g.gid:null;};
function canSudo(u){if(u==='root')return true;const g=userGroups(u);if(g.includes('sudo')||g.includes('wheel'))return true;return lines(sysRead('/etc/sudoers')).some(l=>!l.startsWith('#')&&(new RegExp('^'+escRe(u)+'\\s+ALL').test(l)||(l.startsWith('%')&&g.includes(l.slice(1).split(/\s/)[0]))));}
const dayNow=()=>Math.floor((BASE_T+W.t*60000)/86400000);

/* ---------- processes, journal, services ---------- */
function addProc(o){const p={pid:W.nextPid++,ppid:1,user:'root',cmd:'?',st:'S',cpu:0,mem:0.1,rss:3000,vsz:15000,nice:0,tty:'?',start:W.t,listen:[],...o};p.args=p.args||p.cmd;W.procs.push(p);return p;}
const procBy=pid=>W.procs.find(p=>p.pid===pid);
function killTree(pid){const kids=W.procs.filter(p=>p.ppid===pid).map(p=>p.pid);kids.forEach(killTree);W.procs=W.procs.filter(p=>p.pid!==pid);}
function jr(unit,pri,msg,pid){W.seq++;W.journal.push({t:W.t,s:W.seq%60,unit,pri,msg,pid});}
const PRI={emerg:0,alert:1,crit:2,err:3,warning:4,notice:5,info:6,debug:7};
function portHolder(port,proto='tcp'){return W.procs.find(p=>p.listen.some(l=>l.port===port&&l.proto===proto));}
function listening(){const o=[];W.procs.forEach(p=>p.listen.forEach(l=>o.push({...l,proc:p})));return o.sort((a,b)=>a.port-b.port);}
function nginxConf(){return sysRead('/etc/nginx/nginx.conf');}
function nginxPort(){const m=nginxConf().match(/listen\s+(\d+)/);return m?+m[1]:80;}
function nginxTest(){const c=nginxConf(),L=lines(c),f='/etc/nginx/nginx.conf';const bad=m=>m+`\nnginx: configuration file ${f} test failed`;
 for(let i=0;i<L.length;i++){const t=L[i].trim();if(!t||t[0]==='#')continue;
  if(/^(BROKEN|;;)/.test(t))return bad(`nginx: [emerg] unknown directive "${t.split(/\s/)[0]}" in ${f}:${i+1}`);
  if(!/[;{}]$/.test(t))return bad(`nginx: [emerg] directive "${t.split(/\s/)[0]}" is not terminated by ";" in ${f}:${i+1}`);
  const sc=t.match(/^ssl_certificate\s+([^;\s]+)/);if(sc&&!existsP(sc[1]))return bad(`nginx: [emerg] cannot load certificate "${sc[1]}": BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory)`);}
 const o=(c.match(/{/g)||[]).length,cl=(c.match(/}/g)||[]).length;if(o>cl)return bad(`nginx: [emerg] unexpected end of file, expecting "}" in ${f}:${L.length}`);
 return null;}
const SSHD_OK=['Port','AddressFamily','ListenAddress','PermitRootLogin','PasswordAuthentication','PubkeyAuthentication','ChallengeResponseAuthentication','KbdInteractiveAuthentication','UsePAM','X11Forwarding','PrintMotd','AcceptEnv','Subsystem','MaxAuthTries','AllowUsers','AllowGroups','ClientAliveInterval','ClientAliveCountMax','LogLevel','Include','HostKey','AuthorizedKeysFile','PermitEmptyPasswords','LoginGraceTime','AllowTcpForwarding','Protocol','DenyUsers','Banner'];
function sshdTest(){const L=lines(sysRead('/etc/ssh/sshd_config'));for(let i=0;i<L.length;i++){const t=L[i].trim();if(!t||t.startsWith('#'))continue;const k=t.split(/\s+/)[0];if(!SSHD_OK.includes(k))return `/etc/ssh/sshd_config line ${i+1}: Bad configuration option: ${k}\n/etc/ssh/sshd_config: terminating, 1 bad configuration options`;if(k==='Port'&&!/^\d+$/.test(t.split(/\s+/)[1]||''))return `/etc/ssh/sshd_config line ${i+1}: Bad port '${t.split(/\s+/)[1]||''}'`;}return null;}
function sshdOpt(k,d){const L=lines(sysRead('/etc/ssh/sshd_config'));for(const l of L){const m=l.trim().match(new RegExp('^'+k+'\\s+(\\S+)','i'));if(m)return m[1];}return d;}
function defSvc(name,o){W.svc[name]={name,desc:name,exec:'/usr/bin/'+name,user:'root',state:'inactive',enabled:false,pid:null,since:0,type:'simple',restart:'no',result:'success',masked:false,file:'/lib/systemd/system/'+name+'.service',loaded:true,port:null,nrestart:0,...o};return W.svc[name];}
function svcPort(s){return s.name==='nginx'?nginxPort():s.port;}
function svcPre(s){if(s.masked)return{msg:`Unit ${s.name}.service is masked.`,code:'masked'};
 if(s.name==='nginx'){const e=nginxTest();if(e)return{msg:e,code:'exit-code',status:'1/FAILURE',log:e.split('\n')[0]};}
 if(s.name==='sshd'){const e=sshdTest();if(e)return{msg:e,code:'exit-code',status:'255/EXCEPTION',log:e.split('\n')[0]};}
 const port=svcPort(s);if(port){const h=portHolder(port);if(h&&h.unit!==s.name)return{msg:`bind() to 0.0.0.0:${port} failed (98: Address already in use)`,code:'exit-code',status:'1/FAILURE',log:s.name==='nginx'?`nginx: [emerg] bind() to 0.0.0.0:${port} failed (98: Address already in use)`:`bind: Address already in use (port ${port} is held by ${h.cmd}, pid ${h.pid})`};}
 if(s.custom){const ex=s.exec.split(/\s+/)[0];let n;try{n=getN(ex);}catch(e){n=null;}
  if(!n)return{msg:`Failed at step EXEC spawning ${ex}: No such file or directory`,code:'exit-code',status:'203/EXEC',log:`Failed to execute ${ex}: No such file or directory`};
  if(!(n.m&0o111))return{msg:`Failed at step EXEC spawning ${ex}: Permission denied`,code:'exit-code',status:'203/EXEC',log:`Failed to execute ${ex}: Permission denied`};
  if(s.user!=='root'&&uidOf(s.user)===null)return{msg:`Failed to determine user credentials: No such process`,code:'exit-code',status:'217/USER',log:`Failed to determine user credentials: No such process`};
  if(s.wd&&!existsP(s.wd))return{msg:`Failed at step CHDIR spawning ${ex}: No such file or directory`,code:'exit-code',status:'200/CHDIR',log:`Changing to the requested working directory failed: No such file or directory`};
  const sc=n.c||'';if(/^\s*exit\s+[1-9]/m.test(sc)&&!/while\s+true/.test(sc))return{msg:'',code:'exit-code',status:'1/FAILURE',log:`Main process exited, code=exited, status=1/FAILURE`,ran:true};}
 return null;}
function svcStart(name){const s=W.svc[name];if(!s)return{ok:false,msg:`Unit ${name}.service not found.`};if(!s.loaded)return{ok:false,msg:`Unit ${name}.service not found.`};
 if(s.state==='active')return{ok:true,already:true};const bad=svcPre(s);
 if(bad){s.state=s.restart!=='no'&&bad.ran?'activating':'failed';s.result=bad.code;s.status=bad.status;s.since=W.t;s.pid=null;jr(name,'err',bad.log||bad.msg);jr('systemd','err',`${name}.service: Failed with result '${bad.code}'.`);jr('systemd','err',`Failed to start ${s.desc}.`);return{ok:false,msg:bad.msg,bad};}
 s.state='active';s.since=W.t;s.result='success';s.status='';const port=svcPort(s);
 if(s.name==='nginx'){const m=addProc({cmd:'nginx: master process /usr/sbin/nginx',args:'nginx: master process /usr/sbin/nginx -g daemon on; master_process on;',listen:[{port,proto:'tcp',addr:'0.0.0.0'},{port,proto:'tcp',addr:'[::]',v6:true}],unit:'nginx',rss:5200,mem:0.1});s.pid=m.pid;for(let i=0;i<2;i++)addProc({cmd:'nginx: worker process',user:'www-data',ppid:m.pid,unit:'nginx',rss:5800});}
 else if(s.name==='postgresql'){const m=addProc({cmd:'/usr/lib/postgresql/16/bin/postgres -D /var/lib/postgresql/16/main',user:'postgres',listen:[{port:5432,proto:'tcp',addr:'127.0.0.1'}],unit:'postgresql',rss:38000,mem:0.9});s.pid=m.pid;['checkpointer','background writer','walwriter'].forEach(x=>addProc({cmd:'postgres: 16/main: '+x,user:'postgres',ppid:m.pid,unit:'postgresql',rss:9000}));}
 else if(s.name==='sshd'){const m=addProc({cmd:'sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups',listen:[{port:+sshdOpt('Port','22'),proto:'tcp',addr:'0.0.0.0'},{port:+sshdOpt('Port','22'),proto:'tcp',addr:'[::]',v6:true}],unit:'sshd',rss:7000});s.pid=m.pid;}
 else{const ex=s.exec.split(/\s+/)[0];let script='';try{script=s.custom?readFileSys(ex):'';}catch(e){}
  const longRun=!s.custom||(s.type!=='oneshot'&&/while\s+true|sleep\s+infinity|exec\s|\bnc\b|python|node|java|serve|tail -f/.test(script+' '+s.exec));
  if(!longRun){s.state='inactive';s.result='success';s.pid=null;jr(name,'info',`Finished ${s.desc}.`);return{ok:true,done:true};}
  const m=addProc({cmd:s.exec,user:s.user,unit:name,listen:s.port?[{port:s.port,proto:'tcp',addr:'0.0.0.0'}]:[],rss:14000});s.pid=m.pid;}
 jr('systemd','info',`Started ${s.desc}.`);jr(name,'info',`${name}[${s.pid}]: service started`,s.pid);return{ok:true};}
const readFileSys=p=>sysRead(rp(abspath(p,'/')));
function svcStop(name){const s=W.svc[name];if(!s)return false;W.procs.filter(p=>p.unit===name&&!W.procs.some(q=>q.pid===p.ppid&&q.unit===name)).forEach(p=>killTree(p.pid));W.procs=W.procs.filter(p=>p.unit!==name);if(s.state==='active'||s.state==='activating'){jr('systemd','info',`Stopped ${s.desc}.`);}s.state='inactive';s.pid=null;return true;}
function parseUnit(path){const c=readF(path);const o={};let sec='';lines(c).forEach(l=>{const t=l.trim();if(!t||t.startsWith('#')||t.startsWith(';'))return;const m=t.match(/^\[(.+)\]$/);if(m){sec=m[1];return;}const i=t.indexOf('=');if(i>0)(o[sec+'.'+t.slice(0,i)]=t.slice(i+1).trim());});return o;}
function daemonReload(){const base='/etc/systemd/system';let n=0;for(const f of Object.keys(W.fs)){if(f.startsWith(base+'/')&&f.endsWith('.service')&&W.fs[f].t==='f'){const name=basename(f).replace(/\.service$/,'');const u=parseUnit(f);const ex=u['Service.ExecStart']||'';const prev=W.svc[name];
  const o={desc:u['Unit.Description']||name,exec:ex,user:u['Service.User']||'root',type:u['Service.Type']||'simple',restart:u['Service.Restart']||'no',wd:u['Service.WorkingDirectory'],file:f,custom:true,loaded:true,wantedBy:u['Install.WantedBy']};
  if(!prev)defSvc(name,o);else Object.assign(prev,o,{loaded:true});n++;}}W.dirty=false;return n;}
function svcLines(name,n){return W.journal.filter(j=>j.unit===name||(j.unit==='systemd'&&new RegExp(escRe(name)+'\\b|'+escRe(W.svc[name]?W.svc[name].desc:name)).test(j.msg))).slice(-n);}

/* ---------- network & firewall ---------- */
const DNS_OK=['10.0.2.3','8.8.8.8','1.1.1.1','9.9.9.9'];
function nameservers(){return lines(sysRead('/etc/resolv.conf')).filter(l=>/^nameserver\s/.test(l)).map(l=>l.split(/\s+/)[1]);}
function dnsWorks(){return nameservers().some(n=>DNS_OK.includes(n));}
function myIps(){return W.net.ifaces.filter(i=>i.up).flatMap(i=>i.addrs.map(a=>a.split('/')[0]));}
function hostsFile(){const m={};lines(sysRead('/etc/hosts')).forEach(l=>{const t=l.replace(/#.*/,'').trim().split(/\s+/);if(t.length>1)t.slice(1).forEach(h=>{if(!m[h])m[h]=t[0];});});return m;}
function resolveName(n,dnsOnly){if(/^\d+\.\d+\.\d+\.\d+$/.test(n))return n;if(!dnsOnly){const h=hostsFile();if(h[n])return h[n];}if(n==='localhost')return '127.0.0.1';if(n===W.host)return '10.0.2.15';if(dnsWorks()&&W.dnsrec[n])return W.dnsrec[n];return null;}
function haveRoute(ip){if(/^127\./.test(ip)||myIps().includes(ip))return true;const up=W.net.ifaces.filter(i=>i.up);for(const i of up)for(const a of i.addrs){if(sameNet(ip,a))return true;}return W.net.routes.some(r=>r.dst==='default'&&up.some(i=>i.name===r.dev));}
function ip2n(ip){return ip.split('.').reduce((a,b)=>a*256+(+b),0);}
function sameNet(ip,cidr){const[b,m]=cidr.split('/');const bits=+m;if(bits===0)return true;const mask=Math.pow(2,32)-Math.pow(2,32-bits);return(ip2n(ip)&mask)===(ip2n(b)&mask);}
function fwEval(port,src,proto='tcp'){for(const r of W.fw.rules.filter(x=>x.ch==='INPUT')){if(r.proto&&r.proto!=='all'&&r.proto!==proto)continue;if(r.dport&&+r.dport!==port)continue;if(r.src&&r.src!=='0.0.0.0/0'&&!(r.src.includes('/')?sameNet(src,r.src):r.src===src))continue;r.cnt=(r.cnt||0)+1;return r.tgt;}
 if(W.fw.ufw&&W.fw.ufw.on){for(const u of W.fw.ufw.rules){if(u.proto&&u.proto!=='any'&&u.proto!==proto)continue;if(u.port&&+u.port!==port)continue;if(u.from&&u.from!=='any'&&!(u.from.includes('/')?sameNet(src,u.from):u.from===src))continue;return u.act==='allow'?'ACCEPT':'DROP';}return W.fw.ufw.defIn==='allow'?'ACCEPT':'DROP';}
 return W.fw.pol.INPUT;}
function connectTest(host,port,src='10.0.2.99'){const ip=resolveName(host);if(!ip)return{r:'nxdomain'};if(/^127\./.test(ip)||myIps().includes(ip)){const loop=/^127\./.test(ip);if(!loop){const v=fwEval(port,src);if(v==='DROP')return{r:'timeout',ip};if(v==='REJECT')return{r:'reject',ip};}const h=portHolder(port);return h?{r:'open',ip,proc:h}:{r:'refused',ip};}
 const rh=W.hostsUp[ip];if(!haveRoute(ip))return{r:'noroute',ip};if(!rh)return{r:'timeout',ip};return rh.ports.includes(port)?{r:'open',ip,remote:rh}:{r:'refused',ip};}

/* ---------- packages ---------- */
const PKGS={nginx:{v:'1.24.0-2ubuntu7',d:'small, powerful, scalable web/proxy server',b:['nginx'],svc:'nginx'},htop:{v:'3.3.0-4build1',d:'interactive processes viewer',b:['htop']},tcpdump:{v:'4.99.4-3ubuntu4',d:'command-line network traffic analyzer',b:['tcpdump']},nmap:{v:'7.94+git20230807',d:'The Network Mapper',b:['nmap']},strace:{v:'6.8-0ubuntu2',d:'System call tracer',b:['strace']},jq:{v:'1.7.1-3build1',d:'lightweight JSON processor',b:['jq']},tree:{v:'2.1.1-2ubuntu3',d:'displays directory tree',b:['tree']},dnsutils:{v:'1:9.18.28-0ubuntu0.24.04.1',d:'DNS lookup utilities (dig, nslookup)',b:['dig','nslookup','host']},traceroute:{v:'1:2.1.5-1',d:'traces the route packets take',b:['traceroute']},mtr:{v:'0.95-1build2',d:'network diagnostic tool',b:['mtr']},sysstat:{v:'12.6.1-2',d:'performance monitoring tools (iostat, mpstat, sar)',b:['iostat','mpstat','sar']},iotop:{v:'0.6-42-ga14256a',d:'per-process I/O monitor',b:['iotop']},'net-tools':{v:'2.10-0.1ubuntu4',d:'legacy network tools (ifconfig, netstat, route, arp)',b:['ifconfig','netstat','route','arp']},telnet:{v:'0.17+2.5-3ubuntu4',d:'telnet client',b:['telnet']},ncdu:{v:'1.19-0.1',d:'ncurses disk usage viewer',b:['ncdu']},postgresql:{v:'16+257build1.1',d:'object-relational SQL database',b:['psql'],svc:'postgresql'},apache2:{v:'2.4.58-1ubuntu8',d:'Apache HTTP Server',b:['apache2'],svc:'apache2'},git:{v:'1:2.43.0-1ubuntu7',d:'distributed version control system',b:['git']},rsync:{v:'3.2.7-1ubuntu1',d:'fast remote file copy program',b:['rsync']},zip:{v:'3.0-13ubuntu0.1',d:'archiver for .zip files',b:['zip','unzip']},fail2ban:{v:'1.0.2-3',d:'bans hosts that cause multiple auth errors',b:['fail2ban-client'],svc:'fail2ban'}};
const PRE_PKG=['nginx','postgresql','rsync','git'];
const BINPKG={};Object.entries(PKGS).forEach(([p,o])=>o.b.forEach(b=>BINPKG[b]=p));
function cmdMissing(name){const p=BINPKG[name];return p&&!W.pkgs.has(p)?p:null;}
function installPkg(p){W.pkgs.add(p);const _o=PKGS[p];if(_o)_o.b.forEach(b=>{if(!W.fs['/usr/bin/'+b])put('/usr/bin/'+b,'\x7fELF',{m:0o755,s:80000});});const o=PKGS[p];if(o&&o.svc&&!W.svc[o.svc]){const port=o.svc==='apache2'?80:null;defSvc(o.svc,{desc:o.d,exec:'/usr/sbin/'+o.svc,port,enabled:true});}}

/* ---------- metrics for the dashboard ---------- */
function memInfo(){const total=4096*1024;let used=W.procs.reduce((a,p)=>a+p.rss,0)+310000;const cache=W.cacheKB||620000;const free=Math.max(0,total-used-cache);const avail=Math.max(0,total-used);const swapT=2048*1024;let swapU=Math.max(0,used-total*0.97);swapU=Math.min(swapT,swapU+(W.swapBase||0));return{total,used:Math.min(used,total),free,cache,avail,swapT,swapU};}
function loadAvg(){const c=W.procs.reduce((a,p)=>a+(p.st==='R'?p.cpu/100:p.cpu/200),0);const b=0.12+c+(W.extraLoad||0);return[b,b*0.9,b*0.75];}
function metrics(){const la=loadAvg(),mi=memInfo();const cpu=Math.min(100,W.procs.reduce((a,p)=>a+p.cpu,0)+3);const m=W.mounts['/'];const du=Object.keys(W.mounts).map(k=>({m:k,pct:usedBytes(k)/W.mounts[k].size*100}));
 return{cpu,load:la[0],mem:(mi.total-mi.avail)/mi.total*100,disk:Math.max(...du.map(d=>d.pct)),diskMount:du.sort((a,b)=>b.pct-a.pct)[0].m,failed:Object.values(W.svc).filter(s=>s.state==='failed').length,ports:listening().filter(l=>!l.v6).length,users:1};}

/* ================= build a fresh server ================= */
function genAccess(){const r=rng(7),ips=['10.0.2.2','198.51.100.14','192.0.2.77','203.0.113.5','203.0.113.44','198.51.100.99','192.0.2.8','203.0.113.120','10.0.2.55','192.0.2.31'];const bad='203.0.113.9';
 const paths=['/','/index.html','/about','/api/v1/users','/api/v1/orders','/static/app.js','/static/site.css','/login','/health','/favicon.ico'],scan=['/wp-login.php','/admin','/.env','/phpmyadmin','/xmlrpc.php'],ua=['Mozilla/5.0','curl/8.5.0','Googlebot/2.1','python-requests/2.31'];const o=[];
 for(let i=0;i<420;i++){const min=i*1.4;const t=dt(-120+min/1);const tt=`${p2(t.getUTCDate())}/${MON[t.getUTCMonth()]}/2026:${p2(t.getUTCHours())}:${p2(t.getUTCMinutes())}:${p2(Math.floor(r()*60))} +0000`;let ip,path,st,by;
  if(r()<0.24){ip=bad;path=scan[Math.floor(r()*scan.length)];st=r()<0.8?404:(r()<0.5?403:401);by=153+Math.floor(r()*40);}
  else{ip=ips[Math.floor(r()*ips.length)];path=paths[Math.floor(r()*paths.length)];const x=r();st=x<0.84?200:x<0.89?304:x<0.93?404:x<0.97?500:502;if(path==='/api/v1/orders'&&r()<0.35)st=500;by=st===200?300+Math.floor(r()*9000):st===304?0:170+Math.floor(r()*40);}
  o.push(`${ip} - - [${tt}] "${r()<0.08?'POST':'GET'} ${path} HTTP/1.1" ${st} ${by} "-" "${ua[Math.floor(r()*ua.length)]}"`);}
 return o.join('\n')+'\n';}
function genAuth(){const r=rng(11),us=['admin','root','test','oracle','ubuntu','postgres','git','user'],ips=['198.51.100.23','198.51.100.23','203.0.113.77','203.0.113.77','203.0.113.77','192.0.2.201'];const o=[];
 for(let i=0;i<150;i++){const t=ts(-600+i*3,Math.floor(r()*60));const pid=1000+Math.floor(r()*900);const ip=ips[Math.floor(r()*ips.length)];const u=us[Math.floor(r()*us.length)];
  if(i%37===0)o.push(`${t} web01 sshd[${pid}]: Accepted publickey for devops from 10.0.2.2 port ${50000+i} ssh2: RSA SHA256:q7Xn2w`);else if(r()<0.2)o.push(`${t} web01 sshd[${pid}]: Invalid user ${u} from ${ip} port ${30000+i}`);else o.push(`${t} web01 sshd[${pid}]: Failed password for ${r()<0.5?'invalid user ':''}${u} from ${ip} port ${30000+i} ssh2`);}
 return o.join('\n')+'\n';}
function genSyslog(){const o=[];const msgs=['systemd[1]: Started Daily apt download activities.','CRON[2211]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)','systemd[1]: Starting Rotate log files...','systemd[1]: logrotate.service: Deactivated successfully.','systemd-resolved[412]: Using degraded feature set UDP instead of UDP+EDNS0 for DNS server 10.0.2.3.','kernel: [UFW BLOCK] IN=eth0 OUT= SRC=198.51.100.23 DST=10.0.2.15 PROTO=TCP DPT=23','systemd-networkd[388]: eth0: DHCPv4 address 10.0.2.15/24 via 10.0.2.2','rsyslogd: [origin software="rsyslogd" swVersion="8.2312.0"] rsyslogd was HUPed'];
 for(let i=0;i<60;i++)o.push(`${ts(-480+i*7)} web01 ${msgs[i%msgs.length]}`);return o.join('\n')+'\n';}
function newWorld(){
 W={scopes:[],opts:{e:false,u:false,x:false,pipefail:false},traps:{},pos:[],script:'bash',sessStart:0,depth:0,trace:[],seq:0,t:0,boot:-6140,host:'web01',fs:{},user:'devops',stack:[],cwd:'/home/devops',env:{PATH:'/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',HOME:'/home/devops',USER:'devops',SHELL:'/bin/bash',LANG:'en_US.UTF-8',PWD:'/home/devops',HOSTNAME:'web01',EDITOR:'vim'},vars:{},funcs:{},aliases:{ll:'ls -alF',la:'ls -A'},hist:[],jobs:[],status:0,umask:0o022,
  procs:[],nextPid:3100,svc:{},journal:[],kmsg:[],pkgs:new Set(['coreutils','bash','curl','openssh-server','cron','rsyslog','iproute2','iputils-ping','lsof','vim','less',...PRE_PKG]),cron:{},crontabsys:'',flags:{},dirty:false,cacheKB:620000,
  fw:{pol:{INPUT:'ACCEPT',FORWARD:'ACCEPT',OUTPUT:'ACCEPT'},rules:[],ufw:{on:false,defIn:'deny',rules:[]}},
  net:{ifaces:[{name:'lo',up:true,mac:'00:00:00:00:00:00',addrs:['127.0.0.1/8'],mtu:65536,rx:182000,tx:182000},{name:'eth0',up:true,mac:'52:54:00:12:34:56',addrs:['10.0.2.15/24'],mtu:1500,rx:48211000,tx:9120000},{name:'docker0',up:false,mac:'02:42:ac:11:00:01',addrs:['172.17.0.1/16'],mtu:1500,rx:0,tx:0}],routes:[{dst:'default',via:'10.0.2.2',dev:'eth0',metric:100},{dst:'10.0.2.0/24',dev:'eth0',src:'10.0.2.15',proto:'kernel'},{dst:'172.17.0.0/16',dev:'docker0',src:'172.17.0.1',proto:'kernel',linkdown:true}]},
  dnsrec:{'example.com':'93.184.216.34','google.com':'142.250.77.46','github.com':'140.82.112.3','api.internal':'10.0.2.50','db01':'10.0.2.60','web02':'10.0.2.12','registry.internal':'10.0.2.70'},
  hostsUp:{'93.184.216.34':{ports:[80,443],name:'example.com',http:200},'142.250.77.46':{ports:[80,443],name:'google.com',http:301},'140.82.112.3':{ports:[22,80,443],name:'github.com',http:301},'10.0.2.50':{ports:[8080,22],name:'api.internal',http:200},'10.0.2.60':{ports:[5432,22],name:'db01'},'10.0.2.12':{ports:[80,22],name:'web02',http:200},'10.0.2.2':{ports:[22],name:'gateway'},'10.0.2.3':{ports:[53],name:'dns'},'10.0.2.70':{ports:[443],name:'registry.internal',http:200}},
  mounts:{'/':{dev:'/dev/sda2',fs:'ext4',size:20*G1,base:6.4*G1,inodes:1310720,ibase:182000,opts:'rw,relatime'},'/boot':{dev:'/dev/sda1',fs:'ext4',size:1*G1,base:210*M1,inodes:65536,ibase:320,opts:'rw,relatime'},'/data':{dev:'/dev/mapper/vg0-data',fs:'ext4',size:5*G1,base:1.2*G1,inodes:327680,ibase:1400,opts:'rw,relatime'}},
  lvm:{pv:[{dev:'/dev/sdb',vg:'vg0',size:10*G1-4*M1}],vg:{vg0:{}},lv:{data:{vg:'vg0',size:5*G1}}},swap:{dev:'/dev/sda3',size:2*G1}};
 seedFS();seedUsers();seedServices();seedProcs();
 W.cron.devops='';W.mountsAll=JSON.parse(JSON.stringify(W.mounts));W.jobsList=[];
 W.journal.push({t:-6140,s:1,unit:'kernel',pri:'info',msg:'Linux version 6.8.0-45-generic (buildd@lcy02) #45-Ubuntu SMP'},{t:-6139,s:3,unit:'systemd',pri:'info',msg:'Started OpenBSD Secure Shell server.'},{t:-6139,s:9,unit:'systemd',pri:'info',msg:'Started A high performance web server and a reverse proxy server.'});
 W.kmsg=['[    0.000000] Linux version 6.8.0-45-generic','[    0.532114] ACPI: Core revision 20230628','[    2.113001] EXT4-fs (sda2): mounted filesystem with ordered data mode','[    4.882913] systemd[1]: Detected virtualization kvm.','[ 4012.221904] eth0: renamed from veth0'];
 return W;}
function seedUsers(){
 put('/etc/passwd','root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\nsshd:x:106:65534::/run/sshd:/usr/sbin/nologin\npostgres:x:110:116:PostgreSQL administrator:/var/lib/postgresql:/bin/bash\ndevops:x:1000:1000:DevOps Engineer:/home/devops:/bin/bash\nalice:x:1001:1001:Alice Dev:/home/alice:/bin/bash\nbob:x:1002:1002:Bob Intern:/home/bob:/bin/bash\n',{m:0o644});
 put('/etc/group','root:x:0:\ndaemon:x:1:\nadm:x:4:devops\nsudo:x:27:devops\nwww-data:x:33:\nshadow:x:42:\nnogroup:x:65534:\npostgres:x:116:\ndocker:x:999:devops\ndevops:x:1000:\nalice:x:1001:\nbob:x:1002:\ndevelopers:x:2000:alice\n',{m:0o644});
 const h='$6$rounds=656000$Qx1z';put('/etc/shadow',`root:!:20000:0:99999:7:::\ndaemon:*:20000:0:99999:7:::\nwww-data:*:20000:0:99999:7:::\nsshd:*:20000:0:99999:7:::\npostgres:!:20000:0:99999:7:::\ndevops:${h}$kJf9s2:${dayNow()-40}:0:99999:7:::\nalice:${h}$m81pQa:${dayNow()-100}:0:99999:7:::\nbob:${h}$zz0l3v:${dayNow()-5}:0:99999:7:::\n`,{m:0o640,g:'shadow'});
 put('/etc/sudoers','# User privilege specification\nroot\tALL=(ALL:ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\n',{m:0o440});
 ['devops','alice','bob'].forEach(u=>{mkdirp('/home/'+u,{u,m:0o755});put(`/home/${u}/.bashrc`,'# ~/.bashrc: executed by bash for non-login shells.\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -alF"\n',{u,m:0o644});put(`/home/${u}/.profile`,'# ~/.profile\n',{u});});
 mkdirp('/root');W.fs['/root'].m=0o700;put('/root/.bashrc','# root bashrc\n',{});
 put('/home/devops/notes.txt','TODO:\n- rotate nginx logs\n- check disk on /data\n- patch web01\n',{u:'devops'});
 put('/home/devops/deploy.sh','#!/bin/bash\necho "deploying..."\n',{u:'devops',m:0o644});
 mkdirp('/home/devops/scripts',{u:'devops'});mkdirp('/home/devops/.ssh',{u:'devops',m:0o700});}
function seedFS(){
 W.fs['/']={t:'d',m:0o755,u:'root',g:'root',mt:-300};['bin','boot','dev','etc','home','lib','opt','proc','root','run','sbin','srv','sys','tmp','usr','var','data','media','mnt'].forEach(d=>mkdirp('/'+d));
 W.fs['/tmp'].m=0o1777;W.fs['/bin']=W.fs['/bin'];
 ['/usr/bin','/usr/sbin','/usr/local/bin','/var/log','/var/www/html','/var/lib','/var/cache','/var/spool','/etc/ssh','/etc/nginx','/etc/systemd/system','/etc/cron.d','/srv','/opt'].forEach(d=>mkdirp(d));
 W.fs['/var/www/html']={...W.fs['/var/www/html'],u:'www-data',g:'www-data'};
 ['bash','sh','ls','cat','grep','sleep','ps','kill','systemctl','journalctl','curl','awk','sed','find','python3','tar','chmod','chown','env','echo','date','ln','cp','mv','rm'].forEach(b=>put('/usr/bin/'+b,'\x7fELF',{m:0o755,s:60000}));
 ['nginx','sshd','cron','rsyslogd','iptables','ip','ss','ufw','useradd','usermod','groupadd','fdisk','lvextend','resize2fs','postgres','apache2'].forEach(b=>put('/usr/sbin/'+b,'\x7fELF',{m:0o755,s:90000}));

 ['bin','sbin','lib'].forEach(d=>{W.fs['/'+d]={t:'l',m:0o777,u:'root',g:'root',tg:'usr/'+d,mt:-300};});mkdirp('/usr/lib');mkdirp('/usr/share/doc');mkdirp('/usr/include');mkdirp('/usr/local/bin');mkdirp('/usr/local/etc');
 mkdirp('/lost+found');W.fs['/lost+found'].m=0o700;mkdirp('/var/tmp');W.fs['/var/tmp'].m=0o1777;mkdirp('/var/lib/postgresql',{u:'postgres'});mkdirp('/var/lib/dpkg');mkdirp('/var/cache/apt');mkdirp('/var/spool/cron/crontabs');mkdirp('/var/mail');mkdirp('/etc/apt');mkdirp('/etc/default');mkdirp('/boot/grub');mkdirp('/run');mkdirp('/srv/www');
 put('/boot/vmlinuz-6.8.0-45-generic','\x7fELF',{s:14*M1});put('/boot/initrd.img-6.8.0-45-generic','\x1f\x8bGZ',{s:56*M1});put('/boot/grub/grub.cfg','# DO NOT EDIT: generated by update-grub\nmenuentry "Ubuntu" { linux /vmlinuz-6.8.0-45-generic root=/dev/sda2 ro quiet }\n');
 put('/sys/class/net/eth0/operstate','up\n');put('/sys/class/net/eth0/address','52:54:00:12:34:56\n');put('/sys/block/sda/size','50331648\n');put('/sys/kernel/hostname','web01\n');
 put('/etc/shells','# /etc/shells: valid login shells\n/bin/sh\n/bin/bash\n/usr/bin/zsh\n');put('/etc/nsswitch.conf','passwd:         files systemd\ngroup:          files systemd\nhosts:          files dns\n');put('/etc/profile','# /etc/profile: system-wide .profile for login shells\nexport PATH\n');put('/etc/bash.bashrc','# system-wide .bashrc for interactive bash shells\n');
 put('/etc/apt/sources.list','deb http://archive.ubuntu.com/ubuntu noble main restricted universe\ndeb http://security.ubuntu.com/ubuntu noble-security main\n');put('/etc/logrotate.conf','weekly\nrotate 4\ncreate\ncompress\ninclude /etc/logrotate.d\n');put('/usr/share/doc/README','Package documentation lives under /usr/share/doc/<package>.\n');
 put('/run/sshd.pid','');W.fs['/run/sshd.pid'].f=()=>String((W.svc.sshd&&W.svc.sshd.pid)||'')+'\n';put('/run/nginx.pid','');W.fs['/run/nginx.pid'].f=()=>String((W.svc.nginx&&W.svc.nginx.pid)||'')+'\n';
 put('/etc/hostname','web01\n');put('/etc/hosts','127.0.0.1 localhost\n127.0.1.1 web01\n10.0.2.50 api.internal\n\n# IPv6\n::1 ip6-localhost ip6-loopback\n');put('/etc/resolv.conf','# Generated by systemd-resolved\nnameserver 10.0.2.3\nsearch localdomain\n');
 put('/etc/os-release','PRETTY_NAME="Ubuntu 24.04.1 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nVERSION="24.04.1 LTS (Noble Numbat)"\nID=ubuntu\nID_LIKE=debian\nHOME_URL="https://www.ubuntu.com/"\n');
 put('/etc/fstab','# <file system> <mount point> <type> <options> <dump> <pass>\nUUID=3f5c-aa21 /boot ext4 defaults 0 2\n/dev/sda2 / ext4 errors=remount-ro 0 1\n/dev/mapper/vg0-data /data ext4 defaults 0 2\n/dev/sda3 none swap sw 0 0\n');
 put('/etc/environment','PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n');
 put('/etc/ssh/sshd_config','# sshd_config\nInclude /etc/ssh/sshd_config.d/*.conf\nPort 22\nPermitRootLogin yes\nPasswordAuthentication yes\nPubkeyAuthentication yes\nUsePAM yes\nX11Forwarding yes\nMaxAuthTries 6\n');
 put('/etc/nginx/nginx.conf','user www-data;\nworker_processes auto;\nevents {\n    worker_connections 768;\n}\nhttp {\n    sendfile on;\n    server {\n        listen 80;\n        server_name web01;\n        root /var/www/html;\n        index index.html;\n        location / {\n            try_files $uri $uri/ =404;\n        }\n    }\n}\n');
 put('/var/www/html/index.html','<h1>Welcome to nginx on web01!</h1>\n',{u:'www-data'});
 put('/etc/crontab','SHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n# m h dom mon dow user command\n17 * * * * root cd / && run-parts --report /etc/cron.hourly\n');
 put('/var/log/syslog',genSyslog(),{u:'syslog',g:'adm',m:0o640});put('/var/log/auth.log',genAuth(),{u:'syslog',g:'adm',m:0o640});
 mkdirp('/var/log/nginx',{u:'www-data',g:'adm'});put('/var/log/nginx/access.log',genAccess(),{u:'www-data',g:'adm',m:0o640});put('/var/log/nginx/error.log','2026/10/14 07:41:02 [error] 2201#2201: *18 open() "/var/www/html/favicon.ico" failed (2: No such file or directory)\n2026/10/14 08:02:55 [error] 2201#2201: *31 connect() failed (111: Connection refused) while connecting to upstream\n',{u:'www-data',g:'adm',m:0o640});
 put('/proc/loadavg','',{});W.fs['/proc/loadavg'].f=()=>{const l=loadAvg();return `${l[0].toFixed(2)} ${l[1].toFixed(2)} ${l[2].toFixed(2)} 1/${W.procs.length} ${W.nextPid}\n`;};
 put('/proc/meminfo','');W.fs['/proc/meminfo'].f=()=>{const m=memInfo();return `MemTotal:       ${m.total} kB\nMemFree:        ${m.free} kB\nMemAvailable:   ${m.avail} kB\nBuffers:        ${Math.round(m.cache*.1)} kB\nCached:         ${Math.round(m.cache*.9)} kB\nSwapTotal:      ${m.swapT} kB\nSwapFree:       ${m.swapT-m.swapU} kB\n`;};
 put('/proc/cpuinfo','processor\t: 0\nmodel name\t: Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz\ncpu MHz\t\t: 2399.998\ncache size\t: 35840 KB\n\nprocessor\t: 1\nmodel name\t: Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz\ncpu MHz\t\t: 2399.998\ncache size\t: 35840 KB\n');
 put('/proc/uptime','');W.fs['/proc/uptime'].f=()=>{const s=(W.t-W.boot)*60;return `${s}.12 ${Math.round(s*1.7)}.55\n`;};put('/proc/version','Linux version 6.8.0-45-generic (buildd@lcy02-amd64-079) (x86_64-linux-gnu-gcc-13) #45-Ubuntu SMP PREEMPT_DYNAMIC\n');
 ['null','zero','random','urandom','tty'].forEach(d=>{W.fs['/dev/'+d]={t:'c',m:0o666,u:'root',g:'root',mt:0};});['sda','sda1','sda2','sda3','sdb'].forEach(d=>{W.fs['/dev/'+d]={t:'b',m:0o660,u:'root',g:'disk',mt:0};});mkdirp('/dev/mapper');W.fs['/dev/mapper/vg0-data']={t:'b',m:0o660,u:'root',g:'disk',mt:0};mkdirp('/dev/vg0');W.fs['/dev/vg0/data']={t:'l',m:0o777,u:'root',g:'root',tg:'../mapper/vg0-data',mt:0};
 mkdirp('/data',{u:'root'});mkdirp('/data/backups',{u:'devops'});mkdirp('/srv',{});mkdirp('/opt/app',{u:'devops'});put('/opt/app/README','Internal app. Run ./start.sh to launch.\n',{u:'devops'});}
function seedServices(){
 defSvc('sshd',{desc:'OpenBSD Secure Shell server',exec:'/usr/sbin/sshd -D',port:22,enabled:true,state:'active',since:-6139});defSvc('cron',{desc:'Regular background program processing daemon',exec:'/usr/sbin/cron -f',enabled:true,state:'active',since:-6139});defSvc('rsyslog',{desc:'System Logging Service',exec:'/usr/sbin/rsyslogd -n',enabled:true,state:'active',since:-6139});
 defSvc('nginx',{desc:'A high performance web server and a reverse proxy server',exec:'/usr/sbin/nginx',port:80,enabled:true,state:'active',since:-6139,conf:'/etc/nginx/nginx.conf'});
 defSvc('postgresql',{desc:'PostgreSQL RDBMS',exec:'/usr/lib/postgresql/16/bin/postgres',port:5432,enabled:true,state:'active',since:-6139});}
function seedProcs(){
 const ap=(o)=>addProc(o);W.procs=[];W.nextPid=3100;
 const init=ap({pid:1,ppid:0,cmd:'/sbin/init',args:'/sbin/init splash',rss:11500,mem:0.3,start:-6140});W.nextPid=3100;
 [[2,'[kthreadd]'],[412,'/lib/systemd/systemd-journald'],[455,'/lib/systemd/systemd-udevd'],[618,'/lib/systemd/systemd-resolved'],[701,'/usr/sbin/rsyslogd -n'],[744,'/usr/sbin/cron -f']].forEach(([pid,c])=>{const p=ap({pid,ppid:pid===2?0:1,cmd:c,rss:pid===2?0:6500,vsz:pid===2?0:30000,start:-6140});W.nextPid=3100;if(pid===701)p.user='syslog';if(pid===618){p.user='systemd-resolve';p.listen=[{port:53,proto:'udp',addr:'127.0.0.53%lo'},{port:53,proto:'tcp',addr:'127.0.0.53%lo'}];}p.unit=pid===701?'rsyslog':pid===744?'cron':undefined;});
 W.nextPid=3100;ap({pid:1122,ppid:1,user:'devops',cmd:'-bash',tty:'pts/0',rss:5400,start:-30});W.nextPid=3100;
 W.nextPid=3100;svcStartQuiet('sshd');svcStartQuiet('nginx');svcStartQuiet('postgresql');
 W.nextPid=4200;}
function svcStartQuiet(n){const j=W.journal.length;W.svc[n].state='inactive';svcStart(n);W.journal.length=j;W.svc[n].since=-6139;}
newWorld();
