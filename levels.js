// ═══════════════════════════════════════════════════════════════
//  LEVELS  —  5 tracks, 26 levels
//
//  Extra per-level properties consumed by commands:
//    permissions   { filename: "rwx string" }         ls -l
//    env_vars      { VAR: "value" }                   env
//    net           { host: [ portObj ] }              nmap / nmap -sV
//    netstatData   [ connObj ]                        netstat
//    whoisData     { domain: [ lines ] }              whois
//    dnsData       { domain: { A,MX,TXT,… } }        dig
//    web           { url: "body" }                    curl
//    webHeaders    { url: { header: val } }           curl -I
//    gobusterRes   { url: [ lines ] }                 gobuster
//    cookieData    { url: { name: val } }             cookies
//    filetypes     { filename: "type string" }        file
//    stringsOut    { filename: [ lines ] }            strings
//    exifData      { filename: [ lines ] }            exif
//    johnCrack     { hashfile: { type, plain } }      john
// ═══════════════════════════════════════════════════════════════

const LEVELS = {

  // ── LOBBY ────────────────────────────────────────────────────
  "guest@shellscape": {
    password: null, track: null, objective: null,
    files: {}, isLobby: true
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  LINUX TRACK  (8 levels)                                 ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@linux": {
    password: null,
    track: "linux",
    objective: "Find credentials left behind on this server.",
    lesson: "Developers often forget credentials in config files during deployment. Use 'ls' to list files, 'cat <file>' to read them.",
    files: {
      "readme.txt":      "Welcome to the Linux track!\nSomeone deployed this server in a rush...",
      "deploy_notes.txt":"TODO: clean up before prod!\n- remove test accounts\n- !! delete credentials.txt !!",
      "credentials.txt": "Deployment credentials:\nuser: admin\npass: greenlight"
    }
  },

  "level1@linux": {
    password: "greenlight",
    track: "linux",
    objective: "Use 'ls -a' to reveal hidden files. Dotfiles contain secrets.",
    lesson: "Files starting with '.' are hidden from plain 'ls'. Attackers ALWAYS run 'ls -a' — they find .env files, .bash_history, .ssh keys, and config files left by careless admins.",
    files: {
      "readme.txt":    "Nothing to see here... or is there?",
      "todo.txt":      "1. Change server password\n2. Delete the .bash_history file!\n3. Rotate API keys",
      ".bash_history": "ssh root@192.168.1.50\ncat /etc/shadow\necho ghostwire | sudo -S systemctl restart nginx\nsudo rm -rf /tmp/*",
      ".env":          "# App configuration\nDATABASE_URL=postgres://localhost:5432/app\nAPP_ENV=production\nSECRET_KEY=not_this_one_keep_looking"
    }
  },

  "level2@linux": {
    password: "ghostwire",
    track: "linux",
    objective: "Config files hide in subdirectories. Use 'cat <dir/file>' to navigate.",
    lesson: "Sensitive files live deep in directory trees — /etc/, /var/, /opt/. Recognising common config formats (INI, YAML, .env) and traversing directories manually is essential reconnaissance.",
    files: {
      "readme.txt":        "The password is in a config backup. Explore the directories.",
      "logs/":             null,
      "logs/access.log":   "10.0.0.1 - GET /index.html 200\n10.0.0.2 - GET /admin 403\n10.0.0.5 - GET /backup.zip 200",
      "logs/error.log":    "ERROR: failed login from 10.0.0.99 (5 attempts)\nERROR: disk at 94% capacity",
      "backup/":           null,
      "backup/config.bak": "[database]\nhost     = localhost\nport     = 5432\npassword = deeproot\nssl      = true"
    }
  },

  "level3@linux": {
    password: "deeproot",
    track: "linux",
    objective: "Use 'grep <keyword> *' to search all files at once for the flag.",
    lesson: "grep is the pentester's best friend. During post-exploitation, attackers grep filesystems for 'password', 'secret', 'api_key', 'token' across thousands of files in seconds. Master grep and you find credentials faster than any GUI tool.",
    files: {
      "access.log": "10.0.0.1 GET /home 200\n10.0.0.2 GET /login 200\n10.0.0.3 POST /login 401\n10.0.0.4 GET /admin 403",
      "config.txt": "debug=false\nmax_retries=3\nallow_root=false\ntimeout=30",
      "dump.sql":   "INSERT INTO users VALUES ('admin', 'hashed_pw');\nINSERT INTO config VALUES ('flag', 'ironclad');\nINSERT INTO logs VALUES ('2024-01-01', 'login', 'success');",
      "readme.txt": "These files came from a compromised web server.\nSearch them for sensitive values."
    }
  },

  "level4@linux": {
    password: "ironclad",
    track: "linux",
    objective: "Use 'ls -l' to view permissions. Find the SUID binary (has 's' in owner execute slot). Its filename is the password.",
    lesson: "SUID (Set User ID) lets a program run with its owner's privileges. A SUID root binary = instant privilege escalation vector. Real pentesters run: find / -perm -4000 -user root 2>/dev/null — hunting for exactly this. SUID shows as 's' in: -rws------",
    files: {
      "readme.txt": "One of these files has dangerous permissions.\nUse 'ls -l' — the SUID file (has 's' in rwxrwxrwx) name IS the password.",
      "script.sh":  "#!/bin/bash\ntar czf /backup/$(date +%F).tar.gz /var/www/",
      "monitor.py": "import psutil\nfor p in psutil.process_iter(): print(p.name())",
      "r00tme":     "[compiled ELF binary — stripped of symbols]",
      "config.cfg": "log_level=INFO\nbind=0.0.0.0\nmax_conn=100"
    },
    permissions: {
      "readme.txt": "-rw-r--r--  1 user  user   312",
      "script.sh":  "-rwxr-xr-x  1 user  user   128",
      "monitor.py": "-rw-r--r--  1 user  user    89",
      "r00tme":     "-rwsr-xr-x  1 root  root  8472",
      "config.cfg": "-rw-------  1 root  root    58"
    }
  },

  "level5@linux": {
    password: "r00tme",
    track: "linux",
    objective: "Use 'find / -name \"*.key\"' to locate a private key left on the filesystem.",
    lesson: "The find command is post-exploitation gold. Attackers use it to locate SSH private keys (id_rsa), certificates (*.pem), config files (*.conf), and backup files (*.bak) across the entire filesystem. A forgotten key can grant access to dozens of other servers.",
    files: {
      "readme.txt":                        "A dev left their SSH private key somewhere on this system.\nHint: find / -name \"*.key\"\nRead it with cat.",
      "home/user/notes.txt":               "Remember to clean up test files before deploying!",
      "home/user/report.pdf":              "[PDF - Q3 Security Audit - CONFIDENTIAL]",
      "etc/nginx/nginx.conf":              "server {\n  listen 80;\n  root /var/www/html;\n}",
      "var/tmp/.cache/.hidden/id_rsa.key": "-----BEGIN RSA PRIVATE KEY-----\nThis key grants access to prod-db-01.\nBackup passphrase: shadowkey\n-----END RSA PRIVATE KEY-----"
    }
  },

  "level6@linux": {
    password: "shadowkey",
    track: "linux",
    objective: "Use 'env' to list environment variables. Find the DB_PASSWORD.",
    lesson: "Environment variables are a goldmine. Cloud credentials (AWS_ACCESS_KEY), database passwords (DB_PASS), and JWT secrets are routinely exposed in Docker containers, Kubernetes pods, and CI/CD configs. On a compromised box, 'env' is always the third command you run (after whoami and id).",
    files: {
      "readme.txt": "Secrets stored in env vars — a very common misconfiguration.\nRun 'env' to list them all.\nThe DB_PASSWORD value is the next password.",
      "app.py":     "import os\nAPI_KEY = os.getenv('SECRET_API_KEY')\nDB_PASS = os.getenv('DB_PASSWORD')\nprint(f'Connecting with: {DB_PASS}')"
    },
    env_vars: {
      "PATH":                   "/usr/local/sbin:/usr/local/bin:/usr/bin:/bin",
      "HOME":                   "/home/appuser",
      "USER":                   "appuser",
      "NODE_ENV":               "production",
      "SECRET_API_KEY":         "sk-prod-a8f2c491b3e76d02",
      "DB_PASSWORD":            "rootkit99",
      "AWS_ACCESS_KEY_ID":      "AKIA4EXAMPLEKEY1234",
      "AWS_SECRET_ACCESS_KEY":  "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "FLASK_SECRET":           "dev-not-for-prod-pleasechange"
    }
  },

  "level7@linux": {
    password: "rootkit99",
    track: "linux",
    objective: "Linux track complete! ssh guest@shellscape",
    lesson: "Core Linux enumeration skills used in real penetration tests — all unlocked.",
    files: {
      "trophy.txt": "★  LINUX MASTER  ★\n\nSkills earned:\n  ✓ ls / cat     — file enumeration\n  ✓ ls -a        — hidden dotfiles\n  ✓ cat dir/file — directory traversal\n  ✓ grep         — bulk credential searching\n  ✓ ls -l        — SUID privilege escalation vectors\n  ✓ find         — locating keys, certs, configs\n  ✓ env          — environment variable leaks\n\nReturn: ssh guest@shellscape"
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  NETWORK TRACK  (6 levels)                              ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@network": {
    password: null,
    track: "network",
    objective: "Scan 10.0.0.1 with 'nmap 10.0.0.1'. The service name on port 8080 is the password.",
    lesson: "nmap (Network Mapper) is the industry-standard port scanner. Every pentest starts here. Open ports are attack surface — finding them is step one. 65535 ports exist; nmap helps identify which are open, filtered, or closed.",
    files: {
      "readme.txt": "Target: 10.0.0.1\nScan it: nmap 10.0.0.1\nThe service name on port 8080 is the password."
    },
    net: {
      "10.0.0.1": [
        { port: 22,   state: "open",     service: "ssh",      version: "" },
        { port: 80,   state: "open",     service: "http",     version: "" },
        { port: 443,  state: "closed",   service: "https",    version: "" },
        { port: 8080, state: "open",     service: "http-alt", version: "" },
        { port: 3306, state: "filtered", service: "mysql",    version: "" },
        { port: 6379, state: "filtered", service: "redis",    version: "" }
      ]
    }
  },

  "level1@network": {
    password: "http-alt",
    track: "network",
    objective: "Use 'nmap -sV 10.0.0.2' for version detection. The vsftpd version number (e.g. x.x) is the password.",
    lesson: "nmap -sV probes each port to identify exact software versions. 'Apache 2.4.49' has CVE-2021-41773 (RCE via path traversal); '2.4.50' doesn't. Versions bridge recon and exploitation. Real pentesters pipe nmap output into Searchsploit to auto-find exploits.",
    files: {
      "readme.txt": "Version scan: nmap -sV 10.0.0.2\nThe vsftpd version number is the password (format: x.x).\n\nNote: Apache 2.4.49 here has CVE-2021-41773 — a critical real-world RCE."
    },
    net: {
      "10.0.0.2": [
        { port: 21,   state: "open", service: "ftp",        version: "vsftpd 3.4" },
        { port: 22,   state: "open", service: "ssh",        version: "OpenSSH 7.9p1 Debian" },
        { port: 80,   state: "open", service: "http",       version: "Apache httpd 2.4.49" },
        { port: 5432, state: "open", service: "postgresql", version: "PostgreSQL 13.3" },
        { port: 8443, state: "open", service: "https-alt",  version: "nginx 1.18.0" }
      ]
    }
  },

  "level2@network": {
    password: "3.4",
    track: "network",
    objective: "Post-exploitation: run 'netstat' to map running services. What is the process name on port 4444?",
    lesson: "netstat shows active connections and listening ports from INSIDE a compromised box — revealing services invisible to external scanners. Port 4444 is Metasploit's default meterpreter port. Seeing it is an immediate IOC (Indicator of Compromise). Real SOC analysts watch for it.",
    files: {
      "readme.txt": "You have a shell on this box. Run 'netstat' to see what's listening.\nThe process name on port 4444 is the password."
    },
    netstatData: [
      { proto: "tcp", local: "0.0.0.0:22",    foreign: "0.0.0.0:*",        state: "LISTEN",      pid: "1023/sshd" },
      { proto: "tcp", local: "0.0.0.0:80",    foreign: "0.0.0.0:*",        state: "LISTEN",      pid: "2041/nginx" },
      { proto: "tcp", local: "127.0.0.1:5432",foreign: "0.0.0.0:*",        state: "LISTEN",      pid: "987/postgres" },
      { proto: "tcp", local: "0.0.0.0:4444",  foreign: "0.0.0.0:*",        state: "LISTEN",      pid: "3312/backdoor" },
      { proto: "tcp", local: "10.0.0.5:52341",foreign: "10.0.0.1:4444",    state: "ESTABLISHED", pid: "3312/backdoor" },
      { proto: "tcp", local: "10.0.0.5:22",   foreign: "10.0.0.99:55210",  state: "ESTABLISHED", pid: "1023/sshd" },
      { proto: "udp", local: "0.0.0.0:53",    foreign: "0.0.0.0:*",        state: "-",           pid: "756/named" }
    ]
  },

  "level3@network": {
    password: "backdoor",
    track: "network",
    objective: "Run 'whois target.htb' for OSINT. The admin email username (before @) is the password.",
    lesson: "WHOIS is a public domain ownership database. Attackers harvest real names, emails (for phishing/spear-phishing), registration history, and nameservers. Tools like theHarvester, SpiderFoot, and Maltego automate this. One email from WHOIS can launch a targeted social engineering campaign.",
    files: {
      "readme.txt": "Target domain: target.htb\nRun: whois target.htb\nFind the Admin Email — the username (before @) is the password."
    },
    whoisData: {
      "target.htb": [
        "Domain Name: TARGET.HTB",
        "Registry Domain ID: 192837465-HTB",
        "Registrar: HTB Domains LLC",
        "Updated Date: 2023-11-02",
        "Creation Date: 2019-03-15",
        "Expiry Date:   2025-03-15",
        "Name Server: ns1.target.htb",
        "Name Server: ns2.target.htb",
        "Registrant Name: John Smith",
        "Registrant Org:  Target Corp",
        "Registrant Country: US",
        "Admin Email: netadmin@target.htb",
        "Tech Email:  tech-ops@target.htb",
        "Abuse Email: abuse@target.htb",
        "DNSSEC: unsigned"
      ]
    }
  },

  "level4@network": {
    password: "netadmin",
    track: "network",
    objective: "Run 'dig target.htb ANY' to enumerate DNS records. Secrets hide in TXT records.",
    lesson: "DNS TXT records are used for SPF/DKIM/domain-verify — but sysadmins accidentally store internal notes in them. DNS enumeration (dig, fierce, dnsx, amass) also reveals subdomains and internal IPs. 'dig ANY' fetches all record types at once. Always run DNS enum before web recon.",
    files: {
      "readme.txt": "Target: target.htb\nCommand: dig target.htb ANY\nInspect the TXT records — one contains the password."
    },
    dnsData: {
      "target.htb": {
        "A":   ["192.168.10.50"],
        "AAAA":[],
        "MX":  ["10 mail.target.htb", "20 backup-mail.target.htb"],
        "NS":  ["ns1.target.htb", "ns2.target.htb"],
        "TXT": [
          "v=spf1 include:mail.target.htb -all",
          "google-site-verification=dGFyZ2V0Y29ycA==",
          "MS=ms12345678",
          "internal-note: staging_pass=dnsrecon  <-- TODO: remove this!"
        ],
        "SOA": ["ns1.target.htb. admin.target.htb. 2024010101 3600 900 604800 300"]
      }
    }
  },

  "level5@network": {
    password: "dnsrecon",
    track: "network",
    objective: "Network track complete! ssh guest@shellscape",
    lesson: "Network recon lifecycle: port discovery → version detection → post-exploitation enumeration → OSINT → DNS enum. This IS Chapters 1-3 of any professional pentest.",
    files: {
      "trophy.txt": "★  NETWORK MASTER  ★\n\nSkills earned:\n  ✓ nmap        — port scanning\n  ✓ nmap -sV    — service version detection + CVE mapping\n  ✓ netstat     — post-exploitation network mapping\n  ✓ whois       — OSINT & social engineering data\n  ✓ dig         — DNS enumeration & TXT record secrets\n\nReturn: ssh guest@shellscape"
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CRYPTO TRACK  (7 levels)                               ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@crypto": {
    password: null,
    track: "crypto",
    objective: "Decode the base64 file. Use: base64 secret.b64",
    lesson: "Base64 is ENCODING, not encryption — it's trivially reversible. Yet it's everywhere: API responses, JWT headers, encoded credentials in configs. Recognise it by alphanumeric chars + / and = padding. Seeing it should immediately make you decode it.",
    files: {
      "readme.txt": "This credential was found base64-encoded in an API response.\nDecode: base64 secret.b64\nBase64 always ends with '=' padding. It is NOT encryption.",
      "secret.b64": "Y2xvdWRidXJzdA=="
    }
  },

  "level1@crypto": {
    password: "cloudburst",
    track: "crypto",
    objective: "Decode the ROT13 message. Use: rot13 message.txt",
    lesson: "ROT13 shifts each letter 13 places — applying it twice restores the original. It's trivially broken, found in CTFs and legacy systems. It's a Caesar cipher with shift=13. Real variant: Caesar with different shifts (brute-force all 25).",
    files: {
      "readme.txt": "ROT13 shifts each letter by 13 (A=N, B=O etc). Numbers & symbols unchanged.\nDecode: rot13 message.txt",
      "message.txt": "Gur cnffjbeq vf: vebaxhegnva"
    }
  },

  "level2@crypto": {
    password: "ironkurtain",
    track: "crypto",
    objective: "Inspect 'encoded.bin' with 'xxd encoded.bin', then decode it with 'decode-hex encoded.bin'.",
    lesson: "xxd converts files to hexadecimal — essential for inspecting binaries, firmware, and malware payloads. Data carved from memory dumps and packet captures often appears as raw hex. Many C2 implants store their config as hex-encoded strings inside otherwise binary files.",
    files: {
      "readme.txt": "Intercepted from a C2 server. Looks like garbage.\nStep 1: xxd encoded.bin        (view the raw hex)\nStep 2: decode-hex encoded.bin (hex string → ASCII)",
      "encoded.bin": "6d61747269787661756c74"
    }
  },

  "level3@crypto": {
    password: "matrixvault",
    track: "crypto",
    objective: "Identify the hash type with 'hash-id hash.txt', then crack it with 'john hash.txt'.",
    lesson: "MD5 is cryptographically broken. John the Ripper and Hashcat crack millions of MD5 hashes per second using rockyou.txt (14 million real leaked passwords). Never store passwords as unsalted MD5. When you find a hash in a database dump, this is your workflow: identify → crack.",
    files: {
      "readme.txt": "A password hash was extracted from /etc/shadow.\nStep 1: hash-id hash.txt     (identify the algorithm)\nStep 2: john hash.txt        (dictionary attack with rockyou.txt)\nThe cracked plaintext is the password.",
      "hash.txt": "5f4dcc3b5aa765d61d8327deb882cf99"
    },
    johnCrack: {
      "hash.txt": {
        type:     "MD5",
        hash:     "5f4dcc3b5aa765d61d8327deb882cf99",
        plain:    "password",
        wordlist: "rockyou.txt",
        time:     "0:00:00:02"
      }
    }
  },

  "level4@crypto": {
    password: "password",
    track: "crypto",
    objective: "Decrypt the XOR cipher. The key is in key.txt. Use: xor cipher.bin <key>",
    lesson: "XOR is the building block of stream ciphers, but single-byte XOR is trivially broken. Many malware families (including early Mirai botnet variants) XOR-obfuscate strings and configs with a single key byte. Real tools: CyberChef, xortool. Find the key, XOR every byte, done.",
    files: {
      "readme.txt": "XOR-encrypted payload. Single-byte key.\nStep 1: cat key.txt\nStep 2: xor cipher.bin <key>\nThe decrypted result is the password.",
      "key.txt":    "XOR key: 0x5A",
      "cipher.bin": "3e3b283129333e3f"
    }
  },

  "level5@crypto": {
    password: "darkside",
    track: "crypto",
    objective: "Multi-layer challenge: two encodings stacked. Peel each layer outside-in.",
    lesson: "Real malware layers obfuscation: base64(XOR(gzip(payload))). You identify and reverse each layer systematically — always outside-in. In this challenge: Layer 1 (outer) = ROT13, Layer 2 (inner) = Base64. This technique is called 'encoding chaining' and appears constantly in CTF and real malware.",
    files: {
      "readme.txt": "Two encodings stacked on top of each other.\nLayer 1 (outer): ROT13\nLayer 2 (inner): Base64\n\nStep 1: rot13 onion.txt           → reveals a base64 string\nStep 2: base64 -d <that_string>   → reveals the password\n\nAlways work outside-in.",
      "onion.txt":   "L2yjnTIloT9wnj=="
    }
  },

  "level6@crypto": {
    password: "cipherlock",
    track: "crypto",
    objective: "Crypto track complete! ssh guest@shellscape",
    lesson: "You can now identify and reverse encoding schemes that appear in real-world malware, CTF challenges, and penetration tests.",
    files: {
      "trophy.txt": "★  CRYPTO MASTER  ★\n\nSkills earned:\n  ✓ Base64         — identify and decode\n  ✓ ROT13          — Caesar cipher reversal\n  ✓ Hex encoding   — xxd + decode-hex\n  ✓ MD5 cracking   — hash-id + john dictionary attack\n  ✓ XOR cipher     — single-byte key reversal\n  ✓ Layered obfuscation — peel encodings systematically\n\nReturn: ssh guest@shellscape"
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  WEB TRACK  (5 levels)                                  ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@web": {
    password: null,
    track: "web",
    objective: "Use 'curl http://target.htb/robots.txt' to find hidden paths, then fetch the secret one.",
    lesson: "robots.txt tells crawlers which paths NOT to index — and hands attackers a roadmap. Real targets have listed /admin, /.git, /backup, and /staging. It's always the FIRST file you check. The Disallowed paths are what you want most.",
    files: {
      "readme.txt": "Target: http://target.htb\nStep 1: curl http://target.htb/robots.txt\nStep 2: curl the Disallowed path\nThe password is in that hidden page."
    },
    web: {
      "http://target.htb/":              "<html><body><h1>Welcome to Target Corp</h1></body></html>",
      "http://target.htb/robots.txt":    "User-agent: *\nDisallow: /admin\nDisallow: /secret-backup\nDisallow: /.git\nDisallow: /api/internal",
      "http://target.htb/admin":         "403 Forbidden",
      "http://target.htb/secret-backup": "# Backup credentials - DO NOT COMMIT\nftp_user: ftpadmin\nftp_pass: webmaster22\ndb_pass:  webmaster22",
      "http://target.htb/.git":          "403 Forbidden — but .git exposure = full source code dump via git-dumper!",
      "http://target.htb/api/internal":  "401 Unauthorized — API token required."
    }
  },

  "level1@web": {
    password: "webmaster22",
    track: "web",
    objective: "Use 'curl -I http://target.htb/' to read HTTP headers. Server version (no dots) is the password.",
    lesson: "HTTP response headers leak critical intel: server software, version numbers, backend frameworks. 'Server: Apache/2.4.49' maps directly to CVE-2021-41773 (path traversal RCE). 'X-Powered-By: PHP/7.2' reveals an EOL version. Headers are free recon — always check them.",
    files: {
      "readme.txt": "Server banners expose version info that maps to CVEs.\nCommand: curl -I http://target.htb/\nServer header version without dots = password (e.g. Apache2449).\n\n⚠ Apache 2.4.49 = CVE-2021-41773 — path traversal + unauthenticated RCE."
    },
    webHeaders: {
      "http://target.htb/": {
        "HTTP/1.1":               "200 OK",
        "Server":                 "Apache/2.4.49 (Debian)",
        "X-Powered-By":           "PHP/7.4.3",
        "X-Frame-Options":        "SAMEORIGIN",
        "Content-Type":           "text/html; charset=UTF-8",
        "Set-Cookie":             "PHPSESSID=abc123def456; path=/; HttpOnly",
        "X-Content-Type-Options": "nosniff"
      }
    }
  },

  "level2@web": {
    password: "apache2449",
    track: "web",
    objective: "Use 'gobuster http://target.htb/' to brute-force hidden directories, then curl what you find.",
    lesson: "gobuster and dirsearch fuzz web servers with wordlists of thousands of common paths. Developers routinely forget to protect /admin, /dev, /backup, /.env, /api/v1. Discovering an exposed admin panel or .env file is often the initial foothold in a pentest.",
    files: {
      "readme.txt": "Hidden directories host admin panels and debug interfaces.\nBrute force: gobuster http://target.htb/\nThen: curl <discovered_path>\nPassword is in the hidden page."
    },
    web: {
      "http://target.htb/admin-console": "=== ADMIN CONSOLE ===\nStatus: DEBUG MODE ON\nDB connection: active\nAdmin pass: supersecret\nWARNING: This page should NOT be public!"
    },
    gobusterRes: {
      "http://target.htb/": [
        "/index.html         [200]",
        "/about.html         [200]",
        "/images/            [301]",
        "/admin-console      [200]  ← interesting!",
        "/uploads/           [403]",
        "/.htaccess          [403]"
      ]
    }
  },

  "level3@web": {
    password: "supersecret",
    track: "web",
    objective: "Use 'cookies http://target.htb/' to inspect session cookies. Decode the base64 value.",
    lesson: "Session cookies often store base64-encoded JSON user data. Poorly built apps validate the cookie exists but not its content. Attackers decode the JSON, change 'role':'user' to 'role':'admin', re-encode, and replay. This is an IDOR/broken access control — OWASP Top 10 #1.",
    files: {
      "readme.txt": "A session cookie was captured from an authenticated user.\nCommand: cookies http://target.htb/\nThe cookie value is base64-encoded JSON.\nDecode: base64 -d <cookie_value>\nThe password field inside is the password."
    },
    cookieData: {
      "http://target.htb/": {
        "PHPSESSID":    "abc123def456",
        "user_session": "eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwicGFzc3dvcmQiOiJjb29raWVtb25zdGVyIiwiZXhwIjoxNzAwMDAwMDAwfQ=="
      }
    }
  },

  "level4@web": {
    password: "cookiemonster",
    track: "web",
    objective: "Web track complete! ssh guest@shellscape",
    lesson: "Web recon fundamentals: robots.txt enumeration, HTTP header fingerprinting, directory brute forcing, and cookie analysis. These are Steps 1-4 of OWASP web application testing methodology.",
    files: {
      "trophy.txt": "★  WEB MASTER  ★\n\nSkills earned:\n  ✓ robots.txt — hidden path discovery\n  ✓ curl -I    — header fingerprinting + CVE mapping\n  ✓ gobuster   — directory & file brute forcing\n  ✓ cookies    — session token analysis + privilege escalation\n\nNext steps (beyond this game):\n  → SQL injection (sqlmap)\n  → Cross-Site Scripting (XSS)\n  → SSRF, XXE, IDOR, CSRF\n  → JWT attacks\n\nReturn: ssh guest@shellscape"
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  FORENSICS TRACK  (5 levels)                            ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@forensics": {
    password: null,
    track: "forensics",
    objective: "Use 'file *' on all files. Extensions can lie — magic bytes don't. Find the impostor.",
    lesson: "The 'file' command reads magic bytes — the first bytes that identify a file's real format, regardless of extension. Attackers rename malware.exe to invoice.pdf. Forensic analysts NEVER trust extensions. A JPEG starts with 0xFF 0xD8; an ELF starts with 0x7F 45 4C 46. One of these files is not what it seems.",
    files: {
      "readme.txt":    "File extensions can be faked. Use 'file *' to reveal true types.\nThe first word of the real type of 'malware.txt' (lowercase) is the password.",
      "vacation.jpg":  "\xFF\xD8\xFF\xE0 [valid JPEG image data]",
      "report.pdf":    "%PDF-1.4 [valid PDF document]",
      "archive.zip":   "PK\x03\x04 [valid ZIP archive]",
      "malware.txt":   "MZ\x90\x00 [Windows PE executable disguised as text!]"
    },
    filetypes: {
      "readme.txt":  "ASCII text",
      "vacation.jpg":"JPEG image data, JFIF standard 1.01",
      "report.pdf":  "PDF document, version 1.4",
      "archive.zip": "Zip archive data, at least v2.0",
      "malware.txt": "PE32+ executable (console) x86-64 (NOT a text file!)"
    }
  },

  "level1@forensics": {
    password: "pe32",
    track: "forensics",
    objective: "Use 'strings firmware.bin' to extract hardcoded text from the binary. Find the admin password.",
    lesson: "'strings' extracts printable char sequences from any file — compiled binaries, firmware images, memory dumps. Malware analysts run it as their FIRST step. Hardcoded IPs, C2 URLs, passwords, registry keys, and mutex names are routinely exposed. It's how analysts first mapped Stuxnet's targeted PLCs.",
    files: {
      "readme.txt":   "Malware often has hardcoded strings.\nExtract them: strings firmware.bin\nFind the admin_pass value — it's the password.",
      "firmware.bin": "\x7fELF\x02\x01 [binary ELF data]"
    },
    stringsOut: {
      "firmware.bin": [
        "/lib64/ld-linux-x86-64.so.2",
        "__libc_start_main",
        "System initializing...",
        "http://192.168.1.1/update",
        "admin_user=root",
        "admin_pass=hardcoded99",
        "c2_beacon=http://malicious.ru/beacon",
        "encryption_key=DEADBEEFCAFEBABE",
        "Firmware version 2.1.4",
        "Target Corp Embedded Systems"
      ]
    }
  },

  "level2@forensics": {
    password: "hardcoded99",
    track: "forensics",
    objective: "Use 'xxd secret.dat' to inspect the hex dump. Then 'decode-hex secret.dat' to read it.",
    lesson: "Hex analysis is core to digital forensics and malware reverse engineering. Memory dumps, network captures, and disk images all require hex-level inspection. Recognising printable ASCII ranges (0x20-0x7e) in hex output is a skill that separates junior from senior analysts.",
    files: {
      "readme.txt":  "Extracted from a memory dump. Looks like garbage.\nStep 1: xxd secret.dat       (inspect the hex dump)\nStep 2: decode-hex secret.dat (hex → ASCII)",
      "secret.dat":  "68657866696e64657268"
    }
  },

  "level3@forensics": {
    password: "hexfinder",
    track: "forensics",
    objective: "Use 'exif photo.jpg' to read metadata. The Comment field value is the password.",
    lesson: "EXIF metadata embeds GPS coordinates, device model, creation date, and comments in photos. Journalists have been de-anonymized via GPS EXIF. Whistleblowers tracked. In forensic investigations, EXIF proves when/where a photo was taken. Always strip metadata with exiftool before sharing sensitive images.",
    files: {
      "readme.txt": "This photo was shared by a suspect. Investigate its metadata.\nCommand: exif photo.jpg\nThe Comment field IS the password.",
      "photo.jpg":  "\xFF\xD8\xFF\xE1 [JPEG with EXIF data embedded]"
    },
    exifData: {
      "photo.jpg": [
        "File Type                 : JPEG",
        "Image Width               : 4032",
        "Image Height              : 3024",
        "Camera Model              : iPhone 14 Pro",
        "Date/Time Original        : 2024:01:15 14:23:07",
        "GPS Latitude              : 40 deg 44' 54.36\" N",
        "GPS Longitude             : 73 deg 59'  8.50\" W",
        "GPS Altitude              : 10.2 m Above Sea Level",
        "Software                  : Adobe Photoshop 25.0",
        "Artist                    : J. Smith",
        "Comment                   : metadataleek",
        "⚠ Warning                 : GPS present — physical location exposed!"
      ]
    }
  },

  "level4@forensics": {
    password: "metadataleek",
    track: "forensics",
    objective: "Forensics track complete! ssh guest@shellscape",
    lesson: "Digital forensics toolkit: magic byte identification, strings extraction, hex analysis, and metadata forensics. Tools used in incident response, malware analysis, and CTF competitions every day.",
    files: {
      "trophy.txt": "★  FORENSICS MASTER  ★\n\nSkills earned:\n  ✓ file     — magic byte analysis, defeating fake extensions\n  ✓ strings  — hardcoded credential extraction from binaries\n  ✓ xxd      — hex dump analysis and data carving\n  ✓ exif     — metadata forensics and GPS location exposure\n\nReal-world tools:\n  → Malware analysis: ANY.RUN, VirusTotal, Ghidra\n  → Incident response: Volatility, Autopsy\n  → OSINT via photo metadata: ExifTool, Jeffrey's Exif Viewer\n\nReturn: ssh guest@shellscape"
    }
  }

};
