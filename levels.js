// ═══════════════════════════════════════════════════════════════
//  LEVELS  —  5 tracks, 26 levels
//
//  Per-level filesystem (consumed by commands):
//    fs            Nested filesystem tree (replaces flat `files`).
//                  Each node: { type: "file"|"dir", content?, children? }
//                  `files` is kept as a FLAT alias (auto-built at runtime)
//                  so all legacy commands (cat, grep, find, ls) still work.
//
//  Other per-level properties:
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
//
//  cd / pwd / ls interact with the nested `fs` tree at runtime.
//  See commands.js for the cd implementation.
// ═══════════════════════════════════════════════════════════════

// ── Helper: flatten an fs tree into the legacy `files` flat map ─
function flattenFS(node, prefix) {
  const out = {};
  if (!node || !node.children) return out;
  for (const [name, child] of Object.entries(node.children)) {
    const path = prefix ? prefix + "/" + name : name;
    if (child.type === "dir") {
      out[path + "/"] = null;
      Object.assign(out, flattenFS(child, path));
    } else {
      out[path] = child.content ?? "";
    }
  }
  return out;
}

// ── Build runtime `files` flat map for every level after definition ─
function initLevels(levels) {
  for (const level of Object.values(levels)) {
    if (level.fs) {
      level.files = flattenFS(level.fs, "");
    }
    if (!level.files) level.files = {};
  }
  return levels;
}

const LEVELS = initLevels({

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
    objective: "Someone deployed this server carelessly and left credentials behind. List all files with 'ls', then read them with 'cat <filename>' until you find the password.",
    lesson: "Developers often commit credentials into config files during rushed deployments. The first thing any attacker does on a new target is 'ls' then 'cat' every file in sight. Always audit your deployment artifacts before going live.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Welcome to the Linux track!\nSomeone deployed this server in a rush and left some files behind.\nTry: ls"
        },
        "deploy_notes.txt": {
          type: "file",
          content: "TODO: clean up before prod!\n- remove test accounts\n- !! delete credentials.txt !!\n- rotate all passwords"
        },
        "credentials.txt": {
          type: "file",
          content: "Deployment credentials:\nuser: admin\npass: greenlight"
        }
      }
    }
  },

  "level1@linux": {
    password: "greenlight",
    track: "linux",
    objective: "There are hidden files in this directory. A plain 'ls' won't show them — you need a flag to reveal files starting with a dot. Find the hidden file that contains a command history.",
    lesson: "Files starting with '.' are hidden from plain 'ls'. Run 'ls -a' to see ALL files. Attackers always check for .bash_history (command history), .env (secrets), and .ssh/ (private keys). Careless admins routinely leave these exposed.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Nothing to see here... or is there?\nTip: plain 'ls' hides files that start with a dot.\nTry: ls -a"
        },
        "todo.txt": {
          type: "file",
          content: "1. Change server password\n2. Delete the .bash_history file!\n3. Rotate API keys\n4. Remove .env before deploying"
        },
        ".bash_history": {
          type: "file",
          content: "ssh root@192.168.1.50\ncat /etc/shadow\necho ghostwire | sudo -S systemctl restart nginx\nsudo rm -rf /tmp/*"
        },
        ".env": {
          type: "file",
          content: "# App configuration\nDATABASE_URL=postgres://localhost:5432/app\nAPP_ENV=production\nSECRET_KEY=not_this_one_keep_looking"
        }
      }
    }
  },

  "level2@linux": {
    password: "ghostwire",
    track: "linux",
    objective: "The password is buried inside a subdirectory. Use 'ls' to see what directories exist, 'cd <dir>' to enter them, and 'cat <file>' to read files once you're inside.",
    lesson: "Sensitive files live deep in directory trees — /etc/, /var/log/, /opt/app/. On a real server, 'ls' the home directory, then explore each subdirectory methodically. Config backups (.bak files) frequently contain plaintext credentials that were 'temporarily' hardcoded.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "The password is inside a config backup file.\nExplore the subdirectories:\n  ls          — list current directory\n  cd <dir>    — change into a directory\n  cd ..       — go back up\n  cat <file>  — read a file"
        },
        "logs": {
          type: "dir",
          children: {
            "access.log": {
              type: "file",
              content: "10.0.0.1 - GET /index.html 200\n10.0.0.2 - GET /admin 403\n10.0.0.5 - GET /backup.zip 200"
            },
            "error.log": {
              type: "file",
              content: "ERROR: failed login from 10.0.0.99 (5 attempts)\nERROR: disk at 94% capacity"
            }
          }
        },
        "backup": {
          type: "dir",
          children: {
            "config.bak": {
              type: "file",
              content: "[database]\nhost     = localhost\nport     = 5432\npassword = deeproot\nssl      = true"
            }
          }
        }
      }
    }
  },

  "level3@linux": {
    password: "deeproot",
    track: "linux",
    objective: "There are several files in this directory. One of them contains a hidden flag value. Instead of reading every file manually, use 'grep flag *' to search all files at once.",
    lesson: "grep is the pentester's best friend. During post-exploitation, attackers grep entire filesystems for 'password', 'secret', 'api_key', 'token' across thousands of files in seconds. Mastering grep beats any GUI tool when you need speed.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "These files came from a compromised web server.\nOne of them contains the word 'flag' followed by the password.\nSearching file by file takes too long — use grep:\n  grep <keyword> <file>   — search one file\n  grep <keyword> *        — search all files at once"
        },
        "access.log": {
          type: "file",
          content: "10.0.0.1 GET /home 200\n10.0.0.2 GET /login 200\n10.0.0.3 POST /login 401\n10.0.0.4 GET /admin 403"
        },
        "config.txt": {
          type: "file",
          content: "debug=false\nmax_retries=3\nallow_root=false\ntimeout=30"
        },
        "dump.sql": {
          type: "file",
          content: "INSERT INTO users VALUES ('admin', 'hashed_pw');\nINSERT INTO config VALUES ('flag', 'ironclad');\nINSERT INTO logs VALUES ('2024-01-01', 'login', 'success');"
        }
      }
    }
  },

  "level4@linux": {
    password: "ironclad",
    track: "linux",
    objective: "One of the files here has unusual permissions — it runs with root privileges no matter who executes it. Use 'ls -l' to view file permissions. Find the file with 's' in its permission string, where you'd expect an 'x'. That filename is the password.",
    lesson: "SUID (Set User ID) lets a program run with its owner's privileges regardless of who launches it. A SUID binary owned by root = instant privilege escalation. Real pentesters run 'find / -perm -4000 2>/dev/null' to hunt for exactly this. SUID shows as 's' in the owner execute slot: -rws------",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "One of these files has dangerous permissions.\nRun 'ls -l' and read the permission string on the left.\nNormal execute = 'x'. SUID execute = 's'.\nThe filename of the SUID binary (owned by root) is the password."
        },
        "script.sh": {
          type: "file",
          content: "#!/bin/bash\ntar czf /backup/$(date +%F).tar.gz /var/www/"
        },
        "monitor.py": {
          type: "file",
          content: "import psutil\nfor p in psutil.process_iter(): print(p.name())"
        },
        "r00tme": {
          type: "file",
          content: "[compiled ELF binary — stripped of symbols]"
        },
        "config.cfg": {
          type: "file",
          content: "log_level=INFO\nbind=0.0.0.0\nmax_conn=100"
        }
      }
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
    objective: "A developer left an SSH private key somewhere on this filesystem. It's not in the current directory — it's buried deep in subdirectories. Use 'find . -name \"*.key\"' to locate it, then 'cat' the file to read it.",
    lesson: "The 'find' command is post-exploitation gold. Attackers use it to locate SSH private keys (id_rsa, *.key), certificates (*.pem), config files (*.conf), and backups (*.bak) across the entire filesystem. A forgotten private key can grant access to dozens of other servers.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "A developer left their SSH private key hidden deep in this filesystem.\nIt won't show up with a plain 'ls' — it's inside nested directories.\n\nUse find to search everywhere at once:\n  find . -name \"*.key\"\n\nThen read it with 'cat <path>'.\nNavigate manually with 'cd' if you prefer exploring."
        },
        "home": {
          type: "dir",
          children: {
            "user": {
              type: "dir",
              children: {
                "notes.txt": {
                  type: "file",
                  content: "Remember to clean up test files before deploying!\nAlso: stop leaving keys in /var/tmp"
                },
                "report.pdf": {
                  type: "file",
                  content: "[PDF - Q3 Security Audit - CONFIDENTIAL]"
                }
              }
            }
          }
        },
        "etc": {
          type: "dir",
          children: {
            "nginx": {
              type: "dir",
              children: {
                "nginx.conf": {
                  type: "file",
                  content: "server {\n  listen 80;\n  root /var/www/html;\n}"
                }
              }
            }
          }
        },
        "var": {
          type: "dir",
          children: {
            "tmp": {
              type: "dir",
              children: {
                ".cache": {
                  type: "dir",
                  children: {
                    ".hidden": {
                      type: "dir",
                      children: {
                        "id_rsa.key": {
                          type: "file",
                          content: "-----BEGIN RSA PRIVATE KEY-----\nThis key grants access to prod-db-01.\nBackup passphrase: shadowkey\n-----END RSA PRIVATE KEY-----"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  "level6@linux": {
    password: "shadowkey",
    track: "linux",
    objective: "Secrets are often stored as environment variables instead of files. Run 'env' to dump all environment variables. Find the one named DB_PASSWORD — its value is the password.",
    lesson: "Environment variables are a goldmine on compromised boxes. Cloud credentials (AWS_ACCESS_KEY), database passwords (DB_PASS), and JWT secrets are routinely exposed in Docker containers, Kubernetes pods, and CI/CD configs. 'env' is always one of the first commands you run after getting a shell.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Secrets are sometimes stored as environment variables instead of files.\nThis is a very common misconfiguration in containerized apps.\n\nRun 'env' to list all environment variables.\nThe value of DB_PASSWORD is the next password."
        },
        "app.py": {
          type: "file",
          content: "import os\nAPI_KEY = os.getenv('SECRET_API_KEY')\nDB_PASS = os.getenv('DB_PASSWORD')\nprint(f'Connecting with: {DB_PASS}')"
        }
      }
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
    objective: "Linux track complete! Type: ssh guest@shellscape",
    lesson: "Core Linux enumeration skills used in real penetration tests — all unlocked.",
    fs: {
      type: "dir",
      children: {
        "trophy.txt": {
          type: "file",
          content: "★  LINUX MASTER  ★\n\nSkills earned:\n  ✓ ls / cat     — file enumeration\n  ✓ ls -a        — hidden dotfiles\n  ✓ cd / ls      — directory navigation\n  ✓ grep         — bulk credential searching\n  ✓ ls -l        — SUID privilege escalation vectors\n  ✓ find         — locating keys, certs, configs\n  ✓ env          — environment variable leaks\n\nReturn: ssh guest@shellscape"
        }
      }
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  NETWORK TRACK  (6 levels)                              ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@network": {
    password: null,
    track: "network",
    objective: "You have a target host at 10.0.0.1. Scan it with 'nmap 10.0.0.1' to discover which ports are open. Look at the service name on port 8080 — that name is the password.",
    lesson: "nmap (Network Mapper) is the industry-standard port scanner. Every pentest starts here. Open ports are attack surface — finding them is step one. 65535 ports exist; nmap identifies which are open, filtered, or closed.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Target host: 10.0.0.1\n\nScan its open ports:\n  nmap 10.0.0.1\n\nThe service name listed for port 8080 is the password.\n(It's not 'http' — look carefully at the exact name nmap reports.)"
        }
      }
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
    objective: "Basic port scanning shows ports are open, but not WHAT is running on them. Scan 10.0.0.2 with 'nmap -sV 10.0.0.2' to detect service versions. The version number of the FTP service (vsftpd) is the password.",
    lesson: "nmap -sV probes each open port to identify the exact software and version. 'Apache 2.4.49' maps directly to CVE-2021-41773 (unauthenticated RCE). Versions bridge the gap between recon and exploitation. Real pentesters pipe nmap output into Searchsploit to auto-find matching exploits.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Basic nmap shows ports — but version scanning reveals what's actually running.\n\nRun: nmap -sV 10.0.0.2\n\nLook for the FTP service (vsftpd). Its version number is the password.\nFormat: x.x (e.g. 2.1)\n\n⚠ Tip: Apache 2.4.49 in these results has a known critical CVE."
        }
      }
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
    objective: "You have a shell on this compromised box. External scanners can't see inside, but 'netstat' shows ALL listening ports and their processes from within. Run 'netstat' and find the process name listening on port 4444 — that name is the password.",
    lesson: "netstat reveals services invisible to external scanners. Port 4444 is Metasploit's default meterpreter listener port — seeing it on an internal box is an immediate Indicator of Compromise (IOC). Real SOC analysts set alerts for unusual listening ports exactly like this.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "You have a shell on this compromised machine.\nExternal nmap scans only see what's exposed to the network.\nFrom inside, 'netstat' reveals EVERYTHING that's listening.\n\nRun: netstat\n\nFind the process name bound to port 4444. That name is the password.\n(Format: the name after the slash in the PID column, e.g. '1023/sshd' → 'sshd')"
        }
      }
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
    objective: "WHOIS is a public database of domain ownership. Run 'whois target.xyz' and examine the output. Find the Admin Email address — the part before the @ symbol is the password.",
    lesson: "WHOIS harvests real names, emails, registration history, and nameservers from public records. One admin email is enough to launch a targeted spear-phishing campaign. Tools like theHarvester and Maltego automate large-scale WHOIS collection for OSINT operations.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "You need to gather OSINT on target.xyz before attacking it.\n\nRun: whois target.xyz\n\nFind the 'Admin Email' field in the output.\nThe username (the part before the @ symbol) is the password."
        }
      }
    },
    whoisData: {
      "target.xyz": [
        "Domain Name: TARGET.XYZ",
        "Registry Domain ID: 192837465-HTB",
        "Registrar: HTB Domains LLC",
        "Updated Date: 2023-11-02",
        "Creation Date: 2019-03-15",
        "Expiry Date:   2025-03-15",
        "Name Server: ns1.target.xyz",
        "Name Server: ns2.target.xyz",
        "Registrant Name: John Smith",
        "Registrant Org:  Target Corp",
        "Registrant Country: US",
        "Admin Email: netadmin@target.xyz",
        "Tech Email:  tech-ops@target.xyz",
        "Abuse Email: abuse@target.xyz",
        "DNSSEC: unsigned"
      ]
    }
  },

  "level4@network": {
    password: "netadmin",
    track: "network",
    objective: "DNS holds more than just IP addresses. Run 'dig target.xyz ANY' to fetch all DNS record types. TXT records sometimes contain accidental secrets — read them carefully. One TXT record contains a staging password.",
    lesson: "DNS TXT records exist for SPF/DKIM/domain verification — but sysadmins accidentally store internal notes in them. DNS enumeration (dig, fierce, dnsx, amass) also reveals subdomains and internal IPs. Always run DNS enumeration before web recon — it's free intelligence.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "DNS records contain more than just IP addresses.\nTXT records are meant for email auth (SPF/DKIM), but admins sometimes leave notes in them.\n\nRun: dig target.xyz ANY\n\nRead all the TXT records. One of them has a staging password embedded.\nThat password value is the answer."
        }
      }
    },
    dnsData: {
      "target.xyz": {
        "A":   ["192.168.10.50"],
        "AAAA":[],
        "MX":  ["10 mail.target.xyz", "20 backup-mail.target.xyz"],
        "NS":  ["ns1.target.xyz", "ns2.target.xyz"],
        "TXT": [
          "v=spf1 include:mail.target.xyz -all",
          "google-site-verification=dGFyZ2V0Y29ycA==",
          "MS=ms12345678",
          "internal-note: staging_pass=dnsrecon  <-- TODO: remove this!"
        ],
        "SOA": ["ns1.target.xyz. admin.target.xyz. 2024010101 3600 900 604800 300"]
      }
    }
  },

  "level5@network": {
    password: "dnsrecon",
    track: "network",
    objective: "Network track complete! Type: ssh guest@shellscape",
    lesson: "Network recon lifecycle: port discovery → version detection → post-exploitation enumeration → OSINT → DNS enum. This IS Chapters 1-3 of any professional pentest.",
    fs: {
      type: "dir",
      children: {
        "trophy.txt": {
          type: "file",
          content: "★  NETWORK MASTER  ★\n\nSkills earned:\n  ✓ nmap        — port scanning\n  ✓ nmap -sV    — service version detection + CVE mapping\n  ✓ netstat     — post-exploitation network mapping\n  ✓ whois       — OSINT & social engineering data\n  ✓ dig         — DNS enumeration & TXT record secrets\n\nReturn: ssh guest@shellscape"
        }
      }
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CRYPTO TRACK  (7 levels)                               ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@crypto": {
    password: null,
    track: "crypto",
    objective: "A credential was intercepted from an API response — but it's been encoded. The file 'secret.b64' looks like random text with an '=' at the end. That pattern is Base64. Decode it with: base64 secret.b64",
    lesson: "Base64 is ENCODING, not encryption — it's instantly reversible by anyone. Yet it's everywhere: API responses, JWT headers, encoded credentials in configs and cookies. Recognise it: alphanumeric characters + '/' + '=' padding at the end. The moment you see it, decode it.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "This credential was intercepted from a live API response.\nIt looks like garbled text — but notice the '=' at the end.\nThat's a Base64 encoding signature.\n\nDecode it:\n  base64 secret.b64\n\nBase64 is NOT encryption. It's just a reversible encoding."
        },
        "secret.b64": {
          type: "file",
          content: "Y2xvdWRidXJzdA=="
        }
      }
    }
  },

  "level1@crypto": {
    password: "cloudburst",
    track: "crypto",
    objective: "The file 'message.txt' contains a message where every letter has been shifted 13 places through the alphabet. This is ROT13. Decode it with: rot13 message.txt",
    lesson: "ROT13 shifts each letter 13 places — applying it twice restores the original, making it self-inverse. It's trivially broken and found in CTFs and legacy obfuscation. It's a Caesar cipher with shift=13. The family of Caesar ciphers (shifts 1-25) can all be brute-forced instantly.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "ROT13 is a simple letter substitution: A↔N, B↔O, C↔P, ...\nNumbers and symbols are NOT changed — only letters.\n\nDecode the message:\n  rot13 message.txt\n\nThe decoded text will contain the password."
        },
        "message.txt": {
          type: "file",
          content: "Gur cnffjbeq vf: vebaxhegnva"
        }
      }
    }
  },

  "level2@crypto": {
    password: "ironkurtain",
    track: "crypto",
    objective: "You've intercepted a file from a C2 server. It looks like garbage — but that's because it's hex-encoded. First, use 'xxd encoded.bin' to see the raw hex bytes. Then use 'decode-hex encoded.bin' to convert the hex string to readable ASCII.",
    lesson: "xxd converts files to hexadecimal — essential for inspecting binaries, firmware, and malware payloads. Data carved from memory dumps and packet captures appears as raw hex. Many C2 implants store configs as hex-encoded strings inside otherwise binary blobs. Reading hex is a core analyst skill.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Intercepted payload from a C2 server. Looks like garbage.\n\nStep 1 — Inspect the raw hex:\n  xxd encoded.bin\n\nStep 2 — Convert hex to ASCII:\n  decode-hex encoded.bin\n\nHex is just a way to write binary data as text. Each pair of hex digits = one character."
        },
        "encoded.bin": {
          type: "file",
          content: "6d61747269787661756c74"
        }
      }
    }
  },

  "level3@crypto": {
    password: "matrixvault",
    track: "crypto",
    objective: "You found a password hash extracted from /etc/shadow. You need to crack it. First, run 'hash-id hash.txt' to identify what algorithm was used. Then run 'john hash.txt' to run a dictionary attack. The cracked plaintext password is the answer.",
    lesson: "MD5 is cryptographically broken. John the Ripper and Hashcat crack millions of MD5 hashes per second using rockyou.txt (14 million real leaked passwords). The workflow is always: identify the hash algorithm → select the right cracking mode → run dictionary attack. Never store passwords as unsalted MD5.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "A password hash was pulled from /etc/shadow on a compromised system.\nYou need to crack it.\n\nStep 1 — Identify the hash algorithm:\n  hash-id hash.txt\n\nStep 2 — Run a dictionary attack:\n  john hash.txt\n\nThe cracked plaintext is the password."
        },
        "hash.txt": {
          type: "file",
          content: "5f4dcc3b5aa765d61d8327deb882cf99"
        }
      }
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
    objective: "This payload was XOR-encrypted with a single-byte key. Read 'key.txt' to find the key, then decrypt the payload with: xor cipher.bin <key>. The decrypted result is the password.",
    lesson: "XOR is the building block of stream ciphers, but single-byte XOR is trivially broken — just try all 256 possible key bytes. Many malware families (including early Mirai botnet variants) XOR-obfuscate strings and C2 addresses with a single key byte. Real tools: CyberChef, xortool. Find the key, XOR every byte, done.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "XOR-encrypted payload. Encrypted with a single-byte key.\nXOR is reversible: if A XOR key = B, then B XOR key = A.\n\nStep 1 — Find the key:\n  cat key.txt\n\nStep 2 — Decrypt the payload:\n  xor cipher.bin <key>\n\nThe decrypted text is the password."
        },
        "key.txt": {
          type: "file",
          content: "XOR key: 0x5A"
        },
        "cipher.bin": {
          type: "file",
          content: "3e3b283129333e3f"
        }
      }
    }
  },

  "level5@crypto": {
    password: "darkside",
    track: "crypto",
    objective: "This payload has two layers of encoding stacked on top of each other. You must peel them off outside-in. Layer 1 (outer) is ROT13. Layer 2 (inner) is Base64. Start with: rot13 onion.txt — the output will be a Base64 string. Then decode that string with: base64 -d <string>",
    lesson: "Real malware layers obfuscation: base64(XOR(gzip(payload))). You identify and reverse each layer systematically — always outside-in. This technique is called encoding chaining and appears constantly in CTF challenges and real malware analysis. Each layer must be identified before it can be stripped.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Two encodings are stacked on top of each other — peel them off outside-in.\n\nLayer 1 (outer): ROT13\nLayer 2 (inner): Base64\n\nStep 1:\n  rot13 onion.txt\n  → This reveals a Base64-encoded string\n\nStep 2:\n  base64 -d <the_string_from_step1>\n  → This reveals the password\n\nAlways work outside-in when peeling encoding layers."
        },
        "onion.txt": {
          type: "file",
          content: "L2yjnTIloT9wnj=="
        }
      }
    }
  },

  "level6@crypto": {
    password: "cipherlock",
    track: "crypto",
    objective: "Crypto track complete! Type: ssh guest@shellscape",
    lesson: "You can now identify and reverse encoding schemes that appear in real-world malware, CTF challenges, and penetration tests.",
    fs: {
      type: "dir",
      children: {
        "trophy.txt": {
          type: "file",
          content: "★  CRYPTO MASTER  ★\n\nSkills earned:\n  ✓ Base64         — identify and decode\n  ✓ ROT13          — Caesar cipher reversal\n  ✓ Hex encoding   — xxd + decode-hex\n  ✓ MD5 cracking   — hash-id + john dictionary attack\n  ✓ XOR cipher     — single-byte key reversal\n  ✓ Layered obfuscation — peel encodings systematically\n\nReturn: ssh guest@shellscape"
        }
      }
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  WEB TRACK  (5 levels)                                  ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@web": {
    password: null,
    track: "web",
    objective: "Every web server has a 'robots.txt' file that tells crawlers which paths to avoid — but it also hands attackers a map of hidden pages. Fetch it with: curl http://target.xyz/robots.txt — then visit one of the Disallowed paths to find the password.",
    lesson: "robots.txt is always the first file you check on a web target. Real targets have listed /admin, /.git, /backup, and /staging in their Disallow rules. The Disallowed paths are exactly what you want most — they're the ones the admin was trying to hide from search engines.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Target: http://target.xyz\n\nStep 1 — Fetch the robots file:\n  curl http://target.xyz/robots.txt\n\nStep 2 — Read the 'Disallow' entries. One of those paths contains credentials.\n  curl http://target.xyz/<path>\n\nThe password is inside that hidden page."
        }
      }
    },
    web: {
      "http://target.xyz/":              "<html><body><h1>Welcome to Target Corp</h1></body></html>",
      "http://target.xyz/robots.txt":    "User-agent: *\nDisallow: /admin\nDisallow: /secret-backup\nDisallow: /.git\nDisallow: /api/internal",
      "http://target.xyz/admin":         "403 Forbidden",
      "http://target.xyz/secret-backup": "# Backup credentials - DO NOT COMMIT\nftp_user: ftpadmin\nftp_pass: webmaster22\ndb_pass:  webmaster22",
      "http://target.xyz/.git":          "403 Forbidden — but .git exposure = full source code dump via git-dumper!",
      "http://target.xyz/api/internal":  "401 Unauthorized — API token required."
    }
  },

  "level1@web": {
    password: "webmaster22",
    track: "web",
    objective: "HTTP response headers reveal what software is running on the server — without touching the application itself. Fetch just the headers with: curl -I http://target.xyz/ — Find the 'Server' header. Take the version number and remove all dots to get the password (e.g. Apache/2.4.49 → apache2449).",
    lesson: "HTTP headers leak critical intel: server software, version numbers, backend frameworks. 'Server: Apache/2.4.49' maps directly to CVE-2021-41773 (path traversal + unauthenticated RCE). 'X-Powered-By: PHP/7.2' reveals an end-of-life version. Headers are free recon — check them before touching anything else.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Server banners in HTTP headers map directly to known CVEs.\n\nFetch only the response headers (no body):\n  curl -I http://target.xyz/\n\nFind the 'Server:' line. Take the version number and remove all dots.\nExample: Apache/2.4.49 → password is: apache2449\n\n⚠ The Apache version shown here has CVE-2021-41773 — a critical real-world RCE."
        }
      }
    },
    webHeaders: {
      "http://target.xyz/": {
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
    objective: "The web server has hidden directories that don't appear in any links. Use 'gobuster http://target.xyz/' to brute-force common directory names. One of the discovered paths leads to an exposed admin console. Fetch it with 'curl' to find the password.",
    lesson: "gobuster and dirsearch fuzz web servers with wordlists of thousands of common paths. Developers routinely forget to protect /admin, /dev, /backup, /.env, /api/v1. Discovering an exposed admin panel or debug page is often the initial foothold in a real pentest.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "Hidden directories host admin panels and debug interfaces — but they don't appear in any links.\n\nBrute-force common directory names:\n  gobuster http://target.xyz/\n\nWhen you find something interesting (status 200), fetch it:\n  curl http://target.xyz/<path>\n\nThe password is inside the hidden page."
        }
      }
    },
    web: {
      "http://target.xyz/admin-console": "=== ADMIN CONSOLE ===\nStatus: DEBUG MODE ON\nDB connection: active\nAdmin pass: supersecret\nWARNING: This page should NOT be public!"
    },
    gobusterRes: {
      "http://target.xyz/": [
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
    objective: "A session cookie was captured from an authenticated user. Run 'cookies http://target.xyz/' to inspect it. The 'user_session' cookie value is Base64-encoded JSON. Decode it with: base64 -d <value> — the password field inside the JSON is the answer.",
    lesson: "Session cookies often store Base64-encoded JSON user data. Poorly built apps validate that the cookie exists but not what it contains. Attackers decode the JSON, change 'role':'user' to 'role':'admin', re-encode it, and replay the modified cookie. This is Broken Access Control — OWASP Top 10 #1.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "A session cookie was captured from an authenticated user session.\n\nStep 1 — View the cookies:\n  cookies http://target.xyz/\n\nStep 2 — Look for the 'user_session' cookie. Its value is Base64-encoded JSON.\n  base64 -d <cookie_value>\n\nStep 3 — Read the JSON. The 'password' field is the answer."
        }
      }
    },
    cookieData: {
      "http://target.xyz/": {
        "PHPSESSID":    "abc123def456",
        "user_session": "eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwicGFzc3dvcmQiOiJjb29raWVtb25zdGVyIiwiZXhwIjoxNzAwMDAwMDAwfQ=="
      }
    }
  },

  "level4@web": {
    password: "cookiemonster",
    track: "web",
    objective: "Web track complete! Type: ssh guest@shellscape",
    lesson: "Web recon fundamentals: robots.txt enumeration, HTTP header fingerprinting, directory brute forcing, and cookie analysis. These are Steps 1-4 of the OWASP web application testing methodology.",
    fs: {
      type: "dir",
      children: {
        "trophy.txt": {
          type: "file",
          content: "★  WEB MASTER  ★\n\nSkills earned:\n  ✓ robots.txt — hidden path discovery\n  ✓ curl -I    — header fingerprinting + CVE mapping\n  ✓ gobuster   — directory & file brute forcing\n  ✓ cookies    — session token analysis + privilege escalation\n\nNext steps (beyond this game):\n  → SQL injection (sqlmap)\n  → Cross-Site Scripting (XSS)\n  → SSRF, XXE, IDOR, CSRF\n  → JWT attacks\n\nReturn: ssh guest@shellscape"
        }
      }
    }
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  FORENSICS TRACK  (5 levels)                            ║
  // ╚══════════════════════════════════════════════════════════╝

  "level0@forensics": {
    password: null,
    track: "forensics",
    objective: "File extensions can be faked. Run 'file *' on all files here to reveal their TRUE type based on magic bytes. One file claims to be a .txt but is actually something very different. The first word of its real file type (lowercase) is the password.",
    lesson: "The 'file' command reads magic bytes — the first bytes in a file that identify its real format, regardless of what the extension says. Attackers rename malware.exe to invoice.pdf. Forensic analysts NEVER trust extensions. A JPEG always starts 0xFF 0xD8; an ELF binary starts 0x7F 45 4C 46. One of these files is not what it seems.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "File extensions are just names — they can be faked.\nThe 'file' command ignores the extension and reads the actual file content.\n\nRun 'file *' to identify the true type of every file.\nOne file is disguised. Find the impostor.\n\nThe first word of its real type (lowercase) is the password.\nExample: if 'file' says 'ELF executable', the password would be 'elf'."
        },
        "vacation.jpg": {
          type: "file",
          content: "\xFF\xD8\xFF\xE0 [valid JPEG image data]"
        },
        "report.pdf": {
          type: "file",
          content: "%PDF-1.4 [valid PDF document]"
        },
        "archive.zip": {
          type: "file",
          content: "PK\x03\x04 [valid ZIP archive]"
        },
        "malware.txt": {
          type: "file",
          content: "MZ\x90\x00 [Windows PE executable disguised as text!]"
        }
      }
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
    objective: "This binary file came from a suspicious device. Run 'strings firmware.bin' to extract all readable text embedded inside it. One of the extracted lines contains 'admin_pass=' — that value is the password.",
    lesson: "'strings' extracts printable character sequences from any file — compiled binaries, firmware images, memory dumps. Malware analysts run it as their FIRST step. Hardcoded IPs, C2 URLs, passwords, registry keys, and mutex names are routinely exposed this way. It's how analysts first mapped Stuxnet's targeted PLCs.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "This firmware image came from a suspicious embedded device.\nBinaries often contain hardcoded credentials that were never meant to be found.\n\nExtract all readable strings:\n  strings firmware.bin\n\nSearch the output for 'admin_pass='. That value is the password."
        },
        "firmware.bin": {
          type: "file",
          content: "\x7fELF\x02\x01 [binary ELF data]"
        }
      }
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
    objective: "This file was carved from a memory dump. It looks like random characters — but it's actually hex-encoded data. Use 'xxd secret.dat' to view it as a proper hex dump, then 'decode-hex secret.dat' to convert the hex into readable ASCII. The result is the password.",
    lesson: "Hex analysis is core to digital forensics and malware reverse engineering. Memory dumps, network captures, and disk images all require hex-level inspection. Recognising printable ASCII ranges (0x20–0x7E) in raw hex output is a skill that separates junior from senior analysts.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "This file was carved from a memory dump. It looks like gibberish.\nIt's actually hex-encoded ASCII data — a common obfuscation technique.\n\nStep 1 — Inspect it as a hex dump:\n  xxd secret.dat\n\nStep 2 — Decode the hex to ASCII:\n  decode-hex secret.dat\n\nThe decoded text is the password."
        },
        "secret.dat": {
          type: "file",
          content: "68657866696e646572"
        }
      }
    }
  },

  "level3@forensics": {
    password: "hexfinder",
    track: "forensics",
    objective: "This photo was shared by a suspect. Digital photos often contain hidden metadata — GPS location, device model, and more. Run 'exif photo.jpg' to read it. The 'Comment' field in the EXIF data is the password.",
    lesson: "EXIF metadata embeds GPS coordinates, device model, creation timestamps, and comments directly inside image files. Journalists have been de-anonymized via GPS coordinates in EXIF. Whistleblowers tracked. In forensic investigations, EXIF proves when and where a photo was taken. Always strip metadata before sharing sensitive images.",
    fs: {
      type: "dir",
      children: {
        "readme.txt": {
          type: "file",
          content: "This photo was shared publicly by a suspect.\nDigital photos contain hidden EXIF metadata: GPS location, camera model, timestamps, and more.\n\nInvestigate it:\n  exif photo.jpg\n\nFind the 'Comment' field. Its value is the password."
        },
        "photo.jpg": {
          type: "file",
          content: "\xFF\xD8\xFF\xE1 [JPEG with EXIF data embedded]"
        }
      }
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

  "doesnt@exist": {
    password: null,          // set by engine.js restoreEliteId / triggerEliteFlow
    track: null,
    objective: null,
    lesson: null,
    fs: {
      type: "dir",
      children: {
        "report.txt": {
          type: "file",
          content: "Internal Incident Log\n\nSystem snapshot incomplete. Scan artifacts remain.\n\nDetected anomalies in network activity. Unusual service behavior observed.\n\nBackup routines appear interrupted. Some web resources may still be accessible."
        },
        ".cache": {
          type: "dir",
          children: {
            "apt": {
              type: "dir",
              children: {
                "pkgcache.bin": {
                  type: "file",
                  content: "[binary package cache — partial]\nlast updated: 2024-02-11 03:14:22\nentries: 2841 / expected: 4096\ntruncated — possible interrupted update"
                }
              }
            },
            "wget-hsts": {
              type: "file",
              content: "# HSTS Known Hosts — wget\n# Generated by wget\nlocalhost\t0\t1\t0"
            },
            "motd.legal-displayed": {
              type: "file",
              content: ""
            },
            "session.log": {
              type: "file",
              content: "session opened: 2024-02-11 03:09:41 uid=1001\nlast command: cat /var/www/backup/dump.dat\nsession closed: 2024-02-11 03:31:07"
            }
          }
        },
        ".history": {
          type: "dir",
          children: {
            "bash_history": {
              type: "file",
              content: "nmap -sV 192.168.1.0/24\nssh root@192.168.1.50\ncd /var/www\nls -la\ncat /var/www/backup/dump.dat\ncurl http://localhost/config.php\ncd /var/www/backup/old\ncat notes.txt\ncat backup.log\nls -la /tmp\ncat /tmp/svc_dump.bin\nnmap -p 1-65535 localhost\ngrep -r password /var/www/\nhistory -c"
            }
          }
        },
        "tmp": {
          type: "dir",
          children: {
            "svc_dump.bin": {
              type: "file",
              content: "[partial process dump — svc_monitor pid 1847]\nheap segment: 0x55a3c2e10000\nstack trace incomplete — signal SIGKILL received\ndump aborted at 2024-02-11 03:28:54"
            },
            "cron_stderr.txt": {
              type: "file",
              content: "/bin/sh: 1: /opt/backup_run.sh: not found\n/bin/sh: 1: /opt/backup_run.sh: not found\n/bin/sh: 1: /opt/backup_run.sh: not found"
            },
            ".lock": {
              type: "file",
              content: "pid=2204\nacquired=2024-02-11 03:10:05\nstale=yes"
            }
          }
        },
        "var": {
          type: "dir",
          children: {
            "www": {
              type: "dir",
              children: {
                "html": {
                  type: "dir",
                  children: {
                    "index.php": {
                      type: "file",
                      content: "<?php\n// Site entry point\nrequire_once 'config.php';\n$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);\nif ($conn->connect_error) { die('Connection failed'); }\n?>\n<html><head><title>Internal Portal</title></head>\n<body><h2>System Status</h2><p>Service operational.</p></body></html>"
                    },
                    "config.php": {
                      type: "file",
                      content: "<?php\n// Database configuration\ndefine('DB_HOST', 'localhost');\ndefine('DB_USER', 'webapp');\ndefine('DB_PASS', 'Wk3!p9zX');\ndefine('DB_NAME', 'portal_db');\ndefine('APP_ENV', 'production');\n// TODO: move creds to env before next deploy\n?>"
                    },
                    "robots.txt": {
                      type: "file",
                      content: "User-agent: *\nDisallow: /backup/\nDisallow: /admin/\nDisallow: /config.php\nDisallow: /tmp/"
                    },
                    "README.md": {
                      type: "file",
                      content: "# Internal Web Portal\n\nDeployment: manual\nLast updated: 2024-02-08\n\n## Notes\n- PHP 7.4, Apache 2.4\n- DB backup runs nightly via cron (currently broken)\n- Do not expose /backup/ to public\n- config.php should not be web-accessible"
                    }
                  }
                },
                "backup": {
                  type: "dir",
                  children: {
                    "web.conf": {
                      type: "file",
                      content: "ServerName localhost\nDocumentRoot /var/www/html\nErrorLog /var/log/apache2/error.log\nCustomLog /var/log/apache2/access.log combined"
                    },
                    "dump.dat": {
                      // base64 of ROT13-encoded plaintext. Patched at runtime by engine.js.
                      type: "file",
                      content: "-- backup fragment --\nanVuZyBsYmggZnJyIHZmIGFiZyBqdW5nIHZnIGZycnpmLi4uCi91YnpyL1JZVkdSVlEvem5sb3Iucmt2ZmdmICBjbmZmamJlcTogUUxBTlpWUF9DTkZG\n-- end --"
                    },
                    "old": {
                      type: "dir",
                      children: {
                        "old.conf": {
                          type: "file",
                          content: "# Apache vhost config — archived 2024-01-30\nServerName portal.internal\nDocumentRoot /var/www/html\nErrorLog /var/log/apache2/portal_error.log\n# SSL disabled — cert expired 2023-12-01\n# ProxyPass /api http://127.0.0.1:8080"
                        },
                        "backup.log": {
                          type: "file",
                          content: "2024-01-28 02:00:01 [INFO] backup started\n2024-01-28 02:00:04 [INFO] archiving /var/www/html...\n2024-01-28 02:01:33 [ERROR] write failed: disk quota exceeded\n2024-01-29 02:00:01 [INFO] backup started\n2024-01-29 02:00:03 [ERROR] /opt/backup_run.sh: no such file\n2024-01-30 02:00:01 [INFO] backup started\n2024-01-30 02:00:03 [ERROR] /opt/backup_run.sh: no such file"
                        },
                        "notes.txt": {
                          type: "file",
                          content: "Backup script moved during Jan migration — cron not updated.\nDisk filled up on the 28th, partial archive may be corrupt.\nweb.conf archived here before switching to nginx (never finished).\nTODO: verify dump.dat integrity — last rotation was incomplete."
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "maybe.exists": {
          type: "file",
          content: "__protected__"
        }
      }
    },
    net: {
      "localhost": [
        { port: 21,  state: "open",   service: "ftp"    },
        { port: 22,  state: "open",   service: "ssh"    },
        { port: 25,  state: "open",   service: "smtp"   },
        { port: 53,  state: "open",   service: "domain" },
        { port: 80,  state: "open",   service: "http"   },
        { port: 110, state: "open",   service: "pop3"   },
        { port: 143, state: "open",   service: "imap"   },
        { port: 443, state: "closed", service: "https"  }
      ]
    },
    web: {
      "http://localhost": `<!DOCTYPE html>
<html>
<head><title>Apache2 Ubuntu Default Page</title></head>
<body>
<h1>Apache2 Ubuntu Default Page</h1>
<p>It works!</p>
<p>This is the default welcome page used to test correct operation of the Apache2 server
after installation on Ubuntu systems. It is based on the equivalent page on Debian,
from which the Ubuntu Apache packaging is derived.</p>
<p>If you can read this page, it means that the Apache HTTP server installed at this
site is working properly. You should <b>replace this file</b> (located at
<tt>/var/www/html/index.html</tt>) before continuing to operate your server.</p>
<hr/>
<p><small>Server at localhost Port 80 — maintenance snapshot may still be present in var/www/.</small></p>
</body>
</html>`
    },
    // rot13Out is patched by engine.js at runtime with real eliteId + dynPass
    rot13Out: {
      "var/www/backup/dump.dat": "/home/ELITEID/maybe.exists  password: DYNAMIC_PASS"
    }
  },

  "level4@forensics": {
    password: "metadataleek",
    track: "forensics",
    objective: "Forensics track complete! Type: ssh guest@shellscape",
    lesson: "Digital forensics toolkit: magic byte identification, strings extraction, hex analysis, and metadata forensics. Tools used in incident response, malware analysis, and CTF competitions every day.",
    fs: {
      type: "dir",
      children: {
        "trophy.txt": {
          type: "file",
          content: "★  FORENSICS MASTER  ★\n\nSkills earned:\n  ✓ file     — magic byte analysis, defeating fake extensions\n  ✓ strings  — hardcoded credential extraction from binaries\n  ✓ xxd      — hex dump analysis and data carving\n  ✓ exif     — metadata forensics and GPS location exposure\n\nReal-world tools:\n  → Malware analysis: ANY.RUN, VirusTotal, Ghidra\n  → Incident response: Volatility, Autopsy\n  → OSINT via photo metadata: ExifTool, Jeffrey's Exif Viewer\n\nReturn: ssh guest@shellscape"
        }
      }
    }
  }

});
