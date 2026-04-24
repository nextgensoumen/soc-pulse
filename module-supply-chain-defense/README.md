# 📦 Module 1: Supply Chain Defense

## What is it?
A deep-level dependency scanner powered by the Shai-Hulud 2.0 heuristics engine. It scans your local Node.js projects to detect malicious, compromised, or typosquatted NPM packages.

## Why is it needed?
Modern applications rely on hundreds of third-party open-source packages. Attackers frequently hijack legitimate packages or create fake ones with similar names (typosquatting) to steal environment variables, install backdoors, or deploy crypto-miners directly onto your server.

## How does it work?
The module parses your `package.json` and `node_modules` tree, comparing the hashes and names of installed dependencies against a constantly updated threat intelligence database of over 790 known malicious packages (e.g., packages that abuse TruffleHog, steal credentials, etc.). 

## How does it help the SOC?
It shifts security "left" by catching poisoned dependencies *before* they can be executed in a production environment. The SOC receives an immediate, automated alert if a developer inadvertently installs a weaponized package.

## What the Dashboard Shows:
When you click **"Show Details"** in the SOC Pulse Dashboard, you will see a simple, 3-section layout:
* **🔴 Problems Found:** Highlights any compromised package found, explains the threat (e.g., "Data Exfiltration Backdoor"), and provides exact `npm uninstall` commands to neutralize it immediately.
* **✅ Passed Items:** Confirms the exact number of clean packages scanned.
* **📊 Threat DB Stats:** Shows the active database version and the number of known malicious signatures it checked against.
* **🖥️ Raw Forensic Logs:** A toggle to view the complete JSON output from the execution engine for deep analysis.
