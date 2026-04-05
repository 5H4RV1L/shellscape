let currentLevelKey  = "guest@shellscape";
let awaitingPassword = null;  

const TOTAL_LEVELS = Object.values(LEVELS).filter(l => !l.isLobby).length;

function markVisited(key) {
  if (LEVELS[key]?.isLobby) return;
  const visited = JSON.parse(sessionStorage.getItem("visited") || "[]");
  if (!visited.includes(key)) {
    visited.push(key);
    sessionStorage.setItem("visited", JSON.stringify(visited));
  }
  const pct = Math.min(100, Math.round((visited.length / TOTAL_LEVELS) * 100));
  document.getElementById("progress-fill").style.width = pct + "%";
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
    print(document.getElementById("prompt-label").textContent + input, "cmd");
  }

  if (awaitingPassword) {
    handlePasswordInput(input);
    return;
  }

  const tokens = input.split(/\s+/);
  const level  = LEVELS[currentLevelKey];

  if (tokens[0] === "ssh") {
    const res = handleSSH(tokens.slice(1).join(" "));
    if (res) print(res.text, res.cls);
    return;
  }

  const cmd = tokens[0];
  const arg = tokens.slice(1).join(" ");

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
