//  COMMANDS
//  Each handler: (level, arg) → { text, cls } | null
//
//  Commands:
//    ls / ls -a / ls -l   list directory contents
//    cd <dir> / cd ..     navigate into / out of directories
//    cat <file>           print file contents
//    pwd                  print working directory
//    whoami               print current user
//    echo <text>          print text
//    grep <word> <file|*> search file(s) for a word
//    find <path> -name    find files matching pattern
//    env                  list environment variables
//    ls -l                file permissions (SUID detection)
//    rot13                ROT13 decode
//    xxd                  hex dump viewer
//    decode-hex           hex string → ASCII
//    hash-id              identify hash algorithm
//    john                 simulated dictionary attack
//    xor                  XOR decryption
//    base64 -d            decode string directly (no file)
//    curl                 HTTP GET simulation
//    curl -I              HTTP header inspection
//    gobuster             directory brute-force simulation
//    cookies              session cookie inspector
//    file                 magic byte / file type identifier
//    strings              printable string extractor
//    exif                 EXIF metadata reader
//    netstat              active connection lister
//    whois                domain WHOIS lookup
//    dig                  DNS record enumeration
//    nmap                 port scanner (basic + -sV)

// ── Per-session working directory ────────────────────────────
// currentPath is an array of directory names relative to fs root.
// e.g. [] = root home dir, ["var","tmp"] = /home/user/var/tmp
let currentPath = [];

// Walk the fs tree from the level root, following currentPath.
function getFSNode(level, pathParts) {
  if (!level.fs) return null;
  let node = level.fs;
  for (const part of pathParts) {
    if (!node.children || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

// Reset working directory when switching levels (called externally).
function resetPath() { currentPath = []; }

// Build a display path string like /home/user or /home/user/var/tmp
function buildDisplayPath(levelKey) {
  const user = levelKey.split("@")[0];
  const base = `/home/${user}`;
  return currentPath.length === 0 ? base : base + "/" + currentPath.join("/");
}

function rot13str(s) {
  return s.replace(/[a-zA-Z]/g, c => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function hexToAscii(hex) {
  const clean = hex.replace(/[\s:]/g, "");
  let out = "";
  for (let i = 0; i < clean.length - 1; i += 2) {
    const byte = parseInt(clean.slice(i, i + 2), 16);
    if (!isNaN(byte)) out += byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".";
  }
  return out;
}

function formatHexDump(content) {
  const bytes = [];
  const clean = content.replace(/[\s:]/g, "");
  const isHex = /^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0;

  if (isHex) {
    for (let i = 0; i < clean.length; i += 2)
      bytes.push(parseInt(clean.slice(i, i + 2), 16));
  } else {
    for (let i = 0; i < content.length; i++)
      bytes.push(content.charCodeAt(i) & 0xFF);
  }

  const lines = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.slice(off, off + 16);
    const addr  = off.toString(16).padStart(8, "0");
    const hex1  = chunk.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join(" ");
    const hex2  = chunk.slice(8).map(b => b.toString(16).padStart(2, "0")).join(" ");
    const ascii = chunk.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : ".").join("");
    lines.push(`${addr}: ${hex1.padEnd(23)}  ${hex2.padEnd(23)}  |${ascii}|`);
  }
  return lines.join("\n");
}

const COMMANDS = {

  help() {
    return { cls: "info", text: `
LINUX BASICS
  ls / ls -a / ls -l     – list files (all / long format)
  cd <dir>               – change into a directory
  cd ..                  – go up one directory
  cat <file>             – print file contents
  pwd                    – print working directory
  whoami                 – print current user
  echo <text>            – print text to terminal
  grep <word> <file|*>   – search for word in file(s)
  find <path> -name <pat>– find files matching pattern
  env                    – list environment variables

NETWORK RECON
  nmap <host>            – port scan
  nmap -sV <host>        – port + service version scan
  netstat                – list active connections
  whois <domain>         – WHOIS domain lookup
  dig <domain> [type]    – DNS record lookup

CRYPTOGRAPHY
  base64 <file>          – decode base64 file
  base64 -d <string>     – decode base64 string directly
  rot13 <file>           – ROT13 decode file
  xxd <file>             – hex dump viewer
  decode-hex <file>      – decode hex string → ASCII
  hash-id <file>         – identify hash algorithm
  john <hashfile>        – dictionary attack on hash
  xor <file> <key>       – XOR decrypt (key e.g. 0x5A)

WEB RECON
  curl <url>             – fetch a URL
  curl -I <url>          – fetch HTTP headers only
  gobuster <url>         – brute-force hidden directories
  cookies <url>          – inspect session cookies

FORENSICS
  file <filename>        – identify true file type
  file *                 – identify all files at once
  strings <file>         – extract printable strings
  exif <file>            – read EXIF metadata

TERMINAL
  clear                  – clear the screen
  ssh <user@host>        – connect to a level
  report                 – report a bug / contact developer
  help                   – show this reference
`.trim() };
  },

  cd(level, arg) {
    if (!arg || arg === "~") {
      currentPath = [];
      return { text: "", cls: "out" };
    }

    if (arg === "..") {
      if (currentPath.length === 0) return { text: "cd: already at home directory", cls: "err" };
      currentPath = currentPath.slice(0, -1);
      return null; // silent success like real bash
    }

    // Handle absolute paths starting with / by treating as relative from root
    const parts = arg.replace(/^\/+/, "").split("/").filter(Boolean);
    const testPath = [...currentPath, ...parts];
    const node = getFSNode(level, testPath);

    if (!node)            return { text: `cd: ${arg}: No such file or directory`, cls: "err" };
    if (node.type !== "dir") return { text: `cd: ${arg}: Not a directory`, cls: "err" };

    currentPath = testPath;
    return null; // silent success
  },

  ls(level, arg) {
    const flags      = (arg || "").split(" ").filter(a => a.startsWith("-")).join("");
    const showHidden = flags.includes("a");
    const longFmt    = flags.includes("l");

    // Get the current directory node from the fs tree, fallback to flat files
    const node = getFSNode(level, currentPath);
    let names;

    if (node && node.children) {
      names = Object.keys(node.children).filter(f => showHidden || !f.startsWith("."));
      // Append "/" suffix to directories for visual clarity
      names = names.map(f => node.children[f].type === "dir" ? f + "/" : f);
    } else {
      // Fallback: flat files map (legacy levels)
      names = Object.keys(level.files).filter(f => showHidden || !f.startsWith("."));
    }

    if (names.length === 0) return { text: "(empty directory)", cls: "dim" };

    if (longFmt) {
      const perms = level.permissions || {};
      const defaultPerm = (f) => {
        if (f.endsWith("/"))   return "drwxr-xr-x  2 user  user     0";
        if (f.endsWith(".sh")) return "-rwxr-xr-x  1 user  user   128";
        return "-rw-r--r--  1 user  user   256";
      };
      const lines = ["total " + names.length * 8];
      // Strip trailing "/" when looking up permissions
      names.forEach(f => {
        const key = f.endsWith("/") ? f.slice(0, -1) : f;
        lines.push((perms[key] || defaultPerm(f)) + "  " + f);
      });
      return { text: lines.join("\n"), cls: "out" };
    }

    return { text: names.join("  "), cls: "out" };
  },

  cat(level, arg) {
    if (!arg) return { text: "Usage: cat <file>", cls: "err" };

    // Try resolving relative to current directory in fs tree
    if (level.fs) {
      const parts = arg.split("/").filter(Boolean);
      const fileParts = [...currentPath, ...parts];
      const node = getFSNode(level, fileParts);
      if (node) {
        if (node.type === "dir") return { text: `cat: ${arg}: Is a directory`, cls: "err" };
        if (!node.content)       return { text: "(empty file)", cls: "dim" };
        return { text: node.content, cls: "out" };
      }
      // not found in tree
      return { text: `cat: ${arg}: No such file or directory`, cls: "err" };
    }

    // Fallback: flat files map
    if (!(arg in level.files)) return { text: `cat: ${arg}: No such file or directory`, cls: "err" };
    const c = level.files[arg];
    if (c === null) return { text: `cat: ${arg}: Is a directory`, cls: "err" };
    if (c === "")   return { text: "(empty file)", cls: "dim" };
    return { text: c, cls: "out" };
  },

  pwd() {
    return { text: buildDisplayPath(currentLevelKey), cls: "out" };
  },

  whoami() {
    return { text: currentLevelKey.split("@")[0], cls: "out" };
  },

  echo(_l, arg) {
    return { text: arg || "", cls: "out" };
  },

  grep(level, arg) {
    if (!arg) return { text: "Usage: grep <word> <file|*>", cls: "err" };
    const parts  = arg.trim().split(/\s+/);
    const word   = parts[0];
    const target = parts[1];

    const searchFile = (name, content) => {
      if (!content) return [];
      return String(content).split("\n")
        .filter(l => l.toLowerCase().includes(word.toLowerCase()))
        .map(l => `${name}: ${l}`);
    };

    let results = [];
    if (!target || target === "*") {
      Object.entries(level.files).forEach(([f, c]) => results.push(...searchFile(f, c)));
    } else {
      if (!(target in level.files)) return { text: `grep: ${target}: No such file or directory`, cls: "err" };
      results = searchFile(target, level.files[target]);
    }

    if (results.length === 0) return { text: "(no matches)", cls: "dim" };
    return { text: results.join("\n"), cls: "warn" };
  },

  find(level, arg) {
    if (!arg) return { text: "Usage: find <path> -name <pattern>", cls: "err" };

    const nameMatch = arg.match(/-name\s+"?([^\s"]+)"?/);
    if (!nameMatch) return { text: "Usage: find <path> -name <pattern>", cls: "err" };

    const pattern = nameMatch[1].replace(/\./g, "\\.").replace(/\*/g, ".*");
    const regex   = new RegExp("^" + pattern + "$", "i");

    // Search the full flat files map (find always searches recursively)
    const found = Object.keys(level.files).filter(f => {
      const basename = f.replace(/\/$/, "").split("/").pop();
      return regex.test(basename);
    });

    if (found.length === 0) return { text: "(no files found)", cls: "dim" };

    // Display as full paths
    const user = currentLevelKey.split("@")[0];
    return { text: found.map(f => `/home/${user}/` + f).join("\n"), cls: "out" };
  },

  env(level) {
    const vars = level.env_vars;
    if (!vars) return { text: "(no environment variables set on this level)", cls: "dim" };
    const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
    return { text: lines.join("\n"), cls: "warn" };
  },

  nmap(level, arg) {
    if (!arg) return { text: "Usage: nmap [-sV] <host>", cls: "err" };
    if (!level.net) return { text: `nmap: Note: Host seems down. Try: nmap -sV ${arg}`, cls: "err" };

    const versionScan = arg.includes("-sV");
    const host = arg.replace(/-sV\s*/g, "").trim();
    const ports = level.net[host];

    if (!ports) return { text: `nmap: ${host}: No route to host`, cls: "err" };

    const header = [
      `Starting Nmap 7.94 ( https://nmap.org )`,
      `Nmap scan report for ${host}`,
      `Host is up (0.0021s latency).`,
      "",
      versionScan
        ? "PORT      STATE     SERVICE     VERSION"
        : "PORT      STATE     SERVICE"
    ];

    const rows = ports.map(p => {
      const port    = String(p.port + "/tcp").padEnd(9);
      const state   = p.state.padEnd(9);
      const service = p.service.padEnd(11);
      return versionScan && p.version
        ? `${port} ${state} ${service} ${p.version}`
        : `${port} ${state} ${service}`;
    });

    const footer = [
      "",
      `Nmap done: 1 IP address (1 host up) scanned in 1.23 seconds`
    ];

    return { text: [...header, ...rows, ...footer].join("\n"), cls: "warn" };
  },

  netstat(level, arg) {
    if (!level.netstatData) return { text: "netstat: no network connections on this level", cls: "dim" };
    const header = "Proto  Local Address          Foreign Address        State        PID/Program";
    const sep    = "─────  ─────────────────────  ─────────────────────  ───────────  ─────────────";
    const rows = level.netstatData.map(c =>
      [
        c.proto.padEnd(6),
        c.local.padEnd(22),
        c.foreign.padEnd(22),
        c.state.padEnd(12),
        c.pid
      ].join(" ")
    );
    return { text: [header, sep, ...rows].join("\n"), cls: "warn" };
  },

  whois(level, arg) {
    if (!arg) return { text: "Usage: whois <domain>", cls: "err" };
    if (!level.whoisData || !level.whoisData[arg]) {
      return { text: `whois: ${arg}: no WHOIS data available on this level`, cls: "err" };
    }
    return { text: level.whoisData[arg].join("\n"), cls: "out" };
  },

  dig(level, arg) {
    if (!arg) return { text: "Usage: dig <domain> [record_type]", cls: "err" };
    const parts   = arg.trim().split(/\s+/);
    const domain  = parts[0];
    const recType = (parts[1] || "A").toUpperCase();

    if (!level.dnsData || !level.dnsData[domain]) {
      return { text: `dig: ${domain}: NXDOMAIN — no records found`, cls: "err" };
    }

    const records = level.dnsData[domain];
    const lines = [
      `; <<>> DiG 9.18.4 <<>> ${domain} ${recType}`,
      `;; ANSWER SECTION:`,
      ""
    ];

    const types = recType === "ANY" ? Object.keys(records) : [recType];
    let found = false;

    types.forEach(t => {
      const vals = records[t];
      if (!vals || vals.length === 0) return;
      found = true;
      vals.forEach(v => lines.push(`${domain.padEnd(24)} 300  IN  ${t.padEnd(5)} ${v}`));
    });

    if (!found) lines.push(`;; (no records of type ${recType})`);
    lines.push("", ";; Query time: 4 msec", `;; SERVER: 8.8.8.8`);
    return { text: lines.join("\n"), cls: "out" };
  },

  base64(level, arg) {
    if (!arg) return { text: "Usage: base64 <file>  OR  base64 -d <string>", cls: "err" };

    if (arg.startsWith("-d ")) {
      const str = arg.slice(3).trim();
      try {
        return { text: atob(str), cls: "success" };
      } catch {
        return { text: "base64: invalid base64 string", cls: "err" };
      }
    }

    if (!(arg in level.files)) return { text: `base64: ${arg}: No such file`, cls: "err" };
    try {
      return { text: atob(level.files[arg].trim()), cls: "success" };
    } catch {
      return { text: "base64: file content is not valid base64", cls: "err" };
    }
  },

  rot13(level, arg) {
    if (!arg)                 return { text: "Usage: rot13 <file>", cls: "err" };
    if (!(arg in level.files))return { text: `rot13: ${arg}: No such file`, cls: "err" };
    if (level.rot13Out?.[arg]) return { text: level.rot13Out[arg], cls: "success" };
    return { text: rot13str(level.files[arg]), cls: "success" };
  },

  xxd(level, arg) {
    if (!arg)                 return { text: "Usage: xxd <file>", cls: "err" };
    if (!(arg in level.files))return { text: `xxd: ${arg}: No such file`, cls: "err" };
    const content = level.files[arg];
    if (!content)             return { text: "(empty file)", cls: "dim" };

    const dump = formatHexDump(content);
    const tip  = /^[0-9a-fA-F\s]+$/.test(content.replace(/\s/g,"")) &&
                 content.replace(/\s/g,"").length % 2 === 0
      ? "\nTip: this looks like a hex-encoded string. Try: decode-hex " + arg
      : "";
    return { text: dump + tip, cls: "out" };
  },

  "decode-hex"(level, arg) {
    if (!arg)                 return { text: "Usage: decode-hex <file>", cls: "err" };
    if (!(arg in level.files))return { text: `decode-hex: ${arg}: No such file`, cls: "err" };
    const ascii = hexToAscii(level.files[arg]);
    if (!ascii) return { text: "decode-hex: could not decode — invalid hex data", cls: "err" };
    return { text: ascii, cls: "success" };
  },

  "hash-id"(level, arg) {
    if (!arg)                 return { text: "Usage: hash-id <file>", cls: "err" };
    if (!(arg in level.files))return { text: `hash-id: ${arg}: No such file`, cls: "err" };
    const h = level.files[arg].trim();

    const lines = [`Analyzing: ${h}`, ""];
    if (/^[0-9a-f]{32}$/i.test(h)) {
      lines.push("[+] Possible algorithms:");
      lines.push("    MD5         (most likely — 32 hex chars, very common)");
      lines.push("    MD4");
      lines.push("    NTLM");
      lines.push("");
      lines.push("[!] MD5 is cryptographically broken. Crack with: john " + arg);
    } else if (/^[0-9a-f]{40}$/i.test(h)) {
      lines.push("[+] SHA-1 (40 hex chars)");
      lines.push("[!] SHA-1 is deprecated. Crack with: john " + arg);
    } else if (/^[0-9a-f]{64}$/i.test(h)) {
      lines.push("[+] SHA-256 (64 hex chars) — stronger, but still crackable via wordlists");
    } else if (h.startsWith("$2b$") || h.startsWith("$2y$")) {
      lines.push("[+] bcrypt (cost factor embedded) — resistant to GPU cracking");
    } else if (h.startsWith("$6$")) {
      lines.push("[+] SHA-512crypt — Linux /etc/shadow format");
    } else {
      lines.push("[-] Unknown hash format");
    }
    return { text: lines.join("\n"), cls: "warn" };
  },

  john(level, arg) {
    if (!arg)                 return { text: "Usage: john <hashfile>", cls: "err" };
    if (!level.johnCrack || !level.johnCrack[arg]) {
      return { text: `john: ${arg}: no crackable hash found on this level`, cls: "err" };
    }
    const { type, hash, plain, wordlist, time } = level.johnCrack[arg];
    const lines = [
      `Using default input encoding: UTF-8`,
      `Loaded 1 password hash (${type} [MD5 128/128 AVX 4x3])`,
      `Using wordlist: /usr/share/wordlists/${wordlist}`,
      `Press CTRL-C to abort, almost any other key for status`,
      ``,
      `[+] Running dictionary attack...`,
      `[+] Trying top 1000 most common passwords...`,
      ``,
      `${plain.padEnd(20)} (${arg})`,
      ``,
      `1g 0:${time} DONE (2024-01-01 12:00) 100% guesses`,
      `Session completed.`
    ];
    return { text: lines.join("\n"), cls: "success" };
  },

  xor(level, arg) {
    if (!arg) return { text: "Usage: xor <file> <key>  (key e.g. 0x5A or 90)", cls: "err" };
    const parts = arg.trim().split(/\s+/);
    if (parts.length < 2) return { text: "Usage: xor <file> <key>", cls: "err" };

    const [filename, keyStr] = parts;
    if (!(filename in level.files)) return { text: `xor: ${filename}: No such file`, cls: "err" };

    const key = keyStr.startsWith("0x") || keyStr.startsWith("0X")
      ? parseInt(keyStr, 16)
      : parseInt(keyStr, 10);

    if (isNaN(key)) return { text: `xor: invalid key '${keyStr}'`, cls: "err" };

    const hex   = level.files[filename].replace(/\s/g, "");
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2)
      bytes.push(parseInt(hex.slice(i, i + 2), 16));

    const result = bytes.map(b => {
      const xb = b ^ key;
      return xb >= 32 && xb < 127 ? String.fromCharCode(xb) : ".";
    }).join("");

    return { text: `XOR result (key=0x${key.toString(16).toUpperCase().padStart(2,"0")}): ${result}`, cls: "success" };
  },

  curl(level, arg) {
    if (!arg) return { text: "Usage: curl <url>  OR  curl -I <url>", cls: "err" };

    const headerMode = arg.startsWith("-I ");
    const url = headerMode ? arg.slice(3).trim() : arg.trim();

    if (headerMode) {
      const headers = level.webHeaders?.[url];
      if (!headers) return { text: `curl: (6) Could not resolve host: ${url.replace("http://","").split("/")[0]}`, cls: "err" };
      const lines = Object.entries(headers).map(([k, v]) => k === "HTTP/1.1" ? `HTTP/1.1 ${v}` : `${k}: ${v}`);
      return { text: lines.join("\n"), cls: "out" };
    }

    const body = level.web?.[url];
    if (!body) return { text: `curl: (6) Could not resolve host: ${url.replace(/https?:\/\//,"").split("/")[0]}`, cls: "err" };
    return { text: body, cls: "out" };
  },

  gobuster(level, arg) {
    if (!arg) return { text: "Usage: gobuster <url>", cls: "err" };
    const url = arg.trim();
    const res = level.gobusterRes?.[url];
    if (!res) return { text: `gobuster: no web target configured at ${url}`, cls: "err" };

    const header = [
      `Gobuster v3.6`,
      `[+] Url:         ${url}`,
      `[+] Wordlist:    /usr/share/wordlists/dirb/common.txt`,
      `[+] Status codes:200,204,301,302,307,401,403`,
      `[+] Timeout:     10s`,
      ``,
      `Starting gobuster...`,
      `──────────────────────────────────────────`,
    ];
    return { text: [...header, ...res, "", "Finished."].join("\n"), cls: "warn" };
  },

  cookies(level, arg) {
    if (!arg) return { text: "Usage: cookies <url>", cls: "err" };
    const url = arg.trim();
    const jar = level.cookieData?.[url];
    if (!jar) return { text: `cookies: no cookies found for ${url}`, cls: "err" };

    const lines = [
      `Cookies for: ${url}`,
      `──────────────────────────────────────────`,
    ];
    Object.entries(jar).forEach(([name, val]) => {
      lines.push(`  ${name.padEnd(20)} = ${val}`);
    });
    lines.push("", "Tip: base64-looking values can be decoded with: base64 -d <value>");
    return { text: lines.join("\n"), cls: "out" };
  },

  file(level, arg) {
    if (!arg) return { text: "Usage: file <filename>  OR  file *", cls: "err" };

    const identify = (name) => {
      if (level.filetypes?.[name]) return level.filetypes[name];
      if (name.endsWith(".txt"))   return "ASCII text";
      if (name.endsWith(".sh"))    return "POSIX shell script, ASCII text executable";
      if (name.endsWith(".py"))    return "Python script, ASCII text executable";
      if (name.endsWith(".log"))   return "ASCII text";
      if (name.endsWith(".bak"))   return "ASCII text";
      if (name.endsWith(".conf") || name.endsWith(".cfg")) return "ASCII text";
      if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "JPEG image data";
      if (name.endsWith(".png"))   return "PNG image data";
      if (name.endsWith(".pdf"))   return "PDF document";
      if (name.endsWith(".zip"))   return "Zip archive data";
      if (name.endsWith("/"))      return "directory";
      return "data";
    };

    if (arg === "*") {
      const files = Object.keys(level.files).filter(f => !f.endsWith("/"));
      if (files.length === 0) return { text: "(no files)", cls: "dim" };
      const lines = files.map(f => `${f.padEnd(24)}: ${identify(f)}`);
      return { text: lines.join("\n"), cls: "out" };
    }

    if (!(arg in level.files)) return { text: `file: ${arg}: No such file or directory`, cls: "err" };
    return { text: `${arg}: ${identify(arg)}`, cls: "out" };
  },

  strings(level, arg) {
    if (!arg)                 return { text: "Usage: strings <file>", cls: "err" };
    if (!(arg in level.files))return { text: `strings: ${arg}: No such file`, cls: "err" };

    if (level.stringsOut?.[arg]) {
      const lines = level.stringsOut[arg];
      return { text: lines.join("\n"), cls: "out" };
    }

    const content = String(level.files[arg] || "");
    const printable = content.split("\n")
      .map(l => l.replace(/[^\x20-\x7e]/g, ""))
      .filter(l => l.trim().length >= 4);

    if (printable.length === 0) return { text: "(no printable strings found — file may be truly binary)", cls: "dim" };
    return { text: printable.join("\n"), cls: "out" };
  },

  exif(level, arg) {
    if (!arg)                 return { text: "Usage: exif <file>", cls: "err" };
    if (!(arg in level.files))return { text: `exif: ${arg}: No such file`, cls: "err" };
    if (!level.exifData?.[arg]) return { text: `exif: ${arg}: No EXIF data found (not an image, or metadata was stripped)`, cls: "dim" };
    return { text: level.exifData[arg].join("\n"), cls: "out" };
  },

  clear() {
    document.getElementById("terminal").innerHTML = "";
    return null;
  },

  report() {
    window.open("https://sharvil.site/#contact", "_blank");
    return {
      text: "Opening bug report portal...",
      cls: "info"
    };
  }

};
