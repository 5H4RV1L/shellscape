(function () {
  function isMobile() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      || window.innerWidth < 900;
  }

  if (isMobile()) {
    const lines = [
      "[ 0.000 ] Booting Shellscape kernel...",
      "[ 0.142 ] Initializing terminal interface...",
      "[ 0.287 ] Checking input devices...",
      "[ 0.391 ] Keyboard: NOT DETECTED",
      "[ 0.472 ] Verifying display resolution...",
      "[ 0.558 ] Resolution: UNSUPPORTED",
      "[ 0.663 ] Device classification: MOBILE",
      "[ 0.801 ] Applying compatibility layer...",
      "[ 0.944 ] ERROR: Compatibility layer failed",
      "",
      ">> ACCESS DENIED",
      ">> DEVICE NOT SUPPORTED",
      ">> KEYBOARD REQUIRED",
      "",
      ">> ⚠ Shellscape is desktop-only.",
      ">> Use a laptop/PC for full experience."
    ];

    document.body.innerHTML = `
      <div id="boot-screen" style="
        background:#020f09;
        color:#00ff9c;
        font-family: 'Share Tech Mono', monospace;
        padding: 24px;
        padding-top: 30vh;
        height:100vh;
        display:flex;
        flex-direction:column;
        justify-content:flex-start;
      "></div>
    `;

    const container = document.getElementById("boot-screen");

    let i = 0;
    function typeLine() {
      if (i >= lines.length) return;

      const line = document.createElement("div");
      line.style.opacity = "0";
      line.style.transition = "opacity 0.2s ease";
      line.textContent = lines[i++];

      container.appendChild(line);

      setTimeout(() => {
        line.style.opacity = "1";
      }, 20);

      setTimeout(typeLine, 120);
    }

    typeLine();

    return; 
  }
})();

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

function updateCursorPosition() {
  const pos = cmdInput.selectionStart;
  const text = cmdInput.value;

  const before = text.slice(0, pos);
  const after = text.slice(pos);

  mirror.innerHTML =
    before + '<span class="cursor-inline">▋</span>' + after;
}

function onTyping() {
  updateCursorPosition()
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
  "clear", "ssh", "help", "report",
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
  updateCursorPosition();
});

cmdInput.addEventListener("click", updateCursorPosition);

cmdInput.addEventListener("keyup", updateCursorPosition);

cmdInput.addEventListener("keydown", () => {
  setTimeout(updateCursorPosition, 0);
});

cmdInput.addEventListener("keydown", e => {
  switch (e.key) {

    case "Enter": {
      e.preventDefault();
      const val = cmdInput.value;
      cmdInput.value = "";
      tabHint.textContent = "";
      updateCursorPosition()
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
        updateCursorPosition()
      }
      break;
    }

    case "ArrowUp": {
      e.preventDefault();
      if (histIndex < cmdHistory.length - 1) {
        histIndex++;
        cmdInput.value = cmdHistory[histIndex];
        updateCursorPosition()
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
      updateCursorPosition()
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

  const seen = sessionStorage.getItem("seenOnboarding");

  if (!seen) {
    sessionStorage.setItem("seenOnboarding", "true");

    print("  A terminal-based cybersecurity learning game.", "dim");
    print("", "out");
    print("  ────────────────────────────────────────────────", "dim");
    print("  START HERE", "success");
    print("  ────────────────────────────────────────────────", "dim");
    print("", "out");
    print("  ssh level0@linux", "cmd");
    print("", "out");
    print("  ────────────────────────────────────────────────", "dim");
    print("  YOUR GOAL", "success");
    print("  ────────────────────────────────────────────────", "dim");
    print("", "out");
    print("  Find passwords hidden in each level.", "out");
    print("  Use them with ssh to connect to the next level.", "out");
    print("  Example: ssh level1@linux  (after finding the password)", "dim");
    print("", "out");
    print("  ────────────────────────────────────────────────", "dim");
    print("  AVAILABLE TRACKS", "success");
    print("  ────────────────────────────────────────────────", "dim");
    print("", "out");
    print("  ssh level0@linux       Linux fundamentals   (8 levels)", "out");
    print("  ssh level0@network     Networking tools     (6 levels)", "out");
    print("  ssh level0@crypto      Cryptography         (7 levels)", "out");
    print("  ssh level0@web         Web security         (5 levels)", "out");
    print("  ssh level0@forensics   Digital forensics    (5 levels)", "out");
    print("", "out");
    print("  ────────────────────────────────────────────────", "dim");
    print("  Type 'help' if you get stuck.", "warn");
    print("  Report bugs anytime with: report", "warn");
    print("", "out");

  } else {

    print("", "out");
    print("  ────────────────────────────────────────────────", "dim");
    print("  AVAILABLE TRACKS", "success");
    print("  ────────────────────────────────────────────────", "dim");
    print("", "out");
    print("  ssh level0@linux       Linux fundamentals   (8 levels)", "out");
    print("  ssh level0@network     Networking tools     (6 levels)", "out");
    print("  ssh level0@crypto      Cryptography         (7 levels)", "out");
    print("  ssh level0@web         Web security         (5 levels)", "out");
    print("  ssh level0@forensics   Digital forensics    (5 levels)", "out");
    print("", "out");
    print("  Type 'help' for commands.  Report bugs with: report", "warn");
    print("", "out");

  }
}

async function boot() {
  const msgs = [
    "[  0.000] Booting SHELLSCAPE kernel 2.3.1...",
    "[  0.091] Initializing virtual filesystem...    OK",
    "[  0.213] Loading level engine...               OK",
    "[  0.334] Mounting /home...                     OK",
    "[  0.445] Loading 31 levels across 5 tracks...  OK",
    "[  0.512] Starting terminal daemon...           OK",
    "[  0.601] System ready.",
    "",
  ];
  await printSlow(msgs, "dim", 65);
  connectTo("guest@shellscape");
}

updateCursorPosition();
boot();
