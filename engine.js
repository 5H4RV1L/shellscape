let currentLevelKey  = "guest@shellscape";
let awaitingPassword = null;  
let awaitingBadgeName = false;
let awaitingMaybeExists = false;

// Patch doesnt@exist level once eliteId is known.
// Also generates the 20-char in-memory password on first call.
function _patchHiddenLevel(eliteId) {
  const lvl = LEVELS["doesnt@exist"];
  if (!lvl) return;

  // Generate dynPass once and store on the level object (in-memory only, never persisted)
  if (!lvl._dynPass) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let p = "";
    for (let i = 0; i < 20; i++) p += chars[Math.floor(Math.random() * chars.length)];
    lvl._dynPass = p;
  }
  const dynPass = lvl._dynPass;

  // Build ROT13-encoded plaintext, then base64 it (what dump.dat decodes to → ROT13 text)
  const plaintext = `what you see is not what it seems...\n/home/${eliteId}/maybe.exists  password: ${dynPass}`;
  const rot13text = plaintext.replace(/[a-zA-Z]/g, c => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  const cleanB64 = btoa(rot13text);

  // fs tree node content: noisy wrapper (shown by cat)
  try {
    lvl.fs.children.var.children.www.children.backup.children["dump.dat"].content =
      `-- backup fragment --\n${cleanB64}\n-- end --`;
  } catch(e) {}

  // Patch rot13Out with real values
  if (!lvl.rot13Out) lvl.rot13Out = {};
  lvl.rot13Out["var/www/backup/dump.dat"] = plaintext;

  // Rebuild flat files map
  if (typeof flattenFS === "function") {
    lvl.files = flattenFS(lvl.fs, "");
  }

  // base64 command does atob(level.files[arg].trim()) — must be pure b64, no noise
  lvl.files["var/www/backup/dump.dat"] = cleanB64;
}

const TOTAL_LEVELS = Object.values(LEVELS).filter(l => !l.isLobby && l.track !== null).length;

(function restoreEliteId() {
  const id = sessionStorage.getItem("eliteId");
  if (id && LEVELS["doesnt@exist"]) {
    LEVELS["doesnt@exist"].password = id;
    _patchHiddenLevel(id);
  }
})();

function markVisited(key) {
  if (LEVELS[key]?.isLobby) return;
  const visited = JSON.parse(sessionStorage.getItem("visited") || "[]");
  if (!visited.includes(key)) {
    visited.push(key);
    sessionStorage.setItem("visited", JSON.stringify(visited));
  }
  const pct = Math.min(100, Math.round((visited.length / TOTAL_LEVELS) * 100));
  document.getElementById("progress-fill").style.width = pct + "%";

  // Completion check
  if (
    visited.length >= TOTAL_LEVELS &&
    !sessionStorage.getItem("eliteBadgeUnlocked")
  ) {
    sessionStorage.setItem("eliteBadgeUnlocked", "true");
    setTimeout(triggerEliteFlow, 600);
  }
}

function triggerEliteFlow() {
  if (!sessionStorage.getItem("eliteId")) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
    sessionStorage.setItem("eliteId", id);
    LEVELS["doesnt@exist"].password = id;
    _patchHiddenLevel(id);
  }
  print("", "out");
  print("[✔] ALL TRACKS COMPLETE", "success");
  print("You have unlocked the SHELLSCAPE ELITE BADGE.", "info");
  print("Enter a name to engrave on your badge:", "info");
  print("", "out");
  awaitingBadgeName = true;
}

function handleBadgeNameInput(val) {
  const name = val.trim().slice(0, 16);
  if (!name) {
    print("Name cannot be empty. Enter a name to engrave on your badge:", "err");
    return;
  }

  awaitingBadgeName = false;
  sessionStorage.setItem("eliteBadgeName", name);

  print(`Badge name set: ${name}`, "success");
  print("Generating badge...", "dim");

  setTimeout(() => {
    generateEliteBadge(name);
  }, 300);
}

function generateEliteBadge(name) {
  const canvas = document.getElementById("badge-canvas");
  const ctx = canvas.getContext("2d");
  const W = 512, H = 512, cx = W / 2, cy = H / 2;

  // Background
  ctx.fillStyle = "#020f09";
  ctx.fillRect(0, 0, W, H);

  // Hexagon path helper
  function hexPath(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // Outer glow hexagon fill
  ctx.save();
  hexPath(cx, cy, 210);
  ctx.fillStyle = "#001a0e";
  ctx.shadowColor = "#00ff9c";
  ctx.shadowBlur = 32;
  ctx.fill();
  ctx.restore();

  // Hexagon border — double stroke for glow effect
  for (let i = 0; i < 2; i++) {
    ctx.save();
    hexPath(cx, cy, 210);
    ctx.strokeStyle = "#00ff9c";
    ctx.lineWidth = i === 0 ? 6 : 2;
    ctx.shadowColor = "#00ff9c";
    ctx.shadowBlur = i === 0 ? 24 : 8;
    ctx.stroke();
    ctx.restore();
  }

  // Inner thin hexagon ring
  ctx.save();
  hexPath(cx, cy, 190);
  ctx.strokeStyle = "#00ff9c44";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Helper: glowing text
  function glowText(text, y, size, alpha = 1, blur = 12) {
    ctx.save();
    ctx.font = `${size}px 'Courier New', monospace`;
    ctx.fillStyle = `rgba(0,255,156,${alpha})`;
    ctx.shadowColor = "#00ff9c";
    ctx.shadowBlur = blur;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, y);
    ctx.restore();
  }

  // Top label: SHELLSCAPE
  glowText("SHELLSCAPE", cy - 100, 28, 0.85, 10);

  // Divider line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy - 72);
  ctx.lineTo(cx + 100, cy - 72);
  ctx.strokeStyle = "#00ff9c66";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Center large: ELITE
  glowText("ELITE", cy - 12, 82, 1, 28);

  // User name below ELITE
  glowText(name.toUpperCase(), cy + 62, 26, 0.9, 12);

  // Divider line
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy + 90);
  ctx.lineTo(cx + 100, cy + 90);
  ctx.strokeStyle = "#00ff9c66";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Bottom: 100% COMPLETE
  glowText("100% COMPLETE", cy + 114, 20, 0.85, 8);

  // Footer URL
  glowText("shellscape.sharvil.site", cy + 152, 13, 0.4, 4);

  // Download
  const link = document.createElement("a");
  const eliteId = sessionStorage.getItem("eliteId") || "shellscape-elite";
  link.download = eliteId + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();

  print("", "out");
  print(`✔ Badge generated. Saved as: ${eliteId}.png`, "success");
  print("", "out");
  print(
    `${name} has achieved 100% in Shellscape. https://shellscape.sharvil.site`,
    "info"
  );
  print("", "out");
  print("qbrfag@rkvfg", "dim");
}

function updatePrompt() {
  const [user, host] = currentLevelKey.split("@");
  document.getElementById("prompt-user").textContent = user;
  document.getElementById("prompt-host").textContent = host;
  document.getElementById("level-badge").textContent =
    LEVELS[currentLevelKey]?.isLobby ? "LOBBY" : currentLevelKey.toUpperCase();
}

function handleSSH(target) {
  const level = LEVELS[target];
  if (!level) {
    return {
      text: `ssh: Could not resolve hostname '${target}': Name or service not known`,
      cls: "err"
    };
  }

  if (!level.password) {
    connectTo(target);
    return null;
  }

  print(`Connecting to ${target}...`, "dim");
  print(`${target}'s password:`, "info");
  document.getElementById("cmd-input").classList.add("password");
  awaitingPassword = { target, password: level.password };
  return null;
}

function handlePasswordInput(val) {
  const { target, password } = awaitingPassword;
  awaitingPassword = null;
  document.getElementById("cmd-input").classList.remove("password");
  print("", "out");

  if (val === password) {
    print("Access granted.", "success");
    setTimeout(() => connectTo(target), 300);
  } else {
    print("Permission denied, please try again.", "err");
  }
}

function connectTo(key) {
  currentLevelKey = key;
  const level = LEVELS[key];
  resetPath();

  // Generate dynPass and patch level content the moment user first lands here
  if (key === "doesnt@exist") {
    const eliteId = sessionStorage.getItem("eliteId");
    if (eliteId) _patchHiddenLevel(eliteId);
  }

  markVisited(key);
  updatePrompt();

  if (level.isLobby) {
    showLobby();
    return;
  }

  print("", "out");
  print(`─── Connected: ${key} ───`, "dim");
  if (level.lesson)    print(`📚 ${level.lesson}`, "dim");
  print("", "out");
  if (level.objective) print(`▶ Objective: ${level.objective}`, "info");
  print("", "out");
}

function execute(raw) {
  const input = raw.trim();
  if (!input) return;

  if (!awaitingPassword) {
    const user = document.getElementById("prompt-user").textContent;
    const host = document.getElementById("prompt-host").textContent;
    const fullPrompt = `${user}@${host}:~$ ${input}`;     
    print(fullPrompt, "cmd");
  }

  if (awaitingBadgeName) {
    handleBadgeNameInput(input);
    return;
  }

  if (awaitingMaybeExists) {
    awaitingMaybeExists = false;
    document.getElementById("cmd-input").classList.remove("password");
    print("", "out");

    const _dynPass = LEVELS["doesnt@exist"]?._dynPass;

    if (_dynPass && input === _dynPass) {
      print("Congratulations.", "dim");
      print("", "out");
      print("You made it here.", "dim");
      print("", "out");
      print("No reward.", "dim");
      print("No badge.", "dim");
      print("No next level.", "dim");
      print("", "out");
      print("Just this.", "dim");
      print("", "out");
      print("If you're wondering whether there was more...", "dim");
      print("there isn't.", "dim");
      print("", "out");
      print("And if someone asks what’s here...", "dim");
      print("", "out");
      print("don’t explain it.", "dim");
      print("just tell them to see it for themselves.", "dim");
      print("", "out");

    } else {
      print("Permission denied.", "err");
    }

    return;
  }

  if (awaitingPassword) {
    handlePasswordInput(input);
    return;
  }

  const tokens = input.split(/\s+/);
  const level  = LEVELS[currentLevelKey];

  // Intercept: cat maybe.exists on doesnt@exist level
  if (
    currentLevelKey === "doesnt@exist" &&
    tokens[0] === "cat" &&
    tokens[1] === "maybe.exists" &&
    currentPath.length === 0
  ) {
    print("maybe.exists: protected file. Enter password:", "info");
    document.getElementById("cmd-input").classList.add("password");
    awaitingMaybeExists = true;
    return;
  }

  if (tokens[0] === "ssh") {
    const res = handleSSH(tokens[1]);
    if (res) print(res.text, res.cls);
    return;
  }

  const cmd = tokens[0];
  let arg = tokens.slice(1).join(" ");

  // Commands that look up level.files[arg] directly can't resolve relative paths.
  // If the file isn't found at the literal arg but currentPath is non-empty,
  // try the fully-qualified flat key (e.g. "dump.dat" → "var/www/backup/dump.dat").
  const FILE_CMDS = ["base64","rot13","xxd","decode-hex","hash-id","john","xor","strings","exif","file"];
  if (FILE_CMDS.includes(cmd) && currentPath.length > 0 && arg && !arg.startsWith("-")) {
    const flatKey = currentPath.join("/") + "/" + arg;
    if (!(arg in level.files) && flatKey in level.files) arg = flatKey;
  }
  // Same resolution for commands with a flag prefix (e.g. "base64 -d ..." should stay untouched,
  // but "file *" should not be rewritten).

  if (COMMANDS[cmd]) {
    const res = COMMANDS[cmd](level, arg);
    if (res) print(res.text, res.cls);
    return;
  }

  print(`${cmd}: command not found. Type 'help' for available commands.`, "err");
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2, "0"))
      .join(":");
}
setInterval(updateClock, 1000);
updateClock();
