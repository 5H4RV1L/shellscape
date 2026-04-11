# 🖥️ Shellscape

**Shellscape** is an interactive, terminal-based cybersecurity training platform that simulates real-world penetration testing scenarios inside a browser.

Instead of learning tools passively, users actively **solve challenges using real commands** like `nmap`, `grep`, `curl`, `john`, and more — just like in actual CTFs and pentests.

---

## 🚀 Features

* 🧠 **Learn by Doing** — Solve hands-on challenges instead of reading theory
* 🖥️ **Fully Terminal-Based UI** — No buttons, no shortcuts — just commands
* 🔐 **Real-World Tools Simulation**:

  * Linux: `ls`, `cd`, `grep`, `find`, `env`
  * Network: `nmap`, `netstat`, `whois`, `dig`
  * Crypto: `base64`, `rot13`, `john`, `xor`
  * Web: `curl`, `gobuster`, `cookies`
  * Forensics: `file`, `strings`, `exif`
* 🎯 **Progressive Levels** — Each level teaches a real-world concept
* 🧩 **5 Tracks, 26 Levels**:

  * 🐧 Linux (8 levels)
  * 🌐 Network (6 levels)
  * 🔐 Crypto (7 levels)
  * 🕸 Web (5 levels)
  * 🔍 Forensics (5 levels)
* 📊 **Progress Tracking System**
* ⚡ **Command Autocomplete + History**

---

## 🎮 How It Works

You start in a simulated shell:

```
guest@shellscape:~$
```

From there:

1. Connect to a level:

   ```bash
   ssh level0@linux
   ```

2. Read the objective

3. Use commands to explore the environment

4. Find the password

5. Move to the next level

Everything happens inside the terminal — including authentication.

---

## 🧠 Learning Philosophy

Shellscape is built on a simple idea:

> "You don’t learn cybersecurity by watching — you learn by breaking things."

Each level is designed around:

* Real misconfigurations
* Common vulnerabilities
* Actual attacker workflows

Examples:

* Finding credentials in `.env` files
* Exploiting exposed `robots.txt`
* Cracking MD5 hashes with wordlists
* Discovering services via `nmap`
* Extracting secrets from binaries using `strings`

---

## 🏗️ Project Structure

All files are in a single directory for simplicity:

```
Shellscape/
│
├── index.html      # Main entry point (terminal UI)
├── style.css       # Terminal styling
├── engine.js       # Core game logic (levels, SSH, progress)
├── terminal.js     # Terminal behavior & input handling
├── commands.js     # All command implementations
├── levels.js       # Level data and scenarios
└── README.md
```

### 🔧 Core Components

* **engine.js** → Handles level switching, SSH simulation, and progress tracking
* **commands.js** → Implements all terminal commands (Linux, Network, Crypto, Web, Forensics)
* **levels.js** → Stores all levels, files, and challenge data
* **terminal.js** → Manages UI behavior, cursor, input, and history
* **style.css** → Defines the terminal look and feel
* **index.html** → Loads everything and acts as the main interface

---

## 🛠️ Tech Stack

* Frontend: HTML, CSS, JavaScript
* Runtime: Browser-based terminal simulation

---

## ⚙️ Setup

1. Clone the repo
2. Open `index.html` in a browser

## 🎯 Example Gameplay

```
$ ssh level0@linux

▶ Objective: Find credentials left behind on this server.

$ ls
readme.txt  deploy_notes.txt  credentials.txt

$ cat credentials.txt
user: admin
pass: greenlight

$ ssh level1@linux
```

---

## 🧪 Skills You Gain

* Linux enumeration
* File system analysis
* Network reconnaissance
* OSINT techniques
* Cryptography basics
* Web vulnerability discovery
* Digital forensics fundamentals

---

## 📈 Future Improvements

* 👤 User authentication system
* 💾 Persistent progress (database)
* 🏆 Leaderboards
* 🌍 Multiplayer / competitive mode
* 🧠 AI-generated levels
* 🐳 Dockerized deployment

---

## 🤝 Contributing

Contributions are welcome.

You can help by:

* Adding new levels
* Improving command realism
* Fixing bugs
* Enhancing UI/UX

---

## 📜 License

MIT License

---

## 💡 Inspiration

Inspired by:

* CTF platforms
* Hack The Box
* OverTheWire (Bandit)
* Real-world penetration testing workflows

---

## ⚠️ Disclaimer

This project is for **educational purposes only**.

Do not use these techniques on systems you do not own or have explicit permission to test.

---

## 👨‍💻 Author

Built by **Sharvil Sagalgile** — a cybersecurity enthusiast focused on practical, hands-on learning.

🌐 Personal Website: [https://sharvil.site](https://sharvil.site)
🎮 Play Shellscape: [https://shellscape.sharvil.site](https://shellscape.sharvil.site)

---

> "The best way to learn hacking is to think like a hacker."
