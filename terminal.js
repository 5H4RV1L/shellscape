const termEl   = document.getElementById("terminal");
const cmdInput = document.getElementById("cmd-input");
const mirror   = document.getElementById("input-mirror");
const cursorEl = document.getElementById("cursor");
const tabHint  = document.getElementById("tab-hint");

function print(text, cls = "out") {
  String(text).split("\n").forEach(line => {
    const d = document.createElement("div");
    d.className = "line " + cls;
    d.textContent = line;
    termEl.appendChild(d);
  });
  termEl.scrollTop = termEl.scrollHeight;
}

function printAscii(text) { print(text, "ascii"); }

function printSlow(lines, cls = "dim", delayMs = 55) {
  return new Promise(resolve => {
    let i = 0;
    (function next() {
      if (i >= lines.length) { resolve(); return; }
      print(lines[i++], cls);
      setTimeout(next, delayMs);
    })();
  });
}

let blinkResetTimer = null;

function syncMirror() {
  mirror.textContent = cmdInput.value;
}

function onTyping() {
  syncMirror();
  cursorEl.classList.remove("blink");
  cursorEl.classList.add("typing");
  clearTimeout(blinkResetTimer);
  blinkResetTimer = setTimeout(() => {
    cursorEl.classList.remove("typing");
    cursorEl.classList.add("blink");
  }, 600);
}

function setCursorVisible(visible) {
  cursorEl.style.visibility = visible ? "visible" : "hidden";
  mirror.style.visibility   = visible ? "visible" : "hidden";
}

const cmdHistory = [];
let histIndex    = -1;

function pushHistory(cmd) {
  if (cmd && cmdHistory[0] !== cmd) cmdHistory.unshift(cmd);
  if (cmdHistory.length > 100) cmdHistory.pop();
  histIndex = -1;
}

const ALL_CMDS = [
  // linux
  "ls", "cat", "pwd", "whoami", "echo", "grep", "find", "env",
  // network
  "nmap", "netstat", "whois", "dig",
  // crypto
  "base64", "rot13", "xxd", "decode-hex", "hash-id", "john", "xor",
  // web
  "curl", "gobuster", "cookies",
  // forensics
  "file", "strings", "exif",
  // terminal
  "clear", "ssh", "help"
];

function updateTabHint() {
  const val = cmdInput.value;
  tabHint.textContent = "";
  if (!val || val.includes(" ")) return;
  const match = ALL_CMDS.find(c => c.startsWith(val) && c !== val);
  if (match) tabHint.textContent = match.slice(val.length);
}

cmdInput.addEventListener("input", () => {
  onTyping();
  updateTabHint();
});

cmdInput.addEventListener("keydown", e => {
  switch (e.key) {

    case "Enter": {
      e.preventDefault();
      const val = cmdInput.value;
      cmdInput.value = "";
      tabHint.textContent = "";
      syncMirror();
      pushHistory(val);
      execute(val);
      break;
    }

    case "Tab": {
      e.preventDefault();
      const hint = tabHint.textContent;
      if (hint) {
        cmdInput.value += hint;
        tabHint.textContent = "";
        syncMirror();
      }
      break;
    }

    case "ArrowUp": {
      e.preventDefault();
      if (histIndex < cmdHistory.length - 1) {
        histIndex++;
        cmdInput.value = cmdHistory[histIndex];
        syncMirror();
      }
      break;
    }

    case "ArrowDown": {
      e.preventDefault();
      if (histIndex > 0) {
        histIndex--;
        cmdInput.value = cmdHistory[histIndex];
      } else {
        histIndex = -1;
        cmdInput.value = "";
      }
      syncMirror();
      break;
    }
  }
});

document.addEventListener("click", () => cmdInput.focus());

const ASCII_LOGO = [
  " ███████╗██╗   ██╗███████╗██╗      ██╗        ███████╗ ██████╗ █████╗  ██████╗  ███████╗",
  " ██╔════╝██║   ██║██╔════╝██║      ██║        ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝",
  " ███████╗███████║█████╗   ██║      ██║        ███████╗██║       ███████║██████╔╝█████╗  ",
  " ╚════██║██╔══██║██╔══╝   ██║      ██║        ╚════██║██║       ██╔══██║██╔═══╝ ██╔══╝  ",
  " ███████║██║   ██║██████╗ ███████╗███████╗███████║███████╗ ██║   ██║██║      ███████╗",
  " ╚══════╝╚═╝  ╚═╝╚══════╝ ╚══════╝╚══════╝╚══════╝╚══════╝ ╚═╝   ╚═╝╚═╝      ╚══════╝",
].join("\n");

function showLobby() {
  termEl.innerHTML = "";
  printAscii(ASCII_LOGO);
  print("", "out");
  print("  Learn real cybersecurity tools by playing.", "info");
  print("", "out");
  print("  ┌──────────────────────────────────────────────────────────────┐", "dim");
  print("  │  TRACK             COMMAND                    LEVELS          │", "dim");
  print("  ├──────────────────────────────────────────────────────────────┤", "dim");
  print("  │  🐧 Linux           ssh level0@linux           8 levels      │", "out");
  print("  │  🌐 Network         ssh level0@network         6 levels      │", "out");
  print("  │  🔐 Crypto          ssh level0@crypto          7 levels      │", "out");
  print("  │  🕸  Web             ssh level0@web             5 levels      │", "out");
  print("  │  🔍 Forensics       ssh level0@forensics       5 levels      │", "out");
  print("  └──────────────────────────────────────────────────────────────┘", "dim");
  print("", "out");
  print("  Type  help  for a full command reference.", "dim");
  print("", "out");
}

async function boot() {
  const msgs = [
    "[  0.000] Booting SHELLSCAPE kernel 2.0.0...",
    "[  0.091] Initializing virtual filesystem...    OK",
    "[  0.213] Loading level engine...               OK",
    "[  0.334] Mounting /home...                     OK",
    "[  0.445] Loading 26 levels across 5 tracks...  OK",
    "[  0.512] Starting terminal daemon...           OK",
    "[  0.601] System ready.",
    "",
  ];
  await printSlow(msgs, "dim", 65);
  connectTo("guest@shellscape");
}

boot();
