# 🐧 Ops Arena — learn Linux & DevOps by fixing a live (simulated) server

A single-page game that runs entirely in your browser. No server, database or account.
It simulates an Ubuntu web server (`web01`) with a real bash interpreter, services, ports,
firewall, disks, users and logs that all react to each other.

Assumes you already know the basics (cd, ls, cat, grep, find, vim…). It focuses on:
shell power (pipes, redirects, expansion, scripts), text surgery (awk/sed/xargs), users & permissions,
processes & signals, systemd/journald/cron, networking (ip, ss, dig, curl, iptables/ufw, ssh, tcpdump),
storage (df/du, inodes, mounts, LVM, deleted-but-open files), incident response and automation.

## Run it on your laptop (free)
**Easiest:** double-click `index.html`.

**Local server (optional):**
```
python3 -m http.server 8080      # Windows: py -m http.server 8080
# open http://localhost:8080
```
Fonts load from Google Fonts; offline it falls back to system fonts. Progress is saved in your browser (localStorage).

## Host it online for free (optional)
Upload `index.html` to GitHub Pages, Netlify Drop (drag the folder), or Cloudflare Pages. No build step needed.

## What is inside
- 61 missions in 10 worlds (a Filesystem Tour, plus 8 realistic incidents and a "Black Friday" boss fight), a quiz per world
- Live explainer: decodes every command, flag and pipe stage while you type, warns about dangerous
  patterns / missing sudo, and shows how many lines flow through each pipeline stage
- Live dashboard: CPU, load, memory, disk, failed units, listening ports, processes, network, disks, users, services
- Interactive Filesystem map: what every Linux folder is, why it exists, live peek into the practice server, "where would I look for…?" guide and common confusions
- Command book: 184 entries (with pro tips) and 44 concept cards (boot process, kernel vs user space, virtual filesystems, PAM, journaling, swap, SELinux and more)
- Sandbox with "chaos buttons" that inject realistic problems

Helpers you can type in the terminal: `tick 10m` (fast-forward the clock so cron runs),
`outside 8080` (a client at 10.0.2.99 tries to reach a port), `help`, `help-me`.

## Layout
```
index.html          the finished game (generated, self-contained)
src/head.html       page + CSS
src/world.js        the simulated server (filesystem, users, procs, services, network, disks)
src/shell.js        bash interpreter (pipes, redirects, expansion, loops, functions, scripts)
src/cmds_a.js       builtins + text/file commands (awk, sed, grep, find, tar, rsync...)
src/cmds_b.js       users, processes, systemd, journald, cron
src/cmds_c.js       network, firewall, ssh, storage/LVM, packages
src/data.js         command book, concepts, filesystem guide, missions, quizzes
src/ui.js           mascot, dashboard, terminal, live explainer, quizzes
build.sh            rebuilds index.html from src/
tests/run.sh        plays all missions with scripted solutions (needs Node.js)
```

## Editing
1. Edit files in `src/` (e.g. add a mission to `QUESTS` in `src/data.js`; add its solution in `tests/solutions.js`).
2. `./build.sh`  then  `./tests/run.sh` (should print `missions failing: 0 of 61`).

A mission: `{id,w:worldId,t,e,xp,setup:()=>{...},story,goals:[{t,ok:(history)=>bool}],hints:[...],learn}`.

## Suggested git commits
```
git init -b main
git add README.md && git commit -m "Add README with run and hosting instructions"
git add src/world.js && git commit -m "Add simulated Linux server model"
git add src/shell.js && git commit -m "Add bash interpreter"
git add src/cmds_a.js src/cmds_b.js src/cmds_c.js && git commit -m "Add text, system, network, storage and package commands"
git add src/data.js && git commit -m "Add command book, concepts, 55 missions and quizzes"
git add src/head.html src/ui.js && git commit -m "Add UI: dashboard, terminal, live explainer, quizzes"
git add tests build.sh index.html && git commit -m "Add tests, build script and generated index.html"
```
