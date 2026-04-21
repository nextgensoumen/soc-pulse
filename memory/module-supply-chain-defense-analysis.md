# deep-analysis: module-supply-chain-defense (formerly module-malware-scanner)

## Overview
The `module-supply-chain-defense` folder houses a deeply optimized and locally executable version of the **Shai-Hulud 2.0 Detector**. It is designed specifically to defend Node.js environments from the catastrophic November 2025 npm supply chain attack.

## The Attack Mechanism (Shai-Hulud 2.0)
The attack behaves like an infectious worm:
1. **Infection:** A developer runs `npm install` on a compromised library.
2. **Hook Execution:** A `preinstall` or `postinstall` script secretly runs `setup_bun.js`.
3. **Payload / Exfiltration:** This payload downloads the Bun runtime and executes `bun_environment.js`, leveraging a hidden TruffleHog instance to harvest AWS, GitHub, and environment variables and upload them to attacker repos.
4. **Persistence:** It installs stealthy self-hosted GitHub Actions runners named `SHA1HULUD` as an invisible backdoor.

## How The Scanner Works
This module has been compiled natively into a localized Node.js executable sequence (`dist/index.js`), completely decoupling it from external GitHub Action constraints.
It actively cross-examines target paths (e.g., `--working-directory="../dashboard"`) focusing on:
* **Precise Version Semantics:** It scans `package.json` and lockfiles using strict semantic versioning (`semver`) against its internal database (`compromised-packages.json` which tracks 790+ malicious packages).
* **Cryptographic Hashes:** It scans `node_modules` structure converting files into SHA256 hashes to pattern-match against the Datadog IOC database.

## How it Integrates with SOC Pulse
This is explicitly wired as Module 1 (**Supply Chain Defense**) on the dashboard.
- The backend `api.js` connects directly to `node dist/index.js --working-directory="../dashboard"`.
- This ensures that pressing the button in the UI executes a perfect, static vulnerability scan against the very React Application serving the UI, ensuring SOC Pulse remains impenetrable.
- The detailed JSON output or success streams are funneled through `socket.io` effortlessly into the front-end Terminal viewer.
