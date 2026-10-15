/* ================= CONTENT ================= */
/* compact reference: name|category|what it does|example|flag~meaning;flag~meaning|pro tip|(x = concept only) */
const REFSRC=`export|Shell|Make a variable visible to child processes (the environment).|export APP_ENV=production|-p~list exported vars|Plain VAR=x is shell-only; children (scripts, programs) never see it.
env|Shell|Show the environment, or run a command with temporary variables.|env APP_ENV=test ./run.sh|-i~start with an empty environment|env -i is how you test "does my script depend on my shell setup?".
printenv|Shell|Print one or all environment variables.|printenv PATH||Exit code 1 when the variable is unset: handy in scripts.
alias|Shell|Give a long command a short name (lives only in this shell).|alias ll='ls -lah'||Put aliases in ~/.bashrc to keep them. Scripts do not see aliases.
type|Shell|Tell what a name really is: alias, builtin, function or file.|type -a ls|-a~show every match;-t~one word: alias/builtin/file|"which" only searches PATH; type knows about aliases and builtins too.
source|Shell|Run a file in the CURRENT shell (so its variables and functions stay).|source ~/.bashrc||./script.sh runs in a child and cannot change your shell; source can.
set|Shell|Change shell options. -e stops on error, -u errors on unset vars, -o pipefail catches failures in pipes.|set -euo pipefail|-e~exit on error;-u~unset variable is an error;-x~trace each command;-o pipefail~pipeline fails if any stage fails|The first line of every serious script after the shebang.
trap|Shell|Run a command when the shell gets a signal or exits (cleanup!).|trap 'rm -f "$tmp"' EXIT|EXIT~run at script end;ERR~run on failure;INT~on Ctrl+C|Use trap EXIT to delete temp files even when the script crashes.
read|Shell|Read a line of input into a variable.|read -r name|-r~do not mangle backslashes;-p~show a prompt;-a~read into an array|while read -r line; do ...; done < file is the safe way to loop over lines.
printf|Shell|Formatted output, more predictable than echo.|printf '%s has %d files\\n' "$d" "$n"|%s~string;%d~integer;%5.2f~float|Prefer printf to echo -e when portability matters.
history|Shell|List previous commands. !! repeats the last, !$ is its last argument.|sudo !!||Ctrl+R searches history as you type.
jobs|Shell|List background jobs of this shell. Use bg/fg to resume, kill %1 to stop.|sleep 300 &|-l~show PIDs|Ctrl+Z pauses a foreground job, bg continues it in the background.
nohup|Shell|Keep a command running after you log out.|nohup ./long.sh &||Modern alternatives: tmux/screen, or a systemd unit.
time|Shell|Measure how long a command takes.|time tar -czf a.tgz dir||Prints real (wall clock), user and sys CPU time.
timeout|Shell|Kill a command that runs too long.|timeout 5 curl -s example.com|-k~send KILL if TERM is ignored|Exit code 124 means it timed out: check for it in scripts.
watch|Shell|Run a command every N seconds and show the output.|watch -n 2 'ss -s'|-n~seconds between runs;-d~highlight changes|Great for waiting on a deploy: watch kubectl get pods, watch df -h.
umask|Shell|Default permission mask for NEW files (subtract from 666/777).|umask 027|-S~symbolic form|umask 022 gives files 644 and dirs 755; 027 hides everything from "others".
ulimit|Shell|Per-process resource limits such as open files.|ulimit -n|-n~open files;-u~processes;-c~core size|"Too many open files" on a busy server: raise -n (and the systemd LimitNOFILE).
tee|Text|Copy stdin to a file AND to stdout. The classic way to write a file with sudo.|echo 'x' | sudo tee /etc/f|-a~append|sudo echo x > /etc/f FAILS: the redirect runs as YOU. Use tee.
xargs|Text|Turn lines of input into command arguments.|find . -name '*.tmp' | xargs rm|-n 1~one arg per run;-I{}~placeholder;-0~NUL separated;-P 4~parallel|find -print0 | xargs -0 survives file names with spaces.
awk|Text|Programmable text tool: split lines into fields and compute.|awk '{s+=$10} END{print s}' access.log|-F:~field separator;-v x=1~set a variable|$1 is field 1, NR the line number, END{} runs last. It is a tiny language: loved by sysadmins.
sed|Text|Stream editor: substitute, delete, print lines.|sed -i 's/yes/no/' file|-i~edit in place (-i.bak keeps a backup);-n~print only what p says;-E~extended regex|Always test without -i first. s/a/b/g replaces all matches per line.
cut|Text|Cut columns out of each line.|cut -d: -f1 /etc/passwd|-d~delimiter;-f~field numbers;-c~characters|For messy whitespace use awk instead: cut needs a single-character delimiter.
sort|Text|Sort lines. -n numeric, -h human sizes (2K, 3G), -u unique, -k column.|du -sh * | sort -h|-n~numeric;-h~human numbers;-r~reverse;-u~unique;-k2~by column 2;-t:~delimiter|sort | uniq -c | sort -nr is the "top N" pattern.
uniq|Text|Collapse adjacent duplicate lines (sort first!).|sort f | uniq -c|-c~count;-d~only duplicates;-u~only uniques|It only compares NEIGHBOURS, so always sort before uniq.
tr|Text|Translate or delete characters.|tr -d '\\r' < dos.txt|-d~delete;-s~squeeze repeats;-c~complement|tr a-z A-Z uppercases. tr works on stdin only.
wc|Text|Count lines, words, bytes.|wc -l file|-l~lines;-w~words;-c~bytes|grep -c pattern counts matching lines directly.
column|Text|Align text into neat columns.|mount | column -t|-t~table;-s~input separator|Pipe any messy output through column -t to read it.
paste|Text|Join files side by side or lines into one.|paste -sd, ids.txt|-d~delimiter;-s~serial (one line)|paste -sd, turns a list into a comma-separated line.
diff|Text|Compare two files line by line.|diff -u old new|-u~unified (patch style);-r~directories|diff -u output is what patches and code reviews use.
jq|Text|Query and reshape JSON on the command line.|curl -s api | jq '.items[].name'|-r~raw strings;-c~compact|Install with apt. Essential for any API or cloud CLI output.|x
id|Users|Show your UID, GID and every group.|id alice|-u~UID only;-G~all group IDs;-n~names|Group changes only apply to NEW logins: run id after re-login.
whoami|Users|Print the effective user name.|whoami||After sudo whoami you get root: great for confirming what sudo does.
who|Users|Who is logged in right now.|who -a||w also shows what each user is running.
w|Users|Who is logged in, from where, doing what, plus load average.|w||
last|Users|History of logins and reboots (from /var/log/wtmp).|last -n 10|-n~limit lines|last reboot shows when the machine restarted.
lastlog|Users|Last login time of every account.|lastlog||Accounts that "never logged in" but have a shell are worth a look.
useradd|Users|Create a user (low level: you choose every option).|useradd -m -s /bin/bash -G developers dana|-m~create home;-s~login shell;-G~extra groups;-r~system account;-u~UID;-d~home path|Without -m there is no home directory; without -s you get /bin/sh.
adduser|Users|Friendly Debian/Ubuntu wrapper around useradd (asks questions).|adduser dana||Scripts should use useradd (predictable); humans like adduser.
usermod|Users|Modify an existing user.|usermod -aG docker alice|-aG~APPEND to groups;-G~REPLACE groups;-s~shell;-L~lock;-U~unlock;-e~expiry date|usermod -G without -a silently drops every other group. Always -aG.
userdel|Users|Delete a user.|userdel -r bob|-r~also remove home and mail;-f~force|Fails if the user still has running processes.
groupadd|Users|Create a group.|groupadd developers|-g~choose GID;-r~system group|Use groups, not individual users, in permissions.
gpasswd|Users|Add or remove a user from a group.|gpasswd -a alice docker|-a~add;-d~delete|The user must log in again to pick up the change.
passwd|Users|Set a password or change its state.|passwd -S bob|-l~lock;-u~unlock;-S~status;-e~expire (force change)|Locking only blocks PASSWORD logins; SSH keys may still work.
chage|Users|Password and account ageing policy.|chage -l alice|-l~list;-M~max days;-E~account expiry date (-1 never);-d 0~force change|An expired account looks just like a wrong password: check chage -l.
chpasswd|Users|Set passwords in bulk from user:pass lines.|echo 'bob:S3cret!' | chpasswd||Reads stdin, so it fits automation.
su|Users|Switch user (su - gives a full login environment).|su - alice|-~login shell;-c~run one command|Plain su keeps your environment, which causes odd bugs.
sudo|Users|Run a command as another user (usually root), logged and audited.|sudo systemctl restart nginx|-u~run as this user;-i~root login shell;-l~what may I run?;-k~forget cached auth|sudo -l shows exactly what you are allowed to do. Edit rules with visudo.
visudo|Users|Safely edit /etc/sudoers (syntax checked).|visudo||A broken sudoers locks everyone out of sudo: never edit it with a plain editor.|x
getent|Users|Query system databases (passwd, group, hosts) the way programs do.|getent hosts example.com||getent follows nsswitch.conf, so it includes LDAP/SSSD users that grep /etc/passwd misses.
newgrp|Users|Start a shell with a different primary group.|newgrp developers||Rarely needed; re-login is cleaner.|x
chsh|Users|Change a login shell.|chsh -s /bin/zsh||
chmod|Permissions|Change permission bits. Numbers (755) or letters (u+x).|chmod 640 secrets.env|-R~recursive;u+x~add execute for owner;go-rwx~remove for group and others;2775~setgid|r=4 w=2 x=1. Directories need x to enter. chmod -R 777 is never the answer.
chown|Permissions|Change owner and group.|chown -R www-data:www-data /var/www|-R~recursive;user:group~both|Only root can give files away.
chgrp|Permissions|Change just the group.|chgrp developers /srv/project||
getfacl|Permissions|Show ACLs (per-user/group permissions beyond ugo).|getfacl /srv/reports||ls -l shows a "+" when ACLs exist.
setfacl|Permissions|Grant extra users/groups specific rights without changing ownership.|setfacl -m u:bob:rx /srv/reports|-m~modify;-x~remove;-R~recursive;-d~default for new files|Use ACLs when "one more person" needs access and groups would be overkill.
chattr|Permissions|Set low-level file flags (+i makes a file immutable even for root).|chattr +i /etc/resolv.conf|+i~immutable;+a~append only|If rm says "Operation not permitted" as root, check lsattr.|x
stat|Permissions|Full file metadata: inode, permissions, timestamps.|stat -c '%a %U %n' file|-c~custom format|%a gives the octal mode: perfect for audits.
ps|Processes|Snapshot of processes.|ps aux --sort=-%cpu | head|aux~all processes, user format;-ef~full format with PPID;-eo~choose columns;--sort~sort by column;--forest~tree|ps -eo pid,ppid,stat,cmd shows parent links and zombie states.
top|Processes|Live view of CPU, memory and tasks.|top -b -n 1|-b~batch (scriptable);-n~iterations;-o~sort field|Inside top: P sorts by CPU, M by memory, 1 shows each core, k kills.
htop|Processes|Friendlier interactive top (install with apt).|htop||F5 tree view, F6 sort, F9 kill.|x
pgrep|Processes|Find PIDs by name or pattern.|pgrep -af nginx|-a~show full command;-f~match full command line;-u~by user;-c~count|Better than ps | grep because it never matches itself.
pkill|Processes|Send a signal to processes matching a pattern.|pkill -f crunch.py|-f~match full command line;-u~by user;-9~KILL|Run pgrep with the same pattern first to see what you will hit.
kill|Processes|Send a signal to a PID (default TERM = please stop).|kill -TERM 1234|-l~list signals;-9~KILL (cannot be caught);-HUP~reload;-STOP/-CONT~pause/resume|Try TERM, wait, then KILL. KILL skips all cleanup.
killall|Processes|Kill every process with an exact name.|killall -HUP nginx||On Solaris killall means "kill everything"! On Linux it matches names.
pidof|Processes|PID of a running program by name.|pidof sshd||
nice|Processes|Start a command with lower CPU priority.|nice -n 10 ./batch.sh|-n~niceness -20..19|Higher number = nicer = less CPU.
renice|Processes|Change priority of a running process.|renice -n 19 -p 1234|-n~new niceness;-p~PID|Only root can lower the number (raise priority).
pstree|Processes|Show processes as a family tree.|pstree -p||Orphans end up under PID 1.
lsof|Processes|List open files, including network sockets.|lsof -i :80|-i :80~who uses port 80;-p~by PID;-u~by user;+L1~deleted-but-open files|Everything is a file: lsof +L1 finds the "disk is full but du says no" culprit.
fuser|Processes|Which processes use a file or port?|fuser -v 80/tcp|-k~kill them;-v~verbose|fuser -vm /mnt tells you why unmount says "busy".
strace|Processes|Trace system calls of a command: the ultimate "why does it fail?" tool.|strace -f -e trace=openat ./app|-f~follow children;-e~filter syscalls;-o~write to file;-c~summary;-p~attach to PID|Look for "= -1 ENOENT" (missing file) or EACCES (permission).
ltrace|Processes|Trace library calls.|ltrace ./app||Less common than strace.|x
uname|System|Kernel and platform information.|uname -a|-r~kernel release;-m~architecture|Kernel version matters for bugs and CVEs.
hostname|System|Show or set the machine name.|hostname -I|-I~all IP addresses;-f~FQDN|Persistent rename: hostnamectl set-hostname.
hostnamectl|System|Show OS, kernel, virtualization; set the hostname.|hostnamectl||
uptime|System|How long the system has been up and the load averages.|uptime|-p~pretty|Load averages are 1, 5, 15 minutes: compare with CPU count (nproc).
free|System|Memory and swap usage.|free -h|-h~human;-m~MiB;-s 2~repeat|Look at "available", not "free": Linux uses spare RAM for cache.
vmstat|System|CPU, memory, swap and IO in one view over time.|vmstat 1 5||si/so > 0 means swapping; wa high means IO wait.
iostat|System|Disk IO statistics (sysstat package).|iostat -x 1|-x~extended;-d~devices only|%util near 100 with high await = saturated disk.
mpstat|System|Per-CPU utilization (sysstat).|mpstat -P ALL 1||
sar|System|Historical performance data (sysstat).|sar -u 1 3||sar can show what happened at 3 AM last night.
lscpu|System|CPU model, cores, threads.|lscpu||
nproc|System|Number of CPU cores available.|nproc||
dmesg|System|Kernel ring buffer: hardware, OOM kills, disk errors.|dmesg -T | tail|-T~readable time;-l err~only errors|Needs root on modern Ubuntu. dmesg | grep -i oom reveals memory kills.
lspci|System|List PCI devices.|lspci||
lsmod|System|Loaded kernel modules.|lsmod||
modprobe|System|Load or remove a kernel module.|modprobe br_netfilter||Persist modules via /etc/modules-load.d.|x
sysctl|System|Read and set kernel parameters.|sysctl vm.swappiness|-a~all;-w~set now|Persist in /etc/sysctl.d/*.conf then sysctl --system.
timedatectl|System|Time zone and NTP status.|timedatectl||Wrong time breaks TLS, logs and cron.
date|System|Show or format the date.|date +%F|+%F~YYYY-MM-DD;+%s~epoch seconds|Use date +%F_%H%M for timestamped backups.
lsb_release|System|Distribution name and version.|lsb_release -a||cat /etc/os-release works everywhere.
dmidecode|System|Hardware info from BIOS tables (root).|dmidecode -t system||
systemctl|Services|Control systemd services.|systemctl status nginx|start/stop/restart~control now;reload~re-read config;enable --now~start at boot AND now;is-active~scripting check;list-units --failed~what is broken;daemon-reload~after editing unit files;mask~forbid starting|status shows the last log lines. Failure? journalctl -xeu <unit>.
journalctl|Services|Read the systemd journal (all service logs in one place).|journalctl -u nginx -n 50 --since "1 hour ago"|-u~one unit;-n~last N lines;-f~follow;-p err~errors only;--since~time filter;-b~this boot;-k~kernel;-x~add explanations;-e~jump to end|journalctl -p err -b is the quickest "what went wrong since boot?".
service|Services|Old SysV-style wrapper around systemctl.|service nginx restart||Still works on systemd systems; prefer systemctl.
systemd-analyze|Services|Boot time breakdown.|systemd-analyze blame||
loginctl|Services|Manage user login sessions.|loginctl list-sessions||
crontab|Services|Per-user scheduled jobs: minute hour day month weekday command.|crontab -l|-l~list;-e~edit;-r~REMOVE ALL (no confirmation!);-u~another user (root)|Cron has a tiny PATH: use absolute paths and redirect output (>> log 2>&1).
at|Services|Run a command ONCE at a given time.|echo 'backup.sh' | at 02:00||atq lists the queue.|x
logger|Services|Write a message to the system log.|logger -t deploy "release 42 done"|-t~tag|Use it in scripts so deploys appear in journalctl.
logrotate|Services|Rotate and compress logs on a schedule (runs daily via timer).|logrotate -d /etc/logrotate.conf||-d dry-run shows what it WOULD do. Configure in /etc/logrotate.d/.|x
ip|Network|Show and configure interfaces, addresses, routes (replaces ifconfig/route).|ip -br addr|addr~IP addresses;link~interfaces up/down;route~routing table;neigh~ARP table;-br~brief;route get IP~which path is used|ip route get 8.8.8.8 shows the exact route and source IP chosen.
ss|Network|Socket statistics: what listens and who is connected (replaces netstat).|sudo ss -tulpn|-t~TCP;-u~UDP;-l~listening;-p~process (root);-n~numeric;-s~summary|ss -tlnp 'sport = :443' filters one port.
netstat|Network|Legacy socket viewer (net-tools).|netstat -tulpn||Prefer ss; netstat is slower and deprecated.
ifconfig|Network|Legacy interface tool (net-tools).|ifconfig eth0||Use ip addr.
route|Network|Legacy routing table viewer.|route -n||Use ip route.
arp|Network|Show the ARP cache (IP to MAC).|arp -n||ip neigh is the modern form.
ping|Network|Check reachability and latency with ICMP.|ping -c 4 8.8.8.8|-c~count;-i~interval;-W~timeout|Ping an IP first, then a name: if only the name fails, it is DNS.
traceroute|Network|Show each router hop to a destination.|traceroute example.com||tracepath works without root; mtr combines both with live stats.
tracepath|Network|Hop-by-hop path and MTU, no root needed.|tracepath example.com||
mtr|Network|Live traceroute with packet loss per hop.|mtr -rwc 10 example.com|-r~report;-c~count|Great evidence for ISP tickets.
dig|Network|Query DNS servers directly.|dig +short example.com|+short~answer only;@8.8.8.8~ask this server;MX/TXT/NS~record type;+trace~follow delegation|dig ignores /etc/hosts: compare with getent hosts.
nslookup|Network|Older DNS query tool.|nslookup example.com||
host|Network|Simple DNS lookups.|host example.com||
curl|Network|Transfer data over HTTP(S) and more: the API debugging tool.|curl -sI https://example.com|-s~quiet;-I~headers only;-v~verbose;-o~save to file;-L~follow redirects;-w '%{http_code}'~print the status code;-X POST -d~send data;-H~header;--connect-timeout~give up fast|curl -s -o /dev/null -w '%{http_code}' URL is the standard health check.
wget|Network|Download files.|wget -q https://x/file.tgz|-O~output name;-c~resume;--spider~just check|curl or wget: both fine; wget handles recursive downloads.
nc|Network|Netcat: connect to or listen on any TCP/UDP port.|nc -zv db01 5432|-z~scan only;-v~verbose;-l~listen;-w~timeout;-u~UDP|nc -zv host port is the fastest "can I reach it?" test.
nmap|Network|Port scanner (install with apt).|nmap -p 1-1000 host|-p~ports;-sV~service versions;-Pn~skip ping|Scan only machines you are allowed to. "filtered" means a firewall dropped the probe.
tcpdump|Network|Capture and show packets (root).|tcpdump -nn -i eth0 port 53|-i~interface;-nn~no name lookups;-c~count;-w~save pcap;port/host/tcp/udp~filters|Open the pcap in Wireshark for deep dives.
iptables|Network|Kernel packet filter rules (INPUT, OUTPUT, FORWARD chains).|iptables -L -n --line-numbers|-L~list;-A~append;-I~insert at top;-D~delete;-P~default policy;-j~target ACCEPT/DROP/REJECT;--dport~destination port|First match wins. DROP = silence (timeouts); REJECT = immediate refusal. Not persistent without iptables-persistent.
nft|Network|nftables, the modern replacement for iptables.|nft list ruleset||Newer distros use nft under the hood even when you type iptables.
ufw|Network|Simple firewall front-end (Ubuntu).|ufw allow 22/tcp|allow/deny~add a rule;enable~turn on;status verbose~show;default deny incoming~policy;delete allow 80~remove|ALWAYS allow ssh before ufw enable on a remote box.
firewall-cmd|Network|firewalld front-end (RHEL/Fedora).|firewall-cmd --add-port=80/tcp --permanent||Reload with --reload.|x
ssh|Network|Secure remote shell.|ssh -L 5433:localhost:5432 user@db01|-i~key file;-p~port;-L~local port forward;-R~remote forward;-D~SOCKS proxy;-J~jump host;-N~no shell;-v~debug|ssh -v shows exactly where authentication fails.
scp|Network|Copy files over ssh.|scp file user@host:/tmp/||For big or repeated copies use rsync.
ssh-keygen|Network|Create SSH key pairs.|ssh-keygen -t ed25519 -C "me@laptop"|-t~type;-f~file;-N~passphrase;-R host~forget a host key|ed25519 keys are short and modern. Protect the private key with a passphrase.
ssh-copy-id|Network|Install your public key on a server.|ssh-copy-id user@host||After this, key login works and you can disable passwords.
ssh-agent|Network|Hold unlocked keys in memory.|eval $(ssh-agent)||ssh -A forwards the agent: use only to trusted hosts.|x
openssl|Network|TLS and crypto Swiss-army knife.|openssl s_client -connect host:443|x509 -noout -enddate -in cert.pem~certificate expiry;req -x509~self-signed cert;rand -hex 16~random secret|Expired certs cause outages: monitor x509 -enddate.
nmcli|Network|NetworkManager CLI.|nmcli device status||
resolvectl|Network|Inspect systemd-resolved DNS settings.|resolvectl status||
ethtool|Network|Link speed and driver details of a NIC.|ethtool eth0||
whois|Network|Domain registration info.|whois example.com||
telnet|Network|Old interactive TCP client (test ports).|telnet host 25||Prefer nc -zv.
iperf3|Network|Measure network throughput between two hosts.|iperf3 -c server||Run iperf3 -s on one side first.|x
tc|Network|Traffic control: add latency or packet loss for testing.|tc qdisc add dev eth0 root netem delay 100ms||Great for chaos testing.|x
df|Storage|Filesystem space usage.|df -hT|-h~human;-i~INODES;-T~fs type|"No space left" with free bytes? Check df -i (inodes).
du|Storage|Space used by directories.|du -xh /var --max-depth=1 | sort -h|-s~summary;-h~human;-x~stay on one filesystem;--max-depth~limit levels|du | sort -h | tail finds the space hog in seconds.
lsblk|Storage|Tree of disks, partitions, LVM and mount points.|lsblk -f|-f~filesystems and UUIDs|Always run lsblk before touching a disk.
mount|Storage|Attach a filesystem, or list mounts.|mount -o remount,ro /data|-a~everything in fstab;-o remount,ro~make read-only|Edit /etc/fstab so mounts survive reboot, then test with mount -a.
umount|Storage|Detach a filesystem.|umount /data||"target is busy" ? fuser -vm /data or lsof +f -- /data.
findmnt|Storage|Show the mount tree.|findmnt||
blkid|Storage|Show UUIDs and filesystem types.|blkid||Use UUIDs in fstab, not /dev/sdX names (they change).
fdisk|Storage|Partition editor (MBR/GPT).|fdisk -l||Interactive writes are destructive.
parted|Storage|GPT-capable partitioning tool.|parted /dev/sdb print||x
mkfs|Storage|Create a filesystem (DESTROYS data on the device).|mkfs.ext4 /dev/sdb1||Triple-check the device name with lsblk.
fsck|Storage|Check and repair a filesystem (unmounted!).|fsck -n /dev/sdb1||
tune2fs|Storage|Tune ext filesystem settings.|tune2fs -m 1 /dev/sdb1||Lowering reserved blocks frees space on big data disks.|x
pvs|Storage|Show LVM physical volumes.|sudo pvs||
vgs|Storage|Show LVM volume groups and free space.|sudo vgs||VFree is how much you can still give to logical volumes.
lvs|Storage|Show LVM logical volumes.|sudo lvs||
lvextend|Storage|Grow a logical volume.|lvextend -L +2G -r /dev/vg0/data|-L +2G~grow by;-l +100%FREE~use all free space;-r~also resize the filesystem|Without -r you still must run resize2fs or xfs_growfs.
resize2fs|Storage|Grow/shrink an ext2/3/4 filesystem (online growth is fine).|resize2fs /dev/vg0/data||xfs: use xfs_growfs.
mdadm|Storage|Software RAID management.|mdadm --detail /dev/md0||x
swapon|Storage|Enable or show swap.|swapon --show||
mkswap|Storage|Format a partition or file as swap.|mkswap /swapfile||
tar|Storage|Archive files (with optional gzip).|tar -czf backup.tgz dir|-c~create;-x~extract;-t~list;-z~gzip;-f~archive file;-C~change dir;--exclude~skip|tar -tzf lists contents without extracting: always check a backup.
gzip|Storage|Compress files.|gzip -k big.log|-k~keep original;-d~decompress|zcat/zless read .gz without unpacking.
rsync|Storage|Efficient file sync (only copies differences), locally or over ssh.|rsync -avz --delete src/ host:/dest/|-a~archive (keeps perms, times);-v~verbose;-z~compress;--delete~mirror deletions;-n~dry run;--exclude~skip|A trailing slash on the SOURCE means "contents of". Run with -n first!
dd|Storage|Low-level copy (images, disk tests).|dd if=/dev/zero of=test bs=1M count=100|if~input;of~output;bs~block size;count~blocks|"of=" pointing at the wrong disk is the infamous "disk destroyer". Double-check.
truncate|Storage|Set a file's size (truncate -s 0 empties a log safely).|truncate -s 0 /var/log/app.log|-s~size|Truncate instead of rm for logs a process still holds open.
fallocate|Storage|Instantly allocate a file of a given size.|fallocate -l 1G swapfile||
sync|Storage|Flush cached writes to disk.|sync||
smartctl|Storage|Disk health (SMART data).|smartctl -a /dev/sda||x
ncdu|Storage|Interactive disk usage browser.|ncdu /var||Install with apt: much faster than guessing with du.|x
apt|Packages|Debian/Ubuntu package manager.|sudo apt install -y jq|update~refresh package lists;install/remove/purge~manage;search/show~find info;list --installed~what you have|apt update first, then install. apt is for humans; apt-get for scripts.
apt-cache|Packages|Query package metadata.|apt-cache policy nginx||
dpkg|Packages|Low-level .deb tool.|dpkg -l | grep nginx|-l~list;-L~files of a package;-S~which package owns a file;-s~status|dpkg -S /usr/sbin/nginx answers "where did this file come from?".
snap|Packages|Canonical's sandboxed package format.|snap list||x
dnf|Packages|RHEL/Fedora package manager (yum successor).|dnf install nginx||Check /etc/os-release to know which family you are on.|x
rpm|Packages|Low-level RPM tool (RHEL family).|rpm -qa | grep nginx||x
docker|Containers|Run containers (processes isolated with namespaces and cgroups).|docker ps||A container is just a Linux process with limits.|x
unshare|Containers|Run a program in new namespaces (the building block of containers).|unshare --pid --fork --mount-proc bash||x
nsenter|Containers|Enter another process's namespaces.|nsenter -t 1234 -n ip a||Debug a container's network from the host.|x
chroot|Containers|Change the apparent root directory.|chroot /mnt/rescue||Used for rescue boots.|x
systemd-run|Containers|Run a command in a transient unit with resource limits.|systemd-run --scope -p MemoryMax=200M cmd||x
setcap|Security|Give a binary one specific capability instead of full root.|setcap cap_net_bind_service=+ep ./app||Lets non-root apps bind to port 80.|x
getenforce|Security|SELinux mode (Enforcing/Permissive).|getenforce||"Permission denied" even for root? Think SELinux/AppArmor. Check ausearch -m avc.|x
aa-status|Security|AppArmor profile status (Ubuntu).|aa-status||x
fail2ban-client|Security|Ban IPs with repeated failed logins.|fail2ban-client status sshd||Reads the same auth.log you can analyze with awk.|x
auditctl|Security|Linux audit rules (who touched which file).|auditctl -w /etc/passwd -p wa||x
perf|Security|CPU profiling and tracing.|perf top||x`;
const REF=REFSRC.split('\n').map(l=>{const p=l.split('|');return{n:p[0],c:p[1],d:p[2],ex:p[3],f:(p[4]||'').split(';').filter(Boolean).map(x=>x.split('~')),tip:p[5]||'',sim:p[6]!=='x'};});
const REFMAP={};REF.forEach(x=>REFMAP[x.n]=x);
const BASIC={ls:'List files (you know this one).',cd:'Change directory.',cat:'Print a file.',grep:'Search text by pattern.',find:'Search the file tree.',head:'First lines of a file.',tail:'Last lines (-f follows).',touch:'Create an empty file.',mkdir:'Make a directory.',rm:'Remove files.',cp:'Copy.',mv:'Move or rename.',echo:'Print text.',pwd:'Print working directory.',less:'Page through a file.',clear:'Clear the screen.',sleep:'Wait N seconds.',true:'Do nothing, succeed.',false:'Do nothing, fail.',test:'Evaluate a condition.',bash:'Start a shell / run a script.',sh:'Start a shell.',edit:'Pretend editor: append a line.',tick:'Garden helper: fast-forward the clock (cron runs).',outside:'Garden helper: a client outside tries to connect to a port.',teammate:'Garden helper.',help:'Garden cheat sheet.','help-me':'Troubleshooting checklist.',ln:'Create links.',file:'Identify a file type.',realpath:'Resolve a path.',basename:'Strip the directory part.',dirname:'Strip the file name.',seq:'Print a sequence of numbers.',yes:'Repeat a string forever.',mktemp:'Create a temp file safely.',expr:'Evaluate an expression.',md5sum:'Checksum a file.',sha256sum:'SHA-256 checksum.',zcat:'Read a .gz file.',gunzip:'Decompress .gz.',mail:'Read local mail (cron output lands here).',which:'Find a program in PATH.',man:'Manual pages.',stat:'File metadata.'};

const CONCEPTS=[
 {e:'📄',t:'Everything is a file',x:'Devices (/dev/sda), processes (/proc/1234), kernel settings (/proc/sys) and sockets are exposed as files, so the same tools work on all of them.',a:'One plug shape for every appliance.'},
 {e:'🔀',t:'Streams: stdin, stdout, stderr',x:'Every process has three channels: 0 input, 1 output, 2 errors. > redirects 1, 2> redirects 2, 2>&1 merges errors into output, | connects stdout to the next stdin.',a:'Three pipes on every tap: clean water, dirty water and the input hose.'},
 {e:'🔢',t:'Exit codes',x:'Every command returns a number: 0 = success, anything else = failure. $? holds it. && runs the next step only on 0, || only on non-zero.',a:'A thumbs-up (0) or thumbs-down (1-255) after every job.'},
 {e:'🧩',t:'Quoting & expansion order',x:'The shell expands braces, variables, $(commands) and globs BEFORE the program runs. Single quotes stop all of it, double quotes keep $ expansion. Quote "$var" to survive spaces.',a:'The shell opens your envelope and rewrites the letter before delivering it.'},
 {e:'🔐',t:'Permission bits (rwx)',x:'Three triplets: owner, group, others. r=4 w=2 x=1, so 640 = rw- r-- ---. On directories x means "may enter", w means "may create/delete inside". Root bypasses it all.',a:'Three locks on every door with different keys.'},
 {e:'🪪',t:'setuid, setgid, sticky',x:'setuid (4xxx) runs a program as its owner (passwd works this way). setgid (2xxx) on a directory makes new files inherit its group. Sticky (1xxx, /tmp) lets users delete only their own files.',a:'Borrowed badge, inherited team colours, and a "touch only your own stuff" sign.'},
 {e:'👥',t:'Users, groups, sudo',x:'/etc/passwd lists users, /etc/shadow holds password hashes (root only), /etc/group lists groups. Prefer group-based access and sudo over sharing root.',a:'Name tags, a locked safe and team rosters.'},
 {e:'⚙️',t:'Processes & signals',x:'Each process has a PID and a parent. Signals are messages: TERM (15) asks nicely, KILL (9) cannot be ignored, HUP often means reload, STOP/CONT pause and resume. Zombies are dead children whose parent has not collected them.',a:'Ask politely, then pull the plug, and clean up after kids.'},
 {e:'📊',t:'Load average & CPU',x:'Load = average number of tasks running or waiting (including IO wait) over 1, 5, 15 minutes. Compare to core count: load 4 on 2 cores means a queue. High load with idle CPU usually means disk IO.',a:'Checkout queue length versus number of cashiers.'},
 {e:'🧠',t:'Memory, cache & OOM',x:'Linux uses spare RAM as cache, so "free" looks low. Watch "available". When memory and swap run out the kernel OOM killer picks a victim: see dmesg.',a:'A busy desk is fine until someone needs the whole table.'},
 {e:'🔗',t:'Inodes, hard & soft links',x:'An inode stores file metadata and data location; the name lives in a directory. Hard links are extra names for the same inode, symlinks are shortcut files. You can run out of inodes with plenty of free bytes.',a:'A library card catalog: many cards, one book.'},
 {e:'💽',t:'Mounts, fstab, LVM',x:'Filesystems are attached at mount points; /etc/fstab remounts them at boot. LVM stacks physical volumes into a volume group and carves logical volumes you can grow online (then grow the filesystem too).',a:'Lego baseplates you can extend.'},
 {e:'🚦',t:'systemd units & targets',x:'Services are described by unit files (ExecStart, User, Restart, WantedBy). systemctl controls them, journalctl reads their logs, daemon-reload re-reads files, targets group boot stages.',a:'A restaurant manager with a checklist for every cook.'},
 {e:'📜',t:'Logs: journald & /var/log',x:'journald stores structured logs per unit; classic files (auth.log, nginx/access.log) live in /var/log. Logs rotate; deleted-but-open logs keep eating space until the process restarts.',a:'The ship\'s black box.'},
 {e:'⏰',t:'cron vs systemd timers',x:'cron runs "m h dom mon dow command" with a tiny environment (PATH=/usr/bin:/bin). Output is mailed. Timers add logging, dependencies and catch-up. Always use absolute paths.',a:'An alarm clock that wakes a very forgetful worker.'},
 {e:'🌐',t:'TCP/IP in 60 seconds',x:'IP address + port identify a service. Routes decide the next hop (default route = gateway). ARP maps IP to MAC on the LAN. TCP does handshakes and retries; UDP just sends.',a:'Street address, apartment number and a postal route.'},
 {e:'🔎',t:'DNS & name resolution order',x:'Programs ask the resolver: /etc/hosts first, then DNS servers from /etc/resolv.conf (per nsswitch.conf). dig talks to DNS only, so it can disagree with ping/curl.',a:'Check your own address book before calling directory enquiries.'},
 {e:'🚪',t:'Ports, sockets & listening',x:'A process LISTENs on a port; clients connect. "Connection refused" = nothing listening. "Timed out" = something drops packets (firewall) or the host is unreachable. ss -tulpn shows listeners.',a:'Doors: unlocked and answered, locked and silent, or no door at all.'},
 {e:'🧱',t:'Firewalls: iptables, nftables, ufw',x:'Rules are checked top to bottom per chain (INPUT/OUTPUT/FORWARD). First match wins; otherwise the chain policy applies. DROP is silent, REJECT answers. ufw is a friendly layer on top.',a:'A bouncer reading a guest list from the top.'},
 {e:'🔑',t:'SSH keys & tunnels',x:'Key login: private key stays with you, public key goes in ~/.ssh/authorized_keys on the server. Tunnels (-L, -R, -D) carry other TCP traffic through the encrypted connection.',a:'A unique key cut for one lock, and a secret pipe through a wall.'},
 {e:'🛡️',t:'Least privilege',x:'Give each service its own user, only the permissions it needs, and sudo for humans instead of root logins. Disable root SSH and password logins; use keys and fail2ban.',a:'Hotel key cards, not the master key.'},
 {e:'♻️',t:'Idempotency',x:'A script is idempotent if running it twice leaves the same result (mkdir -p, grep -q || echo >>). Automation must be safe to re-run.',a:'Pressing the elevator button twice does not call two elevators.'},
 {e:'📦',t:'Containers = namespaces + cgroups',x:'Namespaces give a process its own view (pids, network, mounts); cgroups limit CPU and memory. A container is an ordinary process in a fancy room, which is why ps on the host shows them.',a:'A hotel room: private view, metered resources.'},
 {e:'🧭',t:'The troubleshooting loop',x:'1) What changed? 2) Read logs (journalctl -xe, /var/log). 3) Check state (systemctl, ss, ps, df, free). 4) Form ONE hypothesis. 5) Change one thing. 6) Verify and write it down.',a:'A doctor: symptoms, tests, one treatment at a time.'},
 {e:'🗺️',t:'Filesystem Hierarchy Standard (FHS)',x:'A shared convention that says what each top-level folder is for: /etc config, /var changing data, /usr programs, /home users, /dev devices, /proc kernel info. Because every distro follows it, you can find things on any Linux server.',a:'Every city puts the post office, hospital and bank in predictable places.'},
 {e:'🧬',t:'Kernel space vs user space',x:'The kernel talks to hardware and enforces permissions; your programs run in user space and ask the kernel for services through system calls (strace shows them). A crashing program cannot normally crash the kernel.',a:'Customers (programs) talk to the clerk (kernel) at the counter; they never walk into the vault.'},
 {e:'🚀',t:'The boot process',x:'Firmware (BIOS/UEFI) starts the bootloader (GRUB, in /boot), which loads the kernel and initramfs. The kernel mounts the root filesystem and starts PID 1 (systemd), which brings up services until the default target (multi-user) is reached. Read boot logs with journalctl -b and dmesg.',a:'A relay race: firmware passes the baton to GRUB, then the kernel, then systemd.'},
 {e:'🪟',t:'Virtual filesystems: /proc /sys /dev /run',x:'These look like folders but live in memory or are generated by the kernel. /proc and /sys expose kernel and hardware state, /dev exposes devices, /run holds runtime state. They use no disk space and vanish at reboot.',a:'A live dashboard drawn as folders.'},
 {e:'🏷️',t:'Absolute vs relative paths & dotfiles',x:'/etc/hosts is absolute (starts at /). etc/hosts is relative to where you are. . is here, .. is the parent, ~ is your home. Names starting with a dot are hidden by convention and hold settings (.bashrc, .ssh).',a:'Full street address versus "the second door on the left".'},
 {e:'🐚',t:'Shell startup files',x:'Login shells read /etc/profile then ~/.profile (or ~/.bash_profile). Interactive non-login shells read /etc/bash.bashrc and ~/.bashrc. Put exports in the profile and aliases/prompt in .bashrc. Changes apply to new shells (or source the file).',a:'Different front doors, different welcome packets.'},
 {e:'👻',t:'Daemons, TTY and PTY',x:'A daemon is a background service (sshd, cron, nginx), by convention named with a trailing d. A TTY is a terminal device (/dev/tty1 at the console); SSH and terminal windows use pseudo-terminals (/dev/pts/N), visible in who and ps.',a:'Backstage crew versus the stage microphones.'},
 {e:'📦',t:'Filesystem types',x:'ext4 is the stable default, xfs is great for big files and RHEL, btrfs/zfs add snapshots, tmpfs lives in RAM, overlayfs powers containers, nfs shares over the network. Check with df -T or lsblk -f.',a:'Different warehouse designs for different cargo.'},
 {e:'📔',t:'Journaling & fsck',x:'Journaling filesystems (ext4, xfs) write intended changes to a log first, so after a crash they replay the journal in seconds instead of scanning the whole disk. fsck repairs inconsistencies and needs the filesystem unmounted. Orphans land in lost+found.',a:'A pilot\'s checklist written before takeoff.'},
 {e:'🧮',t:'Swap & virtual memory',x:'Swap is disk space the kernel uses when RAM runs low or to park idle memory. A little swap is normal; constant swapping (si/so in vmstat) makes the server crawl. vm.swappiness controls eagerness.',a:'A storage unit for things your desk has no room for.'},
 {e:'🔌',t:'Kernel modules & drivers',x:'Drivers can be loaded on demand as modules (/lib/modules). lsmod lists them, modprobe loads them, dmesg shows what they report. Persist with files in /etc/modules-load.d.',a:'Plug-in cartridges for the kernel.'},
 {e:'🛂',t:'PAM: pluggable authentication',x:'PAM (/etc/pam.d) decides HOW users authenticate for login, ssh, sudo and su: passwords, MFA, account expiry, lockouts. Misconfiguring it can lock everyone out, so keep a root session open while testing.',a:'A configurable security checkpoint.'},
 {e:'🏠',t:'System vs regular users',x:'UID 0 is root. UIDs below 1000 (Debian/Ubuntu) are system accounts for services (www-data, postgres) with no login shell (/usr/sbin/nologin). Regular users start at 1000. Running services as dedicated users limits damage.',a:'Staff badges versus visitor badges.'},
 {e:'🧊',t:'Distributions & package families',x:'Debian/Ubuntu use apt and .deb; RHEL/Rocky/Alma/Fedora use dnf and .rpm; Arch uses pacman; Alpine uses apk. Same kernel, different tooling and defaults. cat /etc/os-release tells you which you are on.',a:'Same engine, different car brands.'},
 {e:'🕰️',t:'Time, UTC and NTP',x:'Servers run in UTC. NTP (chrony or systemd-timesyncd) keeps the clock accurate; wrong time breaks TLS certificates, logs, Kerberos and cron. timedatectl shows status.',a:'Everyone synchronizes watches to one clock tower.'},
 {e:'📖',t:'Teaching yourself: --help, man, tldr',x:'cmd --help gives a quick summary, man cmd the full manual (press / to search, q to quit), apropos keyword finds commands by topic, and /usr/share/doc has package docs.',a:'The instruction leaflet, the textbook and the index.'},
 {e:'🧯',t:'SELinux & AppArmor (MAC)',x:'Mandatory Access Control adds rules beyond file permissions: even root-owned services are confined to what policy allows. RHEL uses SELinux (getenforce, ausearch), Ubuntu uses AppArmor (aa-status). "Permission denied" with correct permissions? Check the audit log.',a:'A second lock that even the owner\'s key cannot bypass.'},
 {e:'🗜️',t:'Archives & compression',x:'tar bundles many files into one archive; gzip/xz/zstd compress it (.tar.gz, .tgz). tar -czf creates, -xzf extracts, -tzf lists. Archives keep permissions and ownership: restore as root to keep owners.',a:'Packing a suitcase, then vacuum-sealing it.'},
 {e:'🔁',t:'Log rotation',x:'logrotate runs daily from a timer: it renames logs, compresses old ones and deletes the oldest. Config in /etc/logrotate.conf and /etc/logrotate.d. Without rotation, /var/log fills the disk.',a:'Replacing the full notebook with a fresh one.'},
 {e:'🌍',t:'Locale & text encoding',x:'LANG and LC_* variables control language, sorting and character encoding (UTF-8). They change how sort orders text and how tools parse it, so scripts often set LC_ALL=C for predictable results.',a:'The language settings of your terminal.'}
];

/* ---------- quest helpers ---------- */
const rd=p=>sysRead(p);
const root=(...c)=>{const u=W.user,cw=W.cwd;W.user='root';W.cwd='/root';c.forEach(x=>runSilent(x));W.user=u;W.cwd=cw;};
const asUser=(u,fn)=>{const s=W.user;W.user=u;try{return fn();}finally{W.user=s;}};
function probe(cmd){const st=W.status,nt=W.note,tr=W.trace,ex=W.exited,dp=W.depth,cl=W.curLine,hs=W.hist.length;let out='';try{out=runSilent(cmd);}catch(e){}W.status=st;W.note=nt;W.trace=tr;W.exited=ex;W.depth=dp;W.curLine=cl;return out;}
const H='/home/devops';
const passwdNames=()=>lines(rd('/etc/passwd')).map(l=>l.split(':')[0]);
const WORLDS=[
 {id:'w0',n:'Filesystem Tour',e:'🗺️',col:'#b8e986',s:'Learn what lives where in Linux: /etc, /var, /proc, /dev, /usr/local and more.'},
 {id:'w1',n:'Shell Mastery',e:'🐚',col:'#5ee6b8',s:'Streams, pipes, variables, exit codes and expansion: the grammar of everything else.'},
 {id:'w2',n:'Text Surgery',e:'✂️',col:'#ffd166',s:'Slice logs and configs with cut, sort, awk, sed and xargs.'},
 {id:'w3',n:'People & Permissions',e:'🔐',col:'#ff8fab',s:'Users, groups, sudo, chmod, setgid and ACLs.'},
 {id:'w4',n:'Processes & Resources',e:'⚙️',col:'#7cc6ff',s:'Signals, priorities, zombies, open files and system facts.'},
 {id:'w5',n:'Services & Scheduling',e:'🚦',col:'#c4a8ff',s:'systemd units, journald, cron and packages.'},
 {id:'w6',n:'Network Ninja',e:'🌐',col:'#4dd8ff',s:'Interfaces, ports, DNS, curl, firewalls, SSH keys and tunnels.'},
 {id:'w7',n:'Storage & Filesystems',e:'💽',col:'#ffa56b',s:'df, du, inodes, mounts, LVM and deleted-but-open files.'},
 {id:'w8',n:'Incident Response',e:'🚨',col:'#ff6b6b',s:'Pager goes off. Diagnose and fix realistic outages.'},
 {id:'w9',n:'Automation Pro',e:'🤖',col:'#9be564',s:'Robust scripts, strict mode and safe deploys.'}
];
const QUESTS=[
/* ===== W0 Filesystem Tour ===== */
{id:'fsetc',w:'w0',t:'Config lives in /etc',e:'⚙️',xp:25,setup:()=>{},
 story:'Where does nginx keep its main configuration file? Do not guess: search /etc for it, and save its full path into nginx_conf.txt.',
 goals:[{t:'nginx_conf.txt holds the real path',ok:()=>rd(H+'/nginx_conf.txt').trim()==='/etc/nginx/nginx.conf'},{t:'You searched under /etc',ok:h=>h.some(c=>/\/etc/.test(c)&&/\b(find|ls|grep)\b/.test(c))}],
 hints:['System configuration lives in /etc. find can search by name.','find /etc -name "nginx*"','find /etc -name nginx.conf > nginx_conf.txt'],
 learn:'/etc = Editable Text Configuration. Services keep their settings in /etc/<service>/.'},
{id:'fsproc',w:'w0',t:'/proc: the kernel\'s window',e:'🪟',xp:30,setup:()=>{},
 story:'/proc is not on disk: the kernel shows live facts as files. Count the CPU cores from /proc/cpuinfo into cores.txt and save the 1-minute load average (first field of /proc/loadavg) into load.txt.',
 goals:[{t:'cores.txt = 2',ok:()=>rd(H+'/cores.txt').trim()==='2'},{t:'load.txt has the load number',ok:()=>/^\d+\.\d+$/.test(rd(H+'/load.txt').trim())}],
 hints:['Each core is a "processor" line in /proc/cpuinfo. The load average file has space-separated fields.','grep -c ^processor /proc/cpuinfo > cores.txt','cut -d" " -f1 /proc/loadavg > load.txt'],
 learn:'/proc is virtual: ps, free, uptime and top simply read files like these.'},
{id:'fsvar',w:'w0',t:'/var/log: what happened?',e:'📜',xp:30,setup:()=>{},
 story:'/var holds data that changes while the system runs. Someone is brute-forcing SSH. Count the "Failed password" lines in /var/log/auth.log and store the number in failed.txt.',
 goals:[{t:'failed.txt has the exact count',ok:()=>rd(H+'/failed.txt').trim()===String(lines(rd('/var/log/auth.log')).filter(l=>/Failed password/.test(l)).length)}],
 hints:['grep can count matches with -c.','grep -c "Failed password" /var/log/auth.log','... > failed.txt'],
 learn:'/var/log is the first stop in any investigation: auth.log (logins), syslog, nginx/access.log.'},
{id:'fslocal',w:'w0',t:'/usr/local: install your own tool',e:'🧰',xp:40,setup:()=>{},
 story:'Hand-installed software belongs in /usr/local/bin, which is already in everyone\'s PATH. Create an executable command ops-hello that prints "hello ops" and run it by name.',
 goals:[{t:'/usr/local/bin/ops-hello is executable',ok:()=>{const n=W.fs['/usr/local/bin/ops-hello'];return !!n&&(n.m&0o111)!==0;}},{t:'Typing ops-hello prints the greeting',ok:()=>/hello ops/.test(probe('ops-hello'))}],
 hints:['Writing there needs root: use sudo tee. Then chmod +x.','printf \'#!/bin/bash\\necho hello ops\\n\' | sudo tee /usr/local/bin/ops-hello','sudo chmod +x /usr/local/bin/ops-hello; ops-hello'],
 learn:'/usr/local is for YOUR installs: the package manager never touches it, so upgrades will not overwrite your tools.'},
{id:'fsdev',w:'w0',t:'/dev: devices as files',e:'🕳️',xp:35,setup:()=>{},
 story:'/dev/null swallows anything; /dev/zero produces endless zero bytes. (1) Run `ls /nonexistent` with the error message thrown away. (2) Create a file zeros.bin of exactly 1024 zero bytes.',
 goals:[{t:'You discarded stderr into /dev/null',ok:h=>h.some(c=>/2>\s*\/dev\/null/.test(c))},{t:'zeros.bin is exactly 1024 bytes',ok:()=>!!W.fs[H+'/zeros.bin']&&sizeOf(W.fs[H+'/zeros.bin'])===1024}],
 hints:['2> redirects errors. head -c N takes N bytes.','ls /nonexistent 2>/dev/null','head -c 1024 /dev/zero > zeros.bin'],
 learn:'Everything is a file: /dev/null (black hole), /dev/zero (zeros), /dev/urandom (random). Handy for silencing output and creating test files.'},
{id:'fshome',w:'w0',t:'Hidden files in your home',e:'🙈',xp:25,setup:()=>{},
 story:'Settings live in "dotfiles" inside your home. List only the hidden entries of ~ (names starting with a dot) into dotfiles.txt.',
 goals:[{t:'dotfiles.txt lists hidden entries, nothing else',ok:()=>{const t=rd(H+'/dotfiles.txt');return /\.bashrc/.test(t)&&/\.ssh/.test(t)&&!/notes\.txt/.test(t);}}],
 hints:['ls -A shows hidden entries without . and .. . Filter names starting with a dot.','ls -A ~ | grep "^\\."','... > dotfiles.txt'],
 learn:'Dotfiles are hidden by convention: .bashrc, .profile, .ssh, .config. ~ is your home.'},
/* ===== W1 Shell Mastery ===== */
{id:'redirect',w:'w1',t:'Split the streams',e:'🔀',xp:25,setup:()=>{},
 story:'`ls /etc /nonexistent` prints good output AND an error. A cron job needs them in separate files: results in out.log, errors in err.log. Then make one combined log.',
 goals:[{t:'out.log has the listing, err.log has only the error',ok:()=>/hosts/.test(rd(H+'/out.log'))&&!/No such/.test(rd(H+'/out.log'))&&/No such file/.test(rd(H+'/err.log'))},{t:'all.log contains both together',ok:()=>/hosts/.test(rd(H+'/all.log'))&&/No such file/.test(rd(H+'/all.log'))}],
 hints:['> redirects stdout (stream 1), 2> redirects stderr (stream 2).','ls /etc /nonexistent > out.log 2> err.log','For one file: ls /etc /nonexistent > all.log 2>&1  (order matters: >file first, then 2>&1)'],
 learn:'> = stdout, 2> = stderr, 2>&1 = "send errors where output goes". Put 2>&1 AFTER the > file.'},
{id:'pipes',w:'w1',t:'Pipe and count',e:'🚰',xp:25,setup:()=>{},
 story:'Audit time: how many accounts can open an interactive bash shell? Write just the number into bash_users.txt using a pipe.',
 goals:[{t:'bash_users.txt holds the right number',ok:()=>rd(H+'/bash_users.txt').trim()===String(lines(rd('/etc/passwd')).filter(l=>/\/bin\/bash$/.test(l)).length)},{t:'You used a pipe (|)',ok:h=>h.some(c=>/\|/.test(c))}],
 hints:['Filter the lines you want, then count lines.','grep bash /etc/passwd | wc -l','Redirect the result: ... | wc -l > bash_users.txt'],
 learn:'A pipe connects one command\'s stdout to the next one\'s stdin: small tools, big results.'},
{id:'vars',w:'w1',t:'Variables & substitution',e:'💲',xp:30,setup:()=>{},
 story:'A deploy script needs APP_ENV=production visible to child programs, and RELEASE set to today\'s date (YYYY-MM-DD) captured from the date command.',
 goals:[{t:'APP_ENV is exported with value production',ok:()=>W.env.APP_ENV==='production'},{t:'RELEASE holds today\'s date',ok:()=>/^\d{4}-\d\d-\d\d$/.test(getVar('RELEASE')||'')}],
 hints:['export makes it visible to children. $(command) captures output.','export APP_ENV=production','RELEASE=$(date +%F)'],
 learn:'export shares a variable with child processes; $(cmd) substitutes a command\'s output.'},
{id:'exitcodes',w:'w1',t:'Exit codes tell the truth',e:'🚦',xp:25,setup:()=>{},
 story:'Does the user "zebra" exist? grep -q prints nothing but sets an exit code. Save that code (not the output) into code.txt.',
 goals:[{t:'code.txt contains 1',ok:()=>rd(H+'/code.txt').trim()==='1'},{t:'You used $?',ok:h=>h.some(c=>/\$\?/.test(c))}],
 hints:['grep -q is silent; the answer is in $?.','grep -q zebra /etc/passwd; echo $?','grep -q zebra /etc/passwd; echo $? > code.txt'],
 learn:'0 = success, non-zero = failure. $? holds the last exit code; && and || branch on it.'},
{id:'globbing',w:'w1',t:'Brace & glob magic',e:'✨',xp:30,setup:()=>{root('mkdir -p /home/devops/reports','touch /home/devops/reports/a.log /home/devops/reports/b.log /home/devops/reports/c.log','chown -R devops:devops /home/devops/reports');},
 story:'In ~/reports create report-1.txt … report-5.txt with ONE command, then remove every .log file in there with one more.',
 goals:[{t:'report-1.txt … report-5.txt exist',ok:()=>[1,2,3,4,5].every(i=>W.fs[H+'/reports/report-'+i+'.txt'])},{t:'No .log files remain',ok:()=>!Object.keys(W.fs).some(k=>k.startsWith(H+'/reports/')&&k.endsWith('.log'))}],
 hints:['{1..5} expands to 1 2 3 4 5 before touch runs.','touch ~/reports/report-{1..5}.txt','rm ~/reports/*.log'],
 learn:'The shell expands {braces} and *globs* before the program starts, so one line can do many things.'},
{id:'path',w:'w1',t:'Your own command in PATH',e:'🧭',xp:30,setup:()=>{},
 story:'Make a tiny command called hello that prints a greeting. Put it in ~/bin, make it executable, add ~/bin to PATH, then run it just by typing hello.',
 goals:[{t:'~/bin/hello exists and is executable',ok:()=>{const n=W.fs[H+'/bin/hello'];return !!n&&(n.m&0o100)!==0;}},{t:'~/bin is in your PATH',ok:()=>W.env.PATH.split(':').includes(H+'/bin')},{t:'You ran: hello',ok:h=>h.some(c=>c.trim()==='hello')}],
 hints:['PATH is a colon-separated list of directories searched for commands.','mkdir -p ~/bin; echo \'echo hi\' > ~/bin/hello; chmod +x ~/bin/hello','export PATH=$PATH:~/bin   then   hello'],
 learn:'Typing a name searches each PATH directory for an executable file. type hello shows what runs.'},
/* ===== W2 Text Surgery ===== */
{id:'cutsort',w:'w2',t:'Who lives here?',e:'👥',xp:25,setup:()=>{},
 story:'Extract all account names (first field of /etc/passwd) into users.txt, sorted alphabetically.',
 goals:[{t:'users.txt has the sorted names',ok:()=>{const exp=passwdNames().sort().join('\n');return rd(H+'/users.txt').trim()===exp;}}],
 hints:['Fields are separated by colons.','cut -d: -f1 /etc/passwd | sort','... | sort > users.txt'],
 learn:'cut -d: -f1 picks a column; sort orders lines. Together they replace spreadsheets for logs.'},
{id:'toptalkers',w:'w2',t:'Top talkers',e:'📈',xp:40,setup:()=>{},
 story:'Someone is hammering the web server. From /var/log/nginx/access.log list the TOP 3 client IPs with their request counts into top_ips.txt.',
 goals:[{t:'top_ips.txt has 3 lines, busiest IP first',ok:()=>{const L=lines(rd(H+'/top_ips.txt'));return L.length===3&&/203\.0\.113\.9/.test(L[0]);}}],
 hints:['Field 1 of each line is the IP. Count with sort | uniq -c, then sort numerically descending.','awk \'{print $1}\' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -3','Append > top_ips.txt'],
 learn:'sort | uniq -c | sort -nr | head is the universal "top N" pipeline.'},
{id:'sedfix',w:'w2',t:'Config surgery with sed',e:'🩺',xp:40,setup:()=>{},
 story:'Security audit: PermitRootLogin must be "no" in /etc/ssh/sshd_config. Change it in place with sed, and keep a .bak backup of the original.',
 goals:[{t:'sshd_config now says PermitRootLogin no',ok:()=>/^PermitRootLogin no/m.test(rd('/etc/ssh/sshd_config'))&&!/^PermitRootLogin yes/m.test(rd('/etc/ssh/sshd_config'))},{t:'A backup sshd_config.bak exists',ok:()=>!!W.fs['/etc/ssh/sshd_config.bak']}],
 hints:['The file belongs to root, so you need sudo. sed -i edits in place; -i.bak keeps a backup.','sudo sed -i.bak \'s/old/new/\' file','sudo sed -i.bak \'s/^PermitRootLogin yes/PermitRootLogin no/\' /etc/ssh/sshd_config'],
 learn:'sed -i.bak \'s/old/new/\' edits in place with a safety copy. Always check with grep afterwards.'},
{id:'xargsfind',w:'w2',t:'find + xargs + exec',e:'🧹',xp:45,setup:()=>{root('mkdir -p /tmp/cache','touch /tmp/cache/a.tmp /tmp/cache/b.tmp /tmp/cache/c.tmp /tmp/cache/keep.txt','mkdir -p /var/archive');['app1.log','app2.log'].forEach(n=>{const f=put('/var/archive/'+n,'old log data\n',{u:'root'});f.mt=-14*1440;});put('/var/archive/fresh.log','new\n',{u:'root'}).mt=0;},
 story:'Two chores: (1) delete every *.tmp in /tmp/cache but keep keep.txt; (2) gzip the .log files in /var/archive that are older than 7 days (leave fresh.log alone).',
 goals:[{t:'No .tmp files left, keep.txt survives',ok:()=>!Object.keys(W.fs).some(k=>k.startsWith('/tmp/cache/')&&k.endsWith('.tmp'))&&!!W.fs['/tmp/cache/keep.txt']},{t:'Old logs compressed to .gz',ok:()=>!!W.fs['/var/archive/app1.log.gz']&&!!W.fs['/var/archive/app2.log.gz']},{t:'fresh.log untouched',ok:()=>!!W.fs['/var/archive/fresh.log']&&!W.fs['/var/archive/fresh.log.gz']}],
 hints:['find can filter by name and age, then act: -delete, -exec, or pipe to xargs.','find /tmp/cache -name \'*.tmp\' -delete','sudo find /var/archive -name \'*.log\' -mtime +7 -exec gzip {} \\;'],
 learn:'find selects, then -exec / xargs / -delete acts. -mtime +7 means older than 7 days.'},
{id:'awkbytes',w:'w2',t:'Awk: add it up',e:'🧮',xp:45,setup:()=>{},
 story:'How many bytes did the client 10.0.2.2 download in total? The byte count is field 10 of the nginx log. Save only the total into total.txt.',
 goals:[{t:'total.txt has the exact byte total',ok:()=>{let s=0;lines(rd('/var/log/nginx/access.log')).forEach(l=>{const f=l.split(/\s+/);if(f[0]==='10.0.2.2')s+=+f[9]||0;});return rd(H+'/total.txt').trim()===String(s);}}],
 hints:['awk can test a field, add another, and print at the end.','awk \'$1=="10.0.2.2"{s+=$10} END{print s}\' /var/log/nginx/access.log','... > total.txt'],
 learn:'awk \'cond{action} END{print}\' filters, accumulates and reports in one go.'},
/* ===== W3 People & Permissions ===== */
{id:'onboard',w:'w3',t:'Onboard a teammate',e:'👋',xp:35,setup:()=>{},
 story:'Dana joins the team. Create user dana with a home directory, /bin/bash as shell, and membership of the developers group.',
 goals:[{t:'User dana exists with /bin/bash',ok:()=>getUsers().some(u=>u.n==='dana'&&u.shell==='/bin/bash')},{t:'Home /home/dana exists',ok:()=>isDirP('/home/dana')},{t:'dana is in developers',ok:()=>userGroups('dana').includes('developers')}],
 hints:['useradd has flags for home (-m), shell (-s) and extra groups (-G). It needs root.','sudo useradd -m -s /bin/bash -G developers dana','Verify: id dana'],
 learn:'useradd -m -s /bin/bash -G group user: remember -m (home) and -s (shell), the defaults are poor.'},
{id:'lockuser',w:'w3',t:'Lock a departing user',e:'🔒',xp:30,setup:()=>{},
 story:'Bob\'s internship ended today. Lock his account, then confirm the lock with passwd -S.',
 goals:[{t:'Bob\'s account is locked',ok:()=>{const s=getShadow().find(x=>x.n==='bob');return !!s&&s.h.startsWith('!');}},{t:'You verified with passwd -S',ok:h=>h.some(c=>/passwd -S/.test(c))}],
 hints:['Either usermod or passwd can lock.','sudo usermod -L bob   (or sudo passwd -l bob)','sudo passwd -S bob  → status L'],
 learn:'Locking puts "!" before the hash. It blocks password login; also remove SSH keys for a full lockout.'},
{id:'groups',w:'w3',t:'Add groups the right way',e:'🧑‍🤝‍🧑',xp:40,setup:()=>{},
 story:'Alice needs docker and sudo access. She is already in developers: she must KEEP that membership.',
 goals:[{t:'alice is in sudo',ok:()=>userGroups('alice').includes('sudo')},{t:'alice is in docker',ok:()=>userGroups('alice').includes('docker')},{t:'alice is still in developers',ok:()=>userGroups('alice').includes('developers')}],
 hints:['usermod has a flag that APPENDS instead of replacing.','sudo usermod -aG docker,sudo alice','If you forgot -a, restart the quest and use -aG.'],
 learn:'usermod -G replaces all supplementary groups; -aG appends. Forgetting -a is a classic outage.'},
{id:'chmod',w:'w3',t:'Permissions: numbers & letters',e:'🔢',xp:35,setup:()=>{put(H+'/secrets.txt','password=hunter2\n',{u:'devops',m:0o644});W.fs[H+'/deploy.sh'].m=0o644;},
 story:'secrets.txt is readable by everyone and deploy.sh is not executable. Fix both: secrets private to you (600), deploy.sh runnable by you. Then run ./deploy.sh.',
 goals:[{t:'secrets.txt is mode 600',ok:()=>(W.fs[H+'/secrets.txt'].m&0o777)===0o600},{t:'deploy.sh is executable by owner',ok:()=>(W.fs[H+'/deploy.sh'].m&0o100)!==0},{t:'You ran ./deploy.sh',ok:h=>h.some(c=>/\.\/deploy\.sh/.test(c))}],
 hints:['r=4 w=2 x=1; 600 = rw-------. Letters: u+x adds execute for the owner.','chmod 600 secrets.txt; chmod u+x deploy.sh','./deploy.sh'],
 learn:'Check with ls -l. Numbers set everything at once; letters tweak one bit.'},
{id:'setgid',w:'w3',t:'Shared folder (setgid)',e:'👨‍👩‍👧',xp:50,setup:()=>{root('mkdir -p /srv/project','chown root:root /srv/project','chmod 755 /srv/project');},
 story:'/srv/project must be a team workspace: group developers can read/write, nobody else gets in, and files created inside must automatically belong to developers (setgid). Prove it by creating alice.txt as alice.',
 goals:[{t:'Directory group is developers, mode 2770',ok:()=>{const n=W.fs['/srv/project'];return n.g==='developers'&&(n.m&0o7777)===0o2770;}},{t:'alice.txt exists with group developers',ok:()=>!!W.fs['/srv/project/alice.txt']&&W.fs['/srv/project/alice.txt'].g==='developers'}],
 hints:['chgrp sets the group; the leading 2 in 2770 is the setgid bit.','sudo chgrp developers /srv/project; sudo chmod 2770 /srv/project','sudo -u alice touch /srv/project/alice.txt ; ls -l /srv/project'],
 learn:'setgid on a directory (2xxx) makes new files inherit the directory\'s group: perfect for shared project folders.'},
{id:'acl',w:'w3',t:'One more reader: ACLs',e:'🎫',xp:45,setup:()=>{root('mkdir -p /srv/reports','echo q3 > /srv/reports/q3.txt','chown -R devops:devops /srv/reports','chmod -R 750 /srv/reports');},
 story:'Bob must read /srv/reports, but he is not in devops\' group and you do not want to change the mode. Grant just bob read+enter access with an ACL.',
 goals:[{t:'bob can read /srv/reports',ok:()=>asUser('bob',()=>can(W.fs['/srv/reports'],4)&&can(W.fs['/srv/reports'],1))},{t:'Mode is still 750',ok:()=>(W.fs['/srv/reports'].m&0o777)===0o750}],
 hints:['setfacl -m adds an extra ACL entry: u:USER:permissions.','setfacl -m u:bob:rx /srv/reports','Check: getfacl /srv/reports'],
 learn:'ACLs grant per-user/group access without changing ownership or the base mode. ls -l shows a "+".'},
/* ===== W4 Processes & Resources ===== */
{id:'sysinfo',w:'w4',t:'Know your machine',e:'🧾',xp:30,setup:()=>{},
 story:'A ticket asks for the kernel release, the number of CPU cores and the memory in MiB. Collect all three into sysinfo.txt using ONE redirect.',
 goals:[{t:'sysinfo.txt has the kernel, core count and memory table',ok:()=>{const t=rd(H+'/sysinfo.txt');return /6\.8\.0-45-generic/.test(t)&&/^2$/m.test(t)&&/^Mem:/m.test(t);}}],
 hints:['Group several commands so one redirect catches them all: ( cmd1; cmd2 ) > file','(uname -r; nproc; free -m) > sysinfo.txt'],
 learn:'( a; b; c ) > file groups commands in a subshell so a single redirect captures everything.'},
{id:'cpuhog',w:'w4',t:'Hunt the CPU hog',e:'🔥',xp:40,setup:()=>{addProc({user:'alice',cmd:'/usr/bin/python3 /opt/app/crunch.py',args:'/usr/bin/python3 /opt/app/crunch.py',cpu:96,st:'R',mem:2.1,rss:90000,tty:'pts/2'});},
 story:'The server feels sluggish. Find the process eating the CPU and stop it.',
 goals:[{t:'You inspected processes (ps/top)',ok:h=>h.some(c=>/\b(ps|top|htop|pgrep)\b/.test(c))},{t:'crunch.py is gone',ok:()=>!W.procs.some(p=>/crunch\.py/.test(p.args))}],
 hints:['Sort processes by CPU and look at the top.','ps aux --sort=-%cpu | head -5','The process belongs to alice, so use sudo: sudo pkill -f crunch.py'],
 learn:'ps aux --sort=-%cpu | head finds hogs; kill/pkill stops them (sudo for other users\' processes).'},
{id:'signals',w:'w4',t:'TERM first, KILL last',e:'☠️',xp:40,setup:()=>{addProc({user:'devops',cmd:'/opt/app/worker-daemon',args:'/opt/app/worker-daemon',ignoreTerm:true,rss:8000,tty:'pts/0'});},
 story:'worker-daemon must be stopped. Be polite: send the default TERM first and check whether it obeyed. Only if it refuses, use KILL (9).',
 goals:[{t:'You tried a polite TERM first',ok:h=>h.some(c=>/\b(kill|pkill|killall)\b/.test(c)&&!/-9|-KILL/.test(c))},{t:'You escalated with -9',ok:h=>h.some(c=>/(-9|-KILL)/.test(c))},{t:'worker-daemon is gone',ok:()=>!W.procs.some(p=>/worker-daemon/.test(p.cmd))}],
 hints:['pkill sends TERM by default. pgrep tells you if the process survived.','pkill worker-daemon; pgrep worker-daemon','pkill -9 worker-daemon'],
 learn:'TERM lets programs clean up; KILL cannot be ignored and skips cleanup. Escalate in that order.'},
{id:'jobs',w:'w4',t:'Job control',e:'⏯️',xp:35,setup:()=>{},
 story:'Start sleep 600 in the background, pause it, resume it, then terminate it by job number.',
 goals:[{t:'Started in the background (&)',ok:h=>h.some(c=>/sleep\s+600\s*&/.test(c))},{t:'Paused (STOP) and resumed (CONT)',ok:()=>!!W.flags.sawStop&&!!W.flags.sawCont},{t:'The job is gone',ok:()=>!W.procs.some(p=>/sleep 600/.test(p.cmd))}],
 hints:['& runs in the background; jobs lists them; %1 means job 1.','sleep 600 &   then   jobs','kill -STOP %1; kill -CONT %1; kill %1'],
 learn:'& backgrounds, jobs lists, %N names a job, STOP/CONT pause and resume, TERM ends it.'},
{id:'nice',w:'w4',t:'Be nice: renice a batch job',e:'😇',xp:35,setup:()=>{addProc({user:'devops',cmd:'/bin/bash /home/devops/backup.sh',args:'/bin/bash /home/devops/backup.sh',cpu:85,st:'R',tty:'pts/1'});},
 story:'backup.sh is hogging the CPU but must not be killed. Lower its priority to the nicest possible value (19).',
 goals:[{t:'backup.sh niceness is 19',ok:()=>{const p=W.procs.find(x=>/backup\.sh/.test(x.args));return !!p&&p.nice===19;}},{t:'It is still running',ok:()=>W.procs.some(x=>/backup\.sh/.test(x.args))}],
 hints:['pgrep -f finds the PID. renice sets the new niceness.','pgrep -f backup.sh','renice -n 19 -p <PID>'],
 learn:'nice/renice change CPU priority (-20 greedy … 19 polite). Only root can raise priority.'},
{id:'zombie',w:'w4',t:'Zombie outbreak',e:'🧟',xp:45,setup:()=>{const p=addProc({user:'devops',cmd:'/opt/app/spawner',args:'/opt/app/spawner --workers 4',tty:'pts/0',rss:6000});addProc({user:'devops',ppid:p.pid,cmd:'[worker] <defunct>',args:'[worker] <defunct>',st:'Z',rss:0,vsz:0});},
 story:'ps shows a <defunct> process. You cannot kill a zombie: it is already dead, waiting for its parent. Clear it.',
 goals:[{t:'No zombie processes remain',ok:()=>!W.procs.some(p=>p.st==='Z')}],
 hints:['Find the zombie\'s parent PID (PPID) with ps -eo pid,ppid,stat,cmd.','ps -eo pid,ppid,stat,cmd | grep Z','Stop the PARENT (spawner): pkill spawner'],
 learn:'Zombies are reaped when their parent exits or calls wait. kill the parent, not the zombie.'},
{id:'lsof',w:'w4',t:'Who has that file open?',e:'📂',xp:40,setup:()=>{root('mkdir -p /var/log/app','echo log > /var/log/app/app.log');addProc({user:'devops',cmd:'/opt/app/appd',args:'/opt/app/appd --daemon',openFiles:[{path:'/var/log/app/app.log',size:12}],rss:20000});},
 story:'Find which process holds /var/log/app/app.log open and write ONLY its PID into pid.txt.',
 goals:[{t:'pid.txt contains the PID of appd',ok:()=>{const p=W.procs.find(x=>/appd/.test(x.cmd));return !!p&&rd(H+'/pid.txt').trim()===String(p.pid);}}],
 hints:['lsof FILE lists processes using it. The PID is column 2.','sudo lsof /var/log/app/app.log','sudo lsof /var/log/app/app.log | awk \'NR>1{print $2}\' > pid.txt'],
 learn:'lsof answers "who is using this file/port?" Use it before deleting, unmounting or restarting.'},
/* ===== W5 Services & Scheduling ===== */
{id:'svcenable',w:'w5',t:'Start now AND at boot',e:'🔌',xp:30,setup:()=>{root('systemctl disable --now postgresql');},
 story:'PostgreSQL is stopped and will not return after a reboot. Fix both with one command.',
 goals:[{t:'postgresql is active',ok:()=>W.svc.postgresql.state==='active'},{t:'postgresql is enabled at boot',ok:()=>W.svc.postgresql.enabled}],
 hints:['systemctl enable only affects boot; --now also starts it.','sudo systemctl enable --now postgresql','Check: systemctl is-active postgresql; systemctl is-enabled postgresql'],
 learn:'enable = start at boot, start = start now. enable --now does both.'},
{id:'unitfile',w:'w5',t:'Write your own service',e:'📝',xp:60,setup:()=>{put('/opt/app/app.sh','#!/bin/bash\nwhile true; do sleep 5; done\n',{u:'devops',m:0o644});},
 story:'/opt/app/app.sh should run as a service called myapp, restart on failure, and start at boot. (Hint: something about that script will bite you.)',
 goals:[{t:'/etc/systemd/system/myapp.service runs /opt/app/app.sh',ok:()=>/ExecStart=\/opt\/app\/app\.sh/.test(rd('/etc/systemd/system/myapp.service'))},{t:'myapp is active',ok:()=>!!W.svc.myapp&&W.svc.myapp.state==='active'},{t:'myapp is enabled',ok:()=>!!W.svc.myapp&&W.svc.myapp.enabled}],
 hints:['Unit files need [Unit], [Service] (ExecStart, Restart) and [Install] (WantedBy=multi-user.target). After creating one: daemon-reload.','printf \'[Unit]\\nDescription=My App\\n[Service]\\nExecStart=/opt/app/app.sh\\nRestart=on-failure\\n[Install]\\nWantedBy=multi-user.target\\n\' | sudo tee /etc/systemd/system/myapp.service','sudo chmod +x /opt/app/app.sh; sudo systemctl daemon-reload; sudo systemctl enable --now myapp'],
 learn:'A unit file + daemon-reload + enable --now. ExecStart must be executable (status 203/EXEC otherwise).'},
{id:'selfheal',w:'w5',t:'Self-healing services',e:'🩹',xp:45,setup:()=>{put('/opt/app/app.sh','#!/bin/bash\nwhile true; do sleep 5; done\n',{u:'devops',m:0o755});put('/etc/systemd/system/myapp.service','[Unit]\nDescription=My App\n[Service]\nExecStart=/opt/app/app.sh\nRestart=always\n[Install]\nWantedBy=multi-user.target\n',{});root('systemctl daemon-reload','systemctl enable --now myapp');},
 story:'myapp has Restart=always. Prove it: kill its main process with SIGKILL and watch systemd bring it back.',
 goals:[{t:'You sent kill -9',ok:h=>h.some(c=>/(-9|-KILL)/.test(c))},{t:'systemd restarted it (restart counter ≥ 1)',ok:()=>W.svc.myapp.nrestart>=1&&W.svc.myapp.state==='active'}],
 hints:['Find the PID, then kill -9 it (as root).','sudo pkill -9 -f app.sh','systemctl status myapp: note the new PID'],
 learn:'Restart=always/on-failure makes systemd respawn crashed services. Check restarts with systemctl show -p NRestarts.'},
{id:'journalq',w:'w5',t:'journalctl detective',e:'🔍',xp:40,setup:()=>{jr('nginx','err','connect() failed (111: Connection refused) while connecting to upstream');jr('nginx','warning','upstream timed out (110: Connection timed out)');W.journal[W.journal.length-2].t=-30;W.journal[W.journal.length-1].t=-20;jr('nginx','info','worker process started');W.journal[W.journal.length-1].t=-10;},
 story:'Management wants only the ERRORS from nginx during the last hour in nginx_errors.txt.',
 goals:[{t:'nginx_errors.txt contains the error entry (and not info noise)',ok:()=>/Connection refused/.test(rd(H+'/nginx_errors.txt'))&&!/worker process started/.test(rd(H+'/nginx_errors.txt'))}],
 hints:['journalctl can filter by unit, priority and time.','journalctl -u nginx -p err --since "1 hour ago"','... > nginx_errors.txt'],
 learn:'journalctl -u UNIT -p err --since "1 hour ago" is the fastest way to see what a service complained about.'},
{id:'cronbasic',w:'w5',t:'Schedule a backup',e:'⏰',xp:45,setup:()=>{put(H+'/backup.sh','#!/bin/bash\necho "backup $(date +%T)" >> /home/devops/backup.log\n',{u:'devops',m:0o755});},
 story:'Run ~/backup.sh every 5 minutes with cron. Then fast-forward the clock with tick 10m and check that backup.log grew.',
 goals:[{t:'crontab runs backup.sh every 5 minutes',ok:()=>/\*\/5 \* \* \* \* .*backup\.sh/.test(W.cron.devops||'')},{t:'backup.log has at least 2 entries',ok:()=>lines(rd(H+'/backup.log')).length>=2}],
 hints:['Fields: minute hour day month weekday command. */5 = every 5.','echo "*/5 * * * * /home/devops/backup.sh" | crontab -','tick 10m  then  cat backup.log'],
 learn:'crontab - installs from stdin and validates it. Use absolute paths.'},
{id:'cronenv',w:'w5',t:'Cron\'s tiny environment',e:'🕳️',xp:50,setup:()=>{put('/usr/local/bin/mytool','#!/bin/bash\necho tool-ran\n',{m:0o755});W.cron.devops='* * * * * mytool >> /home/devops/tool.log 2>&1\n';},
 story:'The job "works in my terminal" but tool.log only fills with errors. Cron runs with PATH=/usr/bin:/bin. Fix the crontab so tool.log gets "tool-ran" (use tick 2m to test).',
 goals:[{t:'tool.log contains tool-ran',ok:()=>/tool-ran/.test(rd(H+'/tool.log'))}],
 hints:['tick 2m then cat tool.log shows what cron saw.','Use the absolute path /usr/local/bin/mytool in the crontab.','echo "* * * * * /usr/local/bin/mytool >> /home/devops/tool.log 2>&1" | crontab -   then tick 2m'],
 learn:'Cron\'s PATH is minimal. Absolute paths (or a PATH= line in the crontab) fix "command not found".'},
/* ===== W6 Network ===== */
{id:'ipinfo',w:'w6',t:'Know your network',e:'📡',xp:30,setup:()=>{},
 story:'Collect eth0\'s IP and the default gateway into netinfo.txt (one redirect).',
 goals:[{t:'netinfo.txt has 10.0.2.15 and the gateway 10.0.2.2',ok:()=>/10\.0\.2\.15/.test(rd(H+'/netinfo.txt'))&&/10\.0\.2\.2/.test(rd(H+'/netinfo.txt'))}],
 hints:['ip -br addr is the brief address view; ip route shows the gateway.','(ip -4 -br a show eth0; ip route) > netinfo.txt'],
 learn:'ip addr (who am I), ip route (where do packets go), ip neigh (who is next to me).'},
{id:'ports',w:'w6',t:'Who is listening?',e:'👂',xp:35,setup:()=>{},
 story:'Which process owns port 5432? Save the matching ss line into port5432.txt.',
 goals:[{t:'port5432.txt names postgres',ok:()=>/postgres/.test(rd(H+'/port5432.txt'))}],
 hints:['ss -tlnp lists listening TCP sockets with processes. Seeing other users\' processes needs root.','sudo ss -tlnp | grep :5432','... > port5432.txt'],
 learn:'ss -tulpn (with sudo) is the one-liner to map ports to processes.'},
{id:'dnshosts',w:'w6',t:'DNS vs /etc/hosts',e:'📇',xp:50,setup:()=>{root('apt install -y dnsutils');root("sed -i 's/^10.0.2.50 api.internal/10.0.2.99 api.internal/' /etc/hosts");},
 story:'curl http://api.internal:8080/health hangs, yet dig api.internal says 10.0.2.50. Someone left a stale override. Find it and fix it, then confirm the health check answers.',
 goals:[{t:'api.internal resolves to 10.0.2.50 again',ok:()=>resolveName('api.internal')==='10.0.2.50'},{t:'You got the health check answer with curl',ok:h=>h.some(c=>/curl.*api\.internal/.test(c))&&resolveName('api.internal')==='10.0.2.50'}],
 hints:['Compare getent hosts api.internal (system view) with dig +short api.internal (DNS only).','grep api /etc/hosts','sudo sed -i \'/api.internal/d\' /etc/hosts; curl -s api.internal:8080/health'],
 learn:'/etc/hosts beats DNS for most programs; dig only asks DNS. getent hosts shows what programs see.'},
{id:'curlcodes',w:'w6',t:'HTTP status checks',e:'🩻',xp:40,setup:()=>{},
 story:'Health-check the local web server: save the HTTP status of / into code.txt and the status of /missing into code404.txt, printing ONLY the numbers.',
 goals:[{t:'code.txt = 200',ok:()=>/^200/.test(rd(H+'/code.txt').trim())},{t:'code404.txt = 404',ok:()=>/^404/.test(rd(H+'/code404.txt').trim())}],
 hints:['curl -s silences progress, -o /dev/null drops the body, -w prints a field.','curl -s -o /dev/null -w \'%{http_code}\' localhost','... > code.txt   and the same with localhost/missing > code404.txt'],
 learn:'curl -s -o /dev/null -w \'%{http_code}\' URL is the standard scriptable health check.'},
{id:'firewall',w:'w6',t:'Open a blocked port',e:'🧱',xp:50,setup:()=>{addProc({user:'devops',cmd:'python3 -m http.server 8080',args:'python3 -m http.server 8080',listen:[{port:8080,proto:'tcp',addr:'0.0.0.0'}],resp:{code:200,body:'hello from 8080\n',srv:'SimpleHTTP/0.6'}});root('iptables -A INPUT -p tcp --dport 8080 -j DROP');},
 story:'The dev server on port 8080 works locally but times out for clients. Test with outside 8080, find the cause, and let traffic through.',
 goals:[{t:'Clients can reach port 8080',ok:()=>fwEval(8080,'10.0.2.99')==='ACCEPT'&&!!portHolder(8080)}],
 hints:['A hang (timeout) rather than "refused" means a DROP rule. List rules with line numbers.','sudo iptables -L -n --line-numbers','sudo iptables -D INPUT -p tcp --dport 8080 -j DROP   (then: outside 8080)'],
 learn:'Timeout = DROP, refused = nothing listening (or REJECT). Rules are evaluated top to bottom.'},
{id:'sshkeys',w:'w6',t:'SSH keys & copy-id',e:'🗝️',xp:50,setup:()=>{},
 story:'Set up passwordless SSH to web02: create an ed25519 key (no passphrase), install it on web02, and run `hostname` there over ssh.',
 goals:[{t:'You have an ed25519 key pair',ok:()=>!!W.fs[H+'/.ssh/id_ed25519']&&!!W.fs[H+'/.ssh/id_ed25519.pub']},{t:'Key installed on web02',ok:()=>!!(W.sshAuth&&W.sshAuth['devops@web02'])},{t:'You ran a remote command',ok:h=>h.some(c=>/ssh\s+\S*web02\s+\w+/.test(c))}],
 hints:['ssh-keygen creates the pair; ssh-copy-id uploads the public key; ssh host command runs remotely.','ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519','ssh-copy-id devops@web02   then   ssh devops@web02 hostname'],
 learn:'Keys beat passwords: private key stays with you, public key goes to ~/.ssh/authorized_keys on the server.'},
{id:'tunnel',w:'w6',t:'SSH tunnel to the database',e:'🚇',xp:55,setup:()=>{runSilent('ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519');runSilent('ssh-copy-id devops@db01');},
 story:'db01 only allows connections from itself. Create an SSH tunnel so that localhost:5433 on this machine reaches PostgreSQL (port 5432) on db01. Verify with ss.',
 goals:[{t:'Port 5433 is listening locally via ssh',ok:()=>{const p=portHolder(5433);return !!p&&/ssh/.test(p.cmd);}},{t:'You verified with ss or nc',ok:h=>h.some(c=>/\b(ss|nc|lsof|netstat)\b/.test(c)&&/5433/.test(c))}],
 hints:['-L localport:remotehost:remoteport forwards; -f backgrounds; -N means no remote command.','ssh -fN -L 5433:localhost:5432 devops@db01','ss -tlnp | grep 5433'],
 learn:'ssh -L carries a local port through an encrypted tunnel to a service only the remote host can reach.'},
{id:'capture',w:'w6',t:'Catch DNS packets',e:'🕸️',xp:45,setup:()=>{root('apt install -y tcpdump');},
 story:'Capture 5 DNS packets (port 53) on eth0, without name lookups, and save them to dns.pcap for the network team.',
 goals:[{t:'dns.pcap exists',ok:()=>!!W.fs[H+'/dns.pcap']},{t:'You filtered on port 53',ok:h=>h.some(c=>/tcpdump.*port 53/.test(c))}],
 hints:['tcpdump needs root. -c limits packets, -w writes a file, -nn skips DNS lookups.','sudo tcpdump -i eth0 -nn -c 5 port 53','... -w dns.pcap'],
 learn:'tcpdump -nn -i IFACE "filter" -w file records packets for Wireshark. Always limit with -c or a filter.'},
/* ===== W7 Storage ===== */
{id:'dudu',w:'w7',t:'Where did the space go?',e:'🕵️',xp:40,setup:()=>{const mk=(p,s)=>{put(p,'x',{u:'devops',s});};mk('/data/old-backups/db.dump',3*G1);mk('/data/logs/app.log',1.2*G1);mk('/data/media/img.bin',0.5*G1);W.fs['/data/old-backups']=Object.assign(W.fs['/data/old-backups'],{u:'devops'});},
 story:'/data is filling up. Find the biggest directory directly under /data and write its name into biggest.txt.',
 goals:[{t:'biggest.txt names old-backups',ok:()=>/old-backups/.test(rd(H+'/biggest.txt'))}],
 hints:['du summarizes sizes; sort -h understands 3.0G.','du -sh /data/* | sort -h','du -sh /data/* | sort -h | tail -1 > biggest.txt'],
 learn:'du -sh dir/* | sort -h | tail finds the hog in seconds. Add -x to stay on one filesystem.'},
{id:'inodes',w:'w7',t:'Out of inodes',e:'🗃️',xp:50,setup:()=>{mkdirp('/data/spool',{u:'devops'});for(let i=0;i<10;i++){mkdirp('/data/spool/q'+i,{u:'devops'});W.fs['/data/spool/q'+i].ino=32500;}},
 story:'Apps on /data report "No space left on device" yet df -h shows free space. Diagnose with df -i and free the inodes by clearing the spool.',
 goals:[{t:'You checked inodes (df -i)',ok:h=>h.some(c=>/df.*-\w*i/.test(c))},{t:'Inode usage is below 50%',ok:()=>usedInodes('/data')/W.mounts['/data'].inodes<0.5}],
 hints:['"No space" with free bytes usually means no free inodes: df -i.','df -i /data','rm -rf /data/spool/*'],
 learn:'Millions of tiny files exhaust inodes before bytes. df -i shows it; clean the offending directory.'},
{id:'mounta',w:'w7',t:'The data disk vanished',e:'🔌',xp:40,setup:()=>{root('umount /data');},
 story:'After a maintenance reboot /data looks empty: the volume was not mounted. Check, then mount everything listed in /etc/fstab.',
 goals:[{t:'/data is mounted again',ok:()=>!!W.mounts['/data']},{t:'You inspected mounts (findmnt/lsblk/mount/df)',ok:h=>h.some(c=>/\b(findmnt|lsblk|mount|df)\b/.test(c))}],
 hints:['lsblk and findmnt show what is mounted where. /etc/fstab is the boot-time list.','findmnt','sudo mount -a'],
 learn:'mount -a mounts everything in /etc/fstab: also the way to TEST your fstab edits before rebooting.'},
{id:'lvm',w:'w7',t:'Grow a volume (LVM)',e:'📈',xp:60,setup:()=>{put('/data/big/file.bin','x',{u:'devops',s:3.4*G1});},
 story:'/data (an LVM volume) is 92% full. The volume group has 5 GB free. Grow /data to 8 GB, filesystem included.',
 goals:[{t:'Logical volume is 8G',ok:()=>W.lvm.lv.data.size>=8*G1-4*M1},{t:'The filesystem really grew too',ok:()=>W.mounts['/data'].size>=8*G1-4*M1}],
 hints:['sudo vgs shows free space. lvextend grows the LV; a flag also resizes the filesystem.','sudo lvextend -L +3G -r /dev/vg0/data','Without -r run: sudo resize2fs /dev/vg0/data'],
 learn:'Grow online: lvextend -r (or lvextend then resize2fs / xfs_growfs). Check with df -h.'},
{id:'deletedopen',w:'w7',t:'Deleted but still using space',e:'👻',xp:60,setup:()=>{put('/opt/app/appd','#!/bin/bash\nwhile true; do sleep 5; done\n',{u:'root',m:0o755});defSvc('appd',{desc:'App daemon',exec:'/opt/app/appd',custom:true,loaded:true,state:'active',enabled:true,type:'simple'});const p=addProc({user:'root',cmd:'/opt/app/appd',args:'/opt/app/appd',unit:'appd',rss:20000});W.svc.appd.pid=p.pid;p.deleted=[{path:'/var/log/app.log.old',size:12*G1}];},
 story:'/ is 92% full, but du cannot find the files: someone deleted a huge log while the app still had it open. Find the culprit and release the space (without rebooting).',
 goals:[{t:'You listed deleted-open files (lsof +L1)',ok:h=>h.some(c=>/lsof.*\+L1/.test(c))},{t:'Root filesystem is below 80%',ok:()=>usedBytes('/')/W.mounts['/'].size<0.8}],
 hints:['lsof +L1 lists files that were unlinked but are still open.','sudo lsof +L1','Restart the holder: sudo systemctl restart appd'],
 learn:'Space is freed only when the last open handle closes. Restart the process, or truncate instead of rm next time.'},
/* ===== W8 Incidents ===== */
{id:'incport',w:'w8',t:'🚨 nginx won\'t start',e:'🧯',xp:70,setup:()=>{root('systemctl stop nginx');installPkg('apache2');W.svc.apache2.enabled=true;svcStart('apache2');const ap=procBy(W.svc.apache2.pid);ap.resp={code:200,body:'<html>Apache2 Default Page: It works!</html>\n',srv:'Apache/2.4.58 (Ubuntu)'};root('systemctl start nginx');},
 story:'PAGER: "Website down!" nginx fails to start after a package install. Find out WHY, fix it for good (it must survive a reboot), and get nginx serving again.',
 goals:[{t:'nginx is active and owns port 80',ok:()=>W.svc.nginx.state==='active'&&!!portHolder(80)&&portHolder(80).unit==='nginx'},{t:'apache2 is stopped AND disabled',ok:()=>W.svc.apache2.state!=='active'&&!W.svc.apache2.enabled}],
 hints:['Read the failure: systemctl status nginx and journalctl -xeu nginx. Who holds port 80?','sudo ss -tlnp | grep :80','sudo systemctl disable --now apache2; sudo systemctl restart nginx'],
 learn:'"Address already in use" → find the holder with ss/lsof, stop AND disable the intruder, then restart.'},
{id:'incdisk',w:'w8',t:'🚨 Disk 89% and climbing',e:'💥',xp:70,setup:()=>{put('/var/log/app/debug.log','x',{u:'root',g:'adm',m:0o640,s:11.5*G1});addProc({user:'devops',cmd:'/opt/app/appd',args:'/opt/app/appd',openFiles:[{path:'/var/log/app/debug.log',size:11.5*G1}],rss:20000});},
 story:'PAGER: "/ at 89%". A debug log is gigantic and appd is still writing to it. Free the space WITHOUT restarting appd.',
 goals:[{t:'Root filesystem is below 70%',ok:()=>usedBytes('/')/W.mounts['/'].size<0.7},{t:'appd is still running',ok:()=>W.procs.some(p=>/appd/.test(p.cmd))}],
 hints:['Find the big file with du. If you rm a file that is open, space is NOT freed (see lsof +L1).','sudo du -xh /var --max-depth=2 | sort -h | tail -3','sudo truncate -s 0 /var/log/app/debug.log'],
 learn:'truncate -s 0 empties a log in place, so the writer keeps working and the space is freed immediately.'},
{id:'inccert',w:'w8',t:'🚨 nginx down after cert rotation',e:'📜',xp:70,setup:()=>{root('mkdir -p /etc/ssl/app');W.fs['/etc/nginx/nginx.conf'].c='user www-data;\nworker_processes auto;\nevents {\n    worker_connections 768;\n}\nhttp {\n    server {\n        listen 80;\n        root /var/www/html;\n    }\n    server {\n        listen 443 ssl;\n        ssl_certificate /etc/ssl/app/cert.pem;\n        ssl_certificate_key /etc/ssl/app/key.pem;\n        root /var/www/html;\n    }\n}\n';root('systemctl restart nginx');},
 story:'PAGER: nginx died after a cert rotation script cleaned /etc/ssl/app. Test the config, read the error, generate a replacement self-signed certificate and bring nginx back.',
 goals:[{t:'Certificate files exist again',ok:()=>!!W.fs['/etc/ssl/app/cert.pem']&&!!W.fs['/etc/ssl/app/key.pem']},{t:'nginx is active',ok:()=>W.svc.nginx.state==='active'},{t:'You validated with nginx -t',ok:h=>h.some(c=>/nginx -t/.test(c))}],
 hints:['sudo nginx -t reads the config and names the missing file.','sudo openssl req -x509 -newkey rsa:2048 -nodes -keyout /etc/ssl/app/key.pem -out /etc/ssl/app/cert.pem -days 365 -subj /CN=web01','sudo nginx -t; sudo systemctl restart nginx'],
 learn:'nginx -t before every reload. Monitor certificate expiry (openssl x509 -enddate) so rotation never surprises you.'},
{id:'incdns',w:'w8',t:'🚨 Nothing resolves',e:'🧭',xp:70,setup:()=>{root('apt install -y dnsutils');W.fs['/etc/resolv.conf'].c='# Generated by systemd-resolved\nnameserver 10.0.2.99\nsearch localdomain\n';},
 story:'PAGER: every deploy fails with "Temporary failure in name resolution". ping 8.8.8.8 works. Prove it is DNS, find the broken resolver and fix it (the good one is 10.0.2.3).',
 goals:[{t:'DNS resolution works again',ok:()=>dnsWorks()&&resolveName('example.com')!==null},{t:'You compared IP ping vs name lookups',ok:h=>h.some(c=>/ping.*8\.8\.8\.8/.test(c))&&h.some(c=>/\b(dig|nslookup|host|getent|curl|ping)\b.*[a-z]+\.[a-z]+/.test(c))}],
 hints:['Ping an IP, then a name. If only names fail it is DNS. See /etc/resolv.conf.','cat /etc/resolv.conf; dig example.com','sudo sed -i \'s/10.0.2.99/10.0.2.3/\' /etc/resolv.conf'],
 learn:'IP works + names fail = DNS. dig @8.8.8.8 name proves the network is fine; fix the nameserver in /etc/resolv.conf.'},
{id:'incufw',w:'w8',t:'🚨 Customers time out on the API',e:'⏳',xp:70,setup:()=>{addProc({user:'devops',cmd:'/opt/app/api --port 8080',args:'/opt/app/api --port 8080',listen:[{port:8080,proto:'tcp',addr:'0.0.0.0'}],rss:30000});root('ufw default deny incoming','ufw allow 22/tcp','ufw allow 80/tcp','ufw enable');},
 story:'PAGER: the API on 8080 is up (ss shows it) but customers get timeouts. The firewall (ufw) must stay ON. Reproduce with outside 8080, then open only what is needed.',
 goals:[{t:'ufw is still enabled',ok:()=>W.fw.ufw.on},{t:'Port 8080 is reachable from outside',ok:()=>fwEval(8080,'10.0.2.99')==='ACCEPT'}],
 hints:['ss -tlnp proves the app listens; outside 8080 proves the firewall drops. ufw status shows rules.','sudo ufw status numbered','sudo ufw allow 8080/tcp'],
 learn:'Listening + timeout = firewall. Open the specific port; never "ufw disable" in production.'},
{id:'incsshd',w:'w8',t:'🚨 Harden sshd without locking yourself out',e:'🛡️',xp:80,setup:()=>{root("sed -i 's/^PasswordAuthentication yes/PasswordAuthenticaton no/' /etc/ssh/sshd_config");},
 story:'Security wants PasswordAuthentication no. A colleague already edited /etc/ssh/sshd_config but made a typo. NEVER restart sshd blindly: test the config first, fix it, then reload.',
 goals:[{t:'You ran sshd -t',ok:h=>h.some(c=>/sshd -t/.test(c))},{t:'Config is valid and PasswordAuthentication is no',ok:()=>sshdTest()===null&&sshdOpt('PasswordAuthentication','yes')==='no'},{t:'sshd is still active',ok:()=>W.svc.sshd.state==='active'}],
 hints:['sudo sshd -t validates the file and names the bad line.','sudo sed -i \'s/PasswordAuthenticaton/PasswordAuthentication/\' /etc/ssh/sshd_config','sudo sshd -t && sudo systemctl reload sshd'],
 learn:'sshd -t before reload. reload keeps existing sessions alive; a bad restart can lock you out.'},
{id:'inclocked',w:'w8',t:'🚨 Alice can\'t log in',e:'🔓',xp:70,setup:()=>{root('usermod -L alice','chage -E 2026-01-01 alice');},
 story:'PAGER: Alice says "Authentication failure" even with the right password. Check her account status and aging, then repair it.',
 goals:[{t:'You inspected (passwd -S / chage -l)',ok:h=>h.some(c=>/(passwd -S|chage -l)/.test(c))},{t:'Account is unlocked',ok:()=>{const s=getShadow().find(x=>x.n==='alice');return !!s&&!s.h.startsWith('!');}},{t:'Account no longer expired',ok:()=>{const s=getShadow().find(x=>x.n==='alice');return !!s&&(!s.exp||+s.exp>dayNow());}}],
 hints:['sudo passwd -S alice shows L (locked). sudo chage -l alice shows the account expiry date.','sudo usermod -U alice','sudo chage -E -1 alice   (never expire)'],
 learn:'Two separate switches: the password lock (!) and the account expiry date. Check both: passwd -S and chage -l.'},
{id:'boss',w:'w8',t:'👑 Boss: Black Friday outage',e:'👑',xp:120,setup:()=>{root('systemctl stop nginx');installPkg('apache2');W.svc.apache2.enabled=true;svcStart('apache2');procBy(W.svc.apache2.pid).resp={code:200,body:'<html>Apache2 Default Page</html>\n',srv:'Apache/2.4.58 (Ubuntu)'};root('systemctl start nginx');put('/var/log/big.log','x',{u:'root',s:12*G1});root('systemctl stop postgresql');},
 story:'PAGER (3 alerts at once): the shop is down. (1) nginx is not serving, (2) / is almost full, (3) the database is stopped. Fix all three, in the order you judge best.',
 goals:[{t:'nginx owns port 80 and answers',ok:()=>W.svc.nginx.state==='active'&&!!portHolder(80)&&portHolder(80).unit==='nginx'},{t:'Disk is below 80%',ok:()=>usedBytes('/')/W.mounts['/'].size<0.8},{t:'postgresql is running',ok:()=>W.svc.postgresql.state==='active'},{t:'No failed units',ok:()=>Object.values(W.svc).every(s=>s.state!=='failed')}],
 hints:['Start with systemctl --failed and df -h. One problem at a time.','sudo systemctl disable --now apache2; sudo systemctl restart nginx; sudo truncate -s 0 /var/log/big.log','sudo systemctl start postgresql; then curl -sI localhost'],
 learn:'Triage: restore service first, then free resources, then verify end-to-end (curl) and write the post-mortem.'},
/* ===== W9 Automation ===== */
{id:'script1',w:'w9',t:'Your first real script',e:'📃',xp:40,setup:()=>{},
 story:'Write ~/health.sh: shebang line, then print the hostname, uptime and root disk usage. Make it executable and run it.',
 goals:[{t:'health.sh has a shebang and calls df',ok:()=>/^#!\/bin\/bash/.test(rd(H+'/health.sh'))&&/\bdf\b/.test(rd(H+'/health.sh'))},{t:'It is executable',ok:()=>!!W.fs[H+'/health.sh']&&(W.fs[H+'/health.sh'].m&0o100)!==0},{t:'You ran ./health.sh',ok:h=>h.some(c=>/\.\/health\.sh/.test(c))}],
 hints:['printf with \\n builds a file in one line; or use a heredoc (cat > file <<\'EOF\').','printf \'#!/bin/bash\\nhostname\\nuptime\\ndf -h /\\n\' > health.sh','chmod +x health.sh; ./health.sh'],
 learn:'#!/bin/bash on line 1, chmod +x, then ./script. Without a shebang the kernel does not know the interpreter.'},
{id:'strict',w:'w9',t:'Strict mode saves backups',e:'🪖',xp:55,setup:()=>{put(H+'/backup2.sh','#!/bin/bash\ncp /nonexistent /tmp/x\necho backup complete\n',{u:'devops',m:0o755});},
 story:'backup2.sh prints "backup complete" even though the copy failed! Make it stop at the first error (strict mode) so it never lies, then run it.',
 goals:[{t:'The script enables strict mode (set -e …)',ok:()=>/set\s+-[a-z]*e/.test(rd(H+'/backup2.sh'))},{t:'It no longer says "complete" after a failure',ok:()=>!/complete/.test(probe('bash /home/devops/backup2.sh'))}],
 hints:['set -euo pipefail right after the shebang.','sed -i \'2i set -euo pipefail\' backup2.sh','./backup2.sh; echo $?'],
 learn:'set -euo pipefail: exit on error, on unset variables, and on failures inside pipes. Scripts should fail loudly.'},
{id:'loopscript',w:'w9',t:'Loops and functions',e:'🔁',xp:60,setup:()=>{},
 story:'Write ~/checkports.sh that loops over ports 22 80 3306 and prints "port N: open" or "port N: closed" using nc -z localhost. Make it executable.',
 goals:[{t:'Script exists and is executable',ok:()=>!!W.fs[H+'/checkports.sh']&&(W.fs[H+'/checkports.sh'].m&0o100)!==0},{t:'Running it reports 22 and 80 open, 3306 closed',ok:()=>{const o=probe('bash /home/devops/checkports.sh');return /port 22: open/.test(o)&&/port 80: open/.test(o)&&/port 3306: closed/.test(o);}}],
 hints:['for p in 22 80 3306; do ... done with if nc -z localhost $p; then ...; fi','cat > checkports.sh <<\'EOF\'  (type the lines, finish with EOF)','#!/bin/bash\\nfor p in 22 80 3306; do\\n if nc -z localhost $p; then echo "port $p: open"; else echo "port $p: closed"; fi\\ndone'],
 learn:'if command; then … fi uses the exit code. for/while loops plus nc -z give instant port checks.'},
{id:'rsyncdeploy',w:'w9',t:'Deploy with rsync',e:'🚚',xp:55,setup:()=>{put(H+'/site/index.html','v2 site\n',{u:'devops'});put('/var/www/html/old.html','stale\n',{u:'www-data'});put('/var/www/html/index.html','v1 site\n',{u:'www-data'});},
 story:'Publish ~/site to the web root /var/www/html so the server matches exactly: new index.html in, stale old.html out. Preview with a dry run first.',
 goals:[{t:'index.html is the new version',ok:()=>/v2 site/.test(rd('/var/www/html/index.html'))},{t:'old.html was removed',ok:()=>!W.fs['/var/www/html/old.html']},{t:'You did a dry run (-n)',ok:h=>h.some(c=>/rsync.*(-\w*n|--dry-run)/.test(c))}],
 hints:['rsync -a keeps metadata; --delete mirrors deletions; -n shows what WOULD happen. Trailing slash on the source!','sudo rsync -avn --delete ~/site/ /var/www/html/','sudo rsync -av --delete ~/site/ /var/www/html/'],
 learn:'rsync -avn first (dry run), then without -n. src/ (slash) copies the CONTENTS.'}
];
const QUIZ={
 w0:[{q:'Where do you look first for a service\'s log files?',o:['/etc','/var/log','/proc','/boot'],a:1,x:'/var holds variable data like logs; /etc holds configuration.'},{q:'Why is /proc special?',o:['It stores backups','It is a virtual filesystem: kernel info shown as files, no disk space','It holds user documents','It is only for root'],a:1,x:'ps, free and uptime just read files in /proc.'},{q:'You compile a tool by hand. Where should it be installed?',o:['/usr/bin','/bin','/usr/local/bin','/etc'],a:2,x:'/usr/local is reserved for software not managed by the package manager.'},{q:'What does /dev/null do?',o:['Stores logs','Discards everything written to it','Holds null users','Lists disks'],a:1,x:'cmd 2>/dev/null throws away error messages.'},{q:'Why is root\'s home /root and not /home/root?',o:['Tradition only','So root can log in even if /home cannot be mounted','Security through obscurity','It is shorter'],a:1,x:'/home may be on another disk that fails to mount.'}],
 w1:[{q:'Which command saves only error messages to errors.log?',o:['cmd > errors.log','cmd 2> errors.log','cmd | errors.log','cmd &> /dev/null'],a:1,x:'Stream 2 is stderr, so 2> redirects only errors.'},{q:'What does `cmd1 && cmd2` do?',o:['Runs both at once','Runs cmd2 only if cmd1 succeeded','Runs cmd2 only if cmd1 failed','Pipes cmd1 into cmd2'],a:1,x:'&& chains on exit code 0 (success); || runs on failure.'},{q:'What happens to $HOME in \'$HOME\' (single quotes)?',o:['It expands','It stays literal','It errors','It becomes empty'],a:1,x:'Single quotes block all expansion; double quotes still expand $.'}],
 w2:[{q:'Why must you `sort` before `uniq -c`?',o:['uniq is slow on unsorted data','uniq only collapses ADJACENT duplicates','sort removes blank lines','uniq needs a file, not a pipe'],a:1,x:'uniq compares neighbouring lines only.'},{q:'What does `sed -i.bak \'s/a/b/\' f` do?',o:['Prints the change only','Edits f in place and keeps f.bak','Copies f to f.bak and ignores a/b','Needs root'],a:1,x:'-i edits in place; the suffix after -i names the backup.'},{q:'Which finds files older than 7 days?',o:['find . -mtime +7','find . -mtime -7','find . -atime 7','find . -size +7'],a:0,x:'+7 means more than 7 days ago; -7 means less than 7.'}],
 w3:[{q:'What does `usermod -G sudo alice` (without -a) do?',o:['Adds alice to sudo','Replaces ALL her supplementary groups with sudo','Locks alice','Nothing'],a:1,x:'Without -a, -G replaces the list: always use -aG.'},{q:'What does the setgid bit (2770) on a directory do?',o:['Runs files as root','New files inherit the directory\'s group','Prevents deletion by others','Hides the directory'],a:1,x:'Perfect for shared team folders.'},{q:'The sticky bit on /tmp (1777) means…',o:['Files cannot be read','Only a file\'s owner (or root) can delete it','Files are encrypted','Everyone is root'],a:1,x:'Users can create files but not delete each other\'s.'}],
 w4:[{q:'A zombie process cannot be killed because…',o:['It ignores SIGKILL on purpose','It is already dead; its parent has not reaped it','It runs as root','It is in swap'],a:1,x:'Stop or fix the parent so it calls wait().'},{q:'Which signal can a process NOT catch or ignore?',o:['SIGTERM (15)','SIGHUP (1)','SIGKILL (9)','SIGINT (2)'],a:2,x:'KILL (and STOP) are enforced by the kernel.'},{q:'Load average 4.0 on a 2-core machine suggests…',o:['Idle system','Tasks are queuing for CPU or IO','A network fault','Low memory only'],a:1,x:'Compare load with core count; high load with idle CPU often means IO wait.'}],
 w5:[{q:'You edited a unit file. What must you run?',o:['systemctl reload-all','systemctl daemon-reload','systemctl enable --now','service restart'],a:1,x:'daemon-reload re-reads unit files from disk.'},{q:'Why do cron jobs often fail with "command not found"?',o:['Cron is case sensitive','Cron has a minimal PATH','Cron needs root','Jobs must end with ;'],a:1,x:'PATH is typically /usr/bin:/bin. Use absolute paths.'},{q:'Which shows a unit\'s recent errors?',o:['journalctl -u nginx -p err','cat /etc/nginx','ps nginx','systemctl list-units'],a:0,x:'journalctl filters by unit and priority.'}],
 w6:[{q:'curl says "Connection refused". Most likely…',o:['A firewall DROP rule','Nothing is listening on that port','DNS failed','The certificate expired'],a:1,x:'Refused is an immediate answer; DROP produces timeouts.'},{q:'dig shows a different IP than ping. Why?',o:['dig reads /etc/hosts first','ping may use /etc/hosts; dig asks DNS only','They use different ports','ping is cached'],a:1,x:'getent hosts shows what normal programs resolve.'},{q:'What does `ssh -L 5433:localhost:5432 user@db` do?',o:['Opens port 5433 on db','Forwards local port 5433 to port 5432 on db through ssh','Copies a file','Logs in as root'],a:1,x:'-L local forward: localport:remotehost:remoteport.'}],
 w7:[{q:'df -h shows free space but writes fail with "No space left". Check…',o:['du -sh','df -i (inodes)','free -m','ping'],a:1,x:'Inode exhaustion looks exactly like a full disk.'},{q:'You rm a huge log but df is unchanged. Why?',o:['A process still holds it open','rm is delayed','df caches for an hour','Journald restored it'],a:0,x:'Space is freed when the last handle closes: lsof +L1.'},{q:'After lvextend, df still shows the old size. You need…',o:['reboot','resize2fs (or xfs_growfs)','pvcreate','fsck'],a:1,x:'Grow the filesystem too, or use lvextend -r.'}],
 w8:[{q:'Service fails with "Address already in use". First step?',o:['Reboot','Find the holder: ss -tlnp | grep :PORT','Reinstall','Change the firewall'],a:1,x:'Identify the process holding the port.'},{q:'Safest way to apply a new sshd_config?',o:['systemctl restart sshd immediately','sshd -t, then systemctl reload sshd','Reboot','Delete the file'],a:1,x:'Validate first; reload keeps current sessions.'},{q:'Best order in a multi-alert outage?',o:['Whatever is first on the list','Restore service, free resources, verify, then document','Document first','Reinstall everything'],a:1,x:'Triage and verify end-to-end.'}],
 w9:[{q:'What does `set -euo pipefail` do?',o:['Makes a script faster','Stops on errors, unset vars and failed pipe stages','Enables colors','Runs the script twice'],a:1,x:'Fail loudly instead of continuing in a broken state.'},{q:'What makes a script idempotent?',o:['It runs very fast','Running it twice leaves the same result','It uses sudo','It prints nothing'],a:1,x:'Use mkdir -p, grep -q || append, rsync.'},{q:'rsync src/ dest/ vs rsync src dest/ ?',o:['Same','src/ copies the contents; src copies the directory itself','src/ is recursive only','Only src needs sudo'],a:1,x:'The trailing slash changes what lands in dest.'}]
};

/* ================= FILESYSTEM TOUR CONTENT ================= */
const FSTREE=`/                      the root: everything hangs below this one tree
├── bin -> usr/bin        essential commands (symlink on modern systems)
├── sbin -> usr/sbin      admin commands (symlink)
├── lib -> usr/lib        shared libraries (symlink)
├── usr/                  installed programs & read-only data
│   ├── bin, sbin, lib
│   ├── share/            docs, man pages, icons
│   └── local/            software YOU install by hand
├── etc/                  system configuration (plain text)
├── var/                  data that changes: logs, databases, caches, queues
│   ├── log/  lib/  cache/  spool/  tmp/  www/
├── home/                 regular users' files   (/home/alice)
├── root/                 the root user's home
├── tmp/                  scratch space (cleared often)
├── boot/                 kernel + bootloader
├── dev/                  devices as files        (/dev/sda, /dev/null)
├── proc/                 kernel & process info    (virtual)
├── sys/                  devices & drivers view   (virtual)
├── run/                  runtime state since boot (PID files, sockets)
├── opt/                  optional third-party apps
├── srv/                  data served by this machine
├── mnt/  media/          mount points (manual / removable)
└── lost+found/           fsck's rescue bin`;
const FSDIRS=[
 {p:'/',g:'Top',nm:'root',means:'The "root" of the tree (not the root user!).',why:'Linux has ONE directory tree. There are no drive letters like C: or D:. Other disks and partitions are attached ("mounted") onto folders inside this tree, for example /data or /boot.',rule:'Everything is a path starting from /. Absolute paths begin with /, relative paths do not.',items:[['/boot','Kernel and bootloader files (usually its own small partition).','ls -l /boot'],['/home','Personal folders for regular users.','ls /home'],['/data','Not standard: an extra disk mounted by this server.','df -h /data']],try:['ls -l /','lsblk','findmnt']},
 {p:'/bin',g:'Programs',nm:'binaries',means:'Short for "binaries": executable programs.',why:'Holds the essential commands every user needs, even in recovery mode: ls, cp, cat, bash. On modern distros /bin is only a SYMLINK to /usr/bin ("usr merge"), so there is one place for programs.',rule:'You rarely put anything here yourself. Your own tools go in /usr/local/bin or ~/bin.',items:[['/bin/bash','The Bash shell itself.','ls -l /bin/bash'],['/bin/ls','A command you use daily.','type ls']],try:['ls -ld /bin','type -a ls','echo $PATH']},
 {p:'/sbin',g:'Programs',nm:'system binaries',means:'"System binaries".',why:'Administration commands normally run by root: fsck, ip, iptables, useradd, reboot. Also a symlink to /usr/sbin nowadays. Regular users often do not have it in PATH.',rule:'If a command is for managing the machine (not for everyday work), it is probably an sbin program.',items:[['/usr/sbin/useradd','Create users.','ls -l /usr/sbin/useradd'],['/usr/sbin/iptables','Firewall control.','ls -l /usr/sbin/iptables']],try:['ls /usr/sbin','echo $PATH']},
 {p:'/lib',g:'Programs',nm:'libraries',means:'Shared "libraries".',why:'Shared code that programs load at runtime (.so files, like Windows DLLs) and kernel modules in /lib/modules. Symlink to /usr/lib. /lib64 holds the 64-bit loader.',rule:'ldd /usr/bin/ls shows which libraries a program needs. Missing library errors point here.',items:[['/lib/modules','Kernel drivers (modules) for the installed kernel.','ls /lib/modules'],['/lib/systemd/system','Unit files shipped by packages (yours go in /etc/systemd/system).','ls /lib/systemd/system']],try:['ldd /usr/bin/ls','ls -ld /lib']},
 {p:'/usr',g:'Programs',nm:'Unix System Resources',means:'Historically "user"; now "Unix System Resources".',why:'The big one: most installed software and read-only shared data lives here. It can be shared or mounted read-only because it does not change during normal operation.',rule:'Package manager owns /usr. Hand-installed software belongs in /usr/local, never mixed into /usr/bin.',items:[['/usr/bin','Almost all user commands.','ls /usr/bin | head'],['/usr/sbin','Admin commands.','ls /usr/sbin'],['/usr/lib','Libraries for those programs.','ls /usr/lib'],['/usr/share','Architecture-independent data: man pages, docs, icons, timezone data.','ls /usr/share'],['/usr/include','C header files for compiling.','ls /usr/include'],['/usr/local','Your own installs (has its own bin, lib, etc).','ls -R /usr/local']],try:['ls /usr','ls /usr/local','which ls']},
 {p:'/etc',g:'Configuration',nm:'Editable Text Configuration',means:'Originally "et cetera"; today read it as "Editable Text Configuration".',why:'System-wide configuration as plain text files. To change how the system or a service behaves you edit files here, then reload the service. No registry, no binary blobs: easy to back up, diff and put in git.',rule:'Config for a service lives in /etc/<service>/. After editing: validate (nginx -t, sshd -t) then reload.',items:[['/etc/passwd','User accounts (not passwords!).','cat /etc/passwd'],['/etc/shadow','Password hashes (root-only).','sudo head -3 /etc/shadow'],['/etc/group','Groups and members.','cat /etc/group'],['/etc/sudoers','Who may use sudo.','sudo cat /etc/sudoers'],['/etc/fstab','Filesystems to mount at boot.','cat /etc/fstab'],['/etc/hosts','Static name to IP mappings (beats DNS).','cat /etc/hosts'],['/etc/resolv.conf','Which DNS servers to ask.','cat /etc/resolv.conf'],['/etc/ssh/sshd_config','SSH server settings.','grep -v "^#" /etc/ssh/sshd_config'],['/etc/systemd/system','Your systemd unit files and overrides.','ls /etc/systemd/system'],['/etc/cron.d, /etc/crontab','System-wide scheduled jobs.','cat /etc/crontab'],['/etc/nginx','Web server config.','ls /etc/nginx'],['/etc/os-release','Which distribution and version this is.','cat /etc/os-release'],['/etc/hostname','The machine name.','cat /etc/hostname']],try:['ls /etc','cat /etc/os-release','grep -c . /etc/passwd']},
 {p:'/var',g:'Changing data',nm:'variable',means:'"Variable" data.',why:'Everything that grows or changes while the system runs: logs, databases, mail, queued jobs, package caches. Because it can fill up, admins often give /var (or /var/log) its own partition so a runaway log cannot kill the root filesystem.',rule:'"Disk full?" Start with du -xh /var --max-depth=2 | sort -h | tail.',items:[['/var/log','Log files: syslog, auth.log, nginx/access.log.','ls /var/log'],['/var/lib','State of programs: databases, package database (dpkg), docker images.','ls /var/lib'],['/var/cache','Re-creatable cached data (apt packages).','ls /var/cache'],['/var/spool','Queues waiting to be processed: cron jobs, mail, print.','ls /var/spool'],['/var/tmp','Temporary files that must survive a reboot.','ls -ld /var/tmp'],['/var/www','Web site files (common default for web servers).','ls /var/www/html'],['/var/mail','Local mail, including cron job output.','ls /var/mail']],try:['ls /var','sudo du -xh /var --max-depth=1 | sort -h','ls -l /var/log']},
 {p:'/home',g:'People',nm:'home',means:'Home directories.',why:'Each regular user gets /home/<name> for documents and personal settings. Settings are hidden "dotfiles" (.bashrc, .ssh, .config). Only the user (and root) should normally read it. Often on its own partition so reinstalls keep user data.',rule:'~ is a shortcut for your own home. ~alice means Alice\'s home.',items:[['~/.bashrc','Shell settings for interactive shells.','cat ~/.bashrc'],['~/.profile','Settings for login shells.','cat ~/.profile'],['~/.ssh','SSH keys and known hosts (mode 700!).','ls -la ~/.ssh'],['~/.config','Per-user application settings (XDG).','echo ~/.config']],try:['ls /home','ls -A ~','echo ~']},
 {p:'/root',g:'People',nm:'root\'s home',means:'The home directory of the root (superuser) account.',why:'It is NOT inside /home on purpose: if /home lives on a separate disk that fails to mount, root can still log in and repair things.',rule:'Mode 700: only root can look inside.',items:[['/root/.bashrc','root\'s shell config.','sudo cat /root/.bashrc']],try:['ls -ld /root','sudo ls -la /root']},
 {p:'/tmp',g:'Changing data',nm:'temporary',means:'Temporary files.',why:'Scratch space for programs and users. World-writable with the sticky bit (mode 1777) so everyone can create files but only delete their own. Often cleaned at boot and sometimes a RAM-backed tmpfs.',rule:'Never keep anything important here. Do not assume files survive a reboot (use /var/tmp for that).',items:[['mktemp','Creates a unique safe temp file.','mktemp']],try:['ls -ld /tmp','mktemp','df -h /tmp']},
 {p:'/boot',g:'Boot & mounts',nm:'boot',means:'Boot files.',why:'The kernel (vmlinuz-*), the initial RAM disk (initrd.img-*) and the GRUB bootloader. Usually a small separate partition. Old kernels pile up here; if /boot fills up, kernel upgrades fail.',rule:'Do not delete kernels by hand: use apt autoremove.',items:[['/boot/vmlinuz-*','The Linux kernel image.','ls -lh /boot'],['/boot/initrd.img-*','Mini filesystem used early in boot to load drivers.','ls -lh /boot'],['/boot/grub/grub.cfg','Generated bootloader menu: never edit by hand.','cat /boot/grub/grub.cfg']],try:['ls -lh /boot','df -h /boot','uname -r']},
 {p:'/dev',g:'Hardware & kernel',nm:'devices',means:'Device files.',why:'Hardware and kernel interfaces shown as files, because on Linux "everything is a file". Disks are /dev/sda; special files include /dev/null (a black hole), /dev/zero (endless zeros), /dev/urandom (random bytes) and terminals (/dev/tty, /dev/pts/*). udev creates them automatically.',rule:'Never write to a raw disk device by accident: dd of=/dev/sda destroys data.',items:[['/dev/sda, /dev/sda1','First disk and its first partition.','ls -l /dev/sda*'],['/dev/null','Discards anything written to it: cmd 2>/dev/null.','echo hi > /dev/null; echo $?'],['/dev/zero','Produces endless zero bytes.','head -c 16 /dev/zero | wc -c'],['/dev/urandom','Random bytes.','head -c 8 /dev/urandom | wc -c'],['/dev/mapper','LVM and encrypted volumes.','ls /dev/mapper']],try:['ls /dev','lsblk','ls -l /dev/null']},
 {p:'/proc',g:'Hardware & kernel',nm:'process information',means:'Process and kernel information.',why:'A VIRTUAL filesystem: no disk space used. The kernel exposes live data as files: /proc/cpuinfo, /proc/meminfo, /proc/loadavg, /proc/uptime and a folder per process (/proc/1234/ with cmdline, status, open files). Tools like ps, free and top just read these files.',rule:'Read-only mostly; /proc/sys holds tunable kernel parameters (see sysctl).',items:[['/proc/cpuinfo','CPU model and core count.','grep -c ^processor /proc/cpuinfo'],['/proc/meminfo','Memory counters (source of free).','head -5 /proc/meminfo'],['/proc/loadavg','1/5/15 minute load averages.','cat /proc/loadavg'],['/proc/uptime','Seconds since boot.','cat /proc/uptime'],['/proc/<pid>/','Everything about one process.','ls /proc | head']],try:['cat /proc/loadavg','cat /proc/meminfo | head -3','cat /proc/version']},
 {p:'/sys',g:'Hardware & kernel',nm:'system',means:'sysfs: the kernel\'s device model.',why:'Another virtual filesystem. It organises devices, drivers and kernel settings in a neat tree: network cards in /sys/class/net, disks in /sys/block, cgroups in /sys/fs/cgroup. You can read (and sometimes write) it to tune hardware.',rule:'/proc is "processes + legacy stuff", /sys is the clean device tree.',items:[['/sys/class/net/eth0/operstate','Is the link up?','cat /sys/class/net/eth0/operstate'],['/sys/block/sda/size','Disk size in 512-byte sectors.','cat /sys/block/sda/size']],try:['ls /sys','cat /sys/class/net/eth0/address']},
 {p:'/run',g:'Hardware & kernel',nm:'runtime',means:'Runtime state.',why:'A RAM-backed tmpfs holding information about the system since it booted: PID files (/run/sshd.pid), sockets, lock files. Wiped at every boot. /var/run is a symlink to /run.',rule:'If a daemon complains about a stale PID file, look here.',items:[['/run/sshd.pid','PID of the SSH daemon.','cat /run/sshd.pid'],['/run/nginx.pid','PID of nginx master.','cat /run/nginx.pid']],try:['ls /run','df -h /run']},
 {p:'/opt',g:'Programs',nm:'optional',means:'Optional add-on software.',why:'Self-contained third-party applications each in their own folder (/opt/vendor/app) with their own bin and lib. Good for vendor installers and in-house apps that do not follow the usual layout.',rule:'/opt = one folder per app. /usr/local = files merged into bin/lib/share.',items:[['/opt/app','This server\'s in-house app.','ls /opt/app']],try:['ls /opt','ls /opt/app']},
 {p:'/srv',g:'Changing data',nm:'service data',means:'Data for services this machine provides.',why:'A convention for content you serve: /srv/www, /srv/git, /srv/ftp, team shares. Many admins use it for shared project folders.',rule:'Policy folder, not enforced: check what your team uses (web content is often /var/www).',items:[['/srv/www','Example site root.','ls /srv']],try:['ls /srv']},
 {p:'/mnt',g:'Boot & mounts',nm:'mount',means:'Temporary mount point.',why:'An empty folder where an admin manually mounts a filesystem for a while: mount /dev/sdb1 /mnt, copy files, umount.',rule:'Permanent mounts get their own folders and an /etc/fstab line.',items:[],try:['ls /mnt','findmnt']},
 {p:'/media',g:'Boot & mounts',nm:'media',means:'Removable media.',why:'Desktop systems auto-mount USB sticks and DVDs here (/media/<user>/<label>). Servers rarely use it.',rule:'Think "plug in a USB stick".',items:[],try:['ls /media']},
 {p:'/lost+found',g:'Boot & mounts',nm:'lost and found',means:'Recovered file fragments.',why:'Exists at the top of every ext4 filesystem. After a crash, fsck puts orphaned pieces of files here. Normally empty, mode 700.',rule:'If it has files after a crash, look for lost data in it.',items:[],try:['sudo ls -la /lost+found']},
 {p:'/data',g:'Changing data',nm:'data (custom)',means:'Not part of the standard.',why:'A common name for an extra data disk. On this server /data is a separate LVM volume (vg0/data) mounted from /etc/fstab, which is why it has its own size and inode counts.',rule:'Mount points live in the tree but belong to a DIFFERENT filesystem: check with df /data.',items:[['/data/backups','Backup target.','ls -la /data/backups']],try:['df -h /data','lsblk','findmnt /data']}
];
const WHERE=[['Logs of a service','/var/log and journalctl -u <unit>','ls /var/log'],['System-wide configuration','/etc','ls /etc'],['My SSH keys and known hosts','~/.ssh','ls -la ~/.ssh'],['Scripts/programs I installed by hand','/usr/local/bin','ls /usr/local/bin'],['CPU, memory, load information','/proc','cat /proc/loadavg'],['A running process\'s details','/proc/<pid>/','ls /proc | head'],['Temporary scratch files','/tmp','ls -ld /tmp'],['Web site files','/var/www or /srv/www','ls /var/www/html'],['Database files','/var/lib/<db> (e.g. /var/lib/postgresql)','ls /var/lib'],['Which disks exist','/dev and lsblk','lsblk'],['My own systemd service files','/etc/systemd/system','ls /etc/systemd/system'],['Service files shipped by packages','/lib/systemd/system','ls /lib/systemd/system'],['Scheduled jobs','crontab -l, /etc/cron.d, /etc/crontab','cat /etc/crontab'],['The installed kernel','/boot','ls -lh /boot'],['PID file of a daemon','/run/<name>.pid','ls /run'],['Who may sudo','/etc/sudoers (edit with visudo)','sudo cat /etc/sudoers'],['Documentation of a package','/usr/share/doc/<package>','ls /usr/share/doc'],['Package manager repositories','/etc/apt/sources.list','cat /etc/apt/sources.list'],['Failed SSH logins','/var/log/auth.log','sudo grep -c "Failed password" /var/log/auth.log']];
const CONFUSE=[['/bin vs /usr/bin?','Historically /bin held tools needed to boot and /usr (maybe another disk) held the rest. Modern distros merged them: /bin is a symlink to /usr/bin. Check with ls -ld /bin.'],['/tmp vs /var/tmp?','/tmp is cleared often (even every reboot, maybe RAM-backed). /var/tmp is for temporary files that should survive a reboot.'],['/usr/local vs /opt?','/usr/local mirrors the normal layout (bin, lib, share) for things you install by hand. /opt keeps each application self-contained in one folder.'],['/etc vs /usr/local/etc?','/etc is system configuration. /usr/local/etc is for config of software you installed under /usr/local.'],['/home vs /root?','/home holds regular users. root\'s home is separate so root can log in even when /home cannot be mounted.'],['/proc vs /sys?','Both virtual (no disk). /proc = processes and kernel info (older, messier). /sys = tidy tree of devices and drivers.'],['/run vs /var/run?','/var/run is a symlink to /run: same RAM-backed runtime state.'],['Absolute vs relative path?','/etc/hosts starts at the root and works anywhere. etc/hosts depends on your current directory. . is here, .. is the parent, ~ is your home.']];
