# 📦 Module 1: Supply Chain Defense

## 🔍 What is it?
This module is a deep-level Node.js dependency scanner powered by the Shai-Hulud 2.0 heuristics engine. Rather than just checking for outdated packages, it performs a forensic analysis of your local `package.json` and `node_modules` tree to detect actively malicious, compromised, or typosquatted NPM packages.

## 🛑 Why is it needed?
Modern applications rely heavily on third-party open-source ecosystems. Attackers frequently execute "Supply Chain Attacks" by hijacking legitimate packages or creating fake ones with similar names (typosquatting). Once installed by an unwitting developer, these poisoned packages can quietly steal `.env` secrets, install reverse-shell backdoors, or deploy resource-draining crypto-miners directly onto your production server.

## ⚙️ How does it work?
The module operates locally, meaning it does not send your proprietary codebase to a third-party API. It parses the application tree and compares the cryptographic hashes, package names, and execution scripts of your installed dependencies against a constantly updated threat intelligence database containing over 790 known malicious signatures.

## 🛡️ How does it help the SOC?
It shifts security "left" into the development and deployment phase. By catching poisoned dependencies *before* or *during* deployment, the SOC receives an immediate, automated alert detailing the exact malicious package. This turns a potentially catastrophic data breach into a simple `npm uninstall` operation.

---

## 📊 Threat Detection Capabilities

| Threat Category | Description | SOC Impact |
|---|---|---|
| **Typosquatting** | Packages mimicking popular libraries (e.g., `react-doms`). | Prevents accidental execution of malware by developers. |
| **Credential Stealers** | Scripts designed to harvest `.env` files or AWS keys. | Prevents total infrastructure compromise and data leaks. |
| **Reverse Shells** | Backdoors allowing remote attackers persistent access. | Blocks unauthorized remote code execution (RCE). |
| **Crypto-Miners** | Covert scripts that max out CPU usage. | Saves thousands of dollars in unexpected AWS billing spikes. |

---

## 🚀 What is Unique About This Project's Dashboard?
Unlike static PDF reports, the SOC Pulse dashboard is a **live orchestration engine**. 
* **State Preservation:** The dashboard uses WebSockets to stream the terminal output in real-time. If you navigate away from the module's details to view another screen, the React state is preserved via CSS display toggles, meaning you never lose your active forensic logs.
* **Intelligent Parsers:** The dashboard doesn't just dump raw text. It actively scans the stdout stream for JSON boundaries, parses them dynamically, and renders a visual, interactive UI.

## 🛠️ What We Modified & Engineered
The base Shai-Hulud scanner was specifically modified for cloud automation in this project:
* **JSON Boundary Isolation:** We engineered a custom brace-counting algorithm in the dashboard to perfectly extract the JSON report from the terminal stream, even when Bash outputs unpredictable whitespace or ANSI color codes.
* **Non-Blocking Execution:** We modified the execution flags (`--fail-on-critical=false`) to ensure that finding malware doesn't violently crash the Node.js process manager (`pm2`). This allows the dashboard to gracefully report the threat instead of going offline.

---

## 🖥️ Dashboard Features: What It Actually Shows
When you click **"Show Details"** in the SOC Pulse Dashboard, you are presented with a highly-structured, 3-section Wazuh-inspired interface:

1. **🔴 Problems Found (Actionable Intelligence):** 
   * Highlights any compromised package found.
   * Explains the specific threat (e.g., "Data Exfiltration Backdoor") in plain English.
   * Auto-generates exact mitigation commands (e.g., `npm uninstall <package>`) so Level 1 SOC analysts can fix it immediately without research.
2. **✅ Passed Items:** 
   * Confirms the exact number of clean packages scanned, providing peace of mind.
   * Displays Threat DB Stats (active database version and the 790+ signatures checked).
3. **🖥️ Raw Forensic Logs:** 
   * A collapsible toggle that reveals the complete, raw JSON output from the execution engine. This is critical for Level 3 SOC analysts performing deep incident response.
