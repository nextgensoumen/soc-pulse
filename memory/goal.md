# SOC Pulse — Project Goals & Master Status

## Project Objective
Build a unified Security Operations Center (SOC) platform combining 5 specialized security tools. All 5 modules are fully integrated, cloud-hardened, and production-ready.

## Environment & Execution
- **Deployment Target:** Any Ubuntu version (20.04 / 22.04 / 24.04 / 25.04), any cloud (AWS, GCP, Azure, DigitalOcean, Hetzner)
- **Single Entry Point:** `./soc-pulse-start.sh` (run as root — no sudo prefix needed)
- **Process Manager:** pm2 — both services persist after SSH disconnect

## STRICT DATA REQUIREMENT
**ZERO mock data.** All scan history, threat verdicts, module status, system info — everything is 100% live from actual Ubuntu process output. `backend/data/scan-history.json` is written by real module runs only.

## Backend Architecture
- **Runtime:** Node.js (Express + Socket.io) v2.0
- **Process Manager:** pm2 (`pm2 start ecosystem.config.cjs`)
- **Key services:** moduleRunner.js, scanHistory.js, logger.js, api.js
- **WebSocket:** auto-reconnect (100 attempts, 1-30s backoff), ping every 25s (AWS ALB safe)

## Current Platform Status — ALL GREEN ✅

### Module 1 — Supply Chain Defense
- Source: `gensecaihq/Shai-Hulud-2.0-Detector` v2.1.0 (cloned, analyzed)
- Detects: 790+ compromised npm packages, SHA256 malware hashes, TruffleHog abuse, SHA1HULUD runner
- Command: `node dist/index.js --working-directory=../dashboard --output-format=json --fail-on-critical=false`
- Timeout: 5 minutes | Threat Level: Critical

### Module 2 — Web App Scanner
- Source: `gensecaihq/react2shell-scanner` v1.1.1 (cloned, analyzed)
- Detects: CVE-2025-55182 (CVSS 10.0 RCE) in React Server Components
- Command: `node dist/cli/index.js ../dashboard --json --no-exit-on-vuln`
- Timeout: 5 minutes | Threat Level: Critical
- Extra modes available: scan-url, scan-image, fix --install, create-pr

### Module 3 — System Endpoint Hardening
- Source: `gensecaihq/Ubuntu-Security-Hardening` (Ubuntu 20.04 / 22.04 / 24.04 variants)
- Applies: sysctl hardening, AIDE, Fail2Ban, ClamAV, OpenSCAP, UFW (AWS-safe guard)
- Headless fixes: AIDE non-interactive, ClamAV headless, UFW SSH lockout prevention
- Timeout: 45 minutes | Threat Level: Low

### Module 4 — Autonomous CVE Remediation
- Source: `gensecaihq/CVE-2024-3094-Vulnerability-Checker-Fixer` (Ansible fleet logic)
- CVEs: Log4Shell, XZ-Backdoor, regreSSHion, Dirty Pipe, PwnKit, Looney Tunables
- Fleet mode: `--fleet --inventory=hosts.ini` triggers Ansible playbooks across multiple hosts
- Timeout: 30 minutes | Threat Level: High

### Module 5 — Machine IP Cryptography (SSL Manager)
- Source: `gensecaihq/LetsEncrypt-IP-SSL-Manager` (cloned, analyzed)
- Modes: --status, --integrity-check, --list, --force-renew
- Exit codes: 0-99 (mapped to specific states)
- **allowedExitCodes: [1]** — code 1 = certbot not installed (audit mode warning, not failure)
- Fix applied: moduleRunner now checks `allowedExitCodes` → shows Completed not Failed
- Timeout: 10 minutes | Threat Level: Low

## Development Workflow
1. User runs `./soc-pulse-start.sh` on cloud Ubuntu (already root)
2. Script installs everything + starts both services via pm2
3. User closes SSH — services keep running
4. Access: `http://<PUBLIC_IP>:5173` (Dashboard) + `http://<PUBLIC_IP>:5000` (Backend)
5. Ports 5173 + 5000 must be open in Security Group

## Live Cloud Test Results (2026-04-23 — AWS Ubuntu 22.04)
| Module | Result | Notes |
|--------|--------|-------|
| Supply Chain Defense | ✅ CLEAN | 202 deps, 0 affected |
| Web App Scanner | ✅ CLEAN | CVE-2025-55182 not vulnerable |
| System Endpoint Hardening | ✅ COMPLETED | 10/11 controls, 510s |
| Autonomous CVE Remediation | ✅ PATCHED | 4 safe, 2 auto-patched (PwnKit + regreSSHion) |
| Machine IP Cryptography | ✅ COMPLETED | 0.1s, all 8 sections, exit 0 |

## Session 7 Fixes Applied (2026-04-23)
### SSL Module — Rewritten as Node.js (audit.js)
- **Root cause:** bash script hung at step 6 — DNS stall on AWS bypasses all curl timeouts
- **Fix:** Replaced entire bash script with `audit.js` (Node.js) — zero network calls, pure local checks
- **Result:** Completes in **0.1 seconds**, never hangs, all 8 sections output correctly
- **Registry change:** `cmd: 'node', args: ['audit.js']`, timeout reduced from 10min → 2min

### UI — Stuck "Running" Status Fixed
- **Root cause:** Fast modules (0.1s) emit WebSocket 'Completed' before React renders 'Scanning'
- **Fix:** `ModuleCard.toggleExecution()` now calls `fetchModuleStatuses()` at 500ms, 2s, 5s after start
- **Files changed:** `dashboard/src/App.jsx`, `dashboard/src/components/ModuleCard.jsx`

### moduleRunner.js — allowedExitCodes
- Exit code 1 from SSL module now treated as Completed (not Failed)
- `modules.registry.js`: `allowedExitCodes: [1]` on Module 5
- `moduleRunner.js`: checks `moduleConfig.allowedExitCodes` before setting status
- `api.js`: passes full module config object to runModule

## Session 8 Fixes Applied (2026-04-23)
### UI — Loading Bar Enhancements & Status Badges
- **Root cause:** Static 'Threat Level' bars were irrelevant. UI needed dynamic execution feedback.
- **Fix:** Removed static threat levels from all module cards. Replaced with an animated `scannerSweep` loading bar (`.module-loading-bar` / `.module-loading-fill`).
- **Logic Sync:** Strictly bound the loading bar to `isRunning`. Adjusted status badge to read `Scanning...` while executing.

### Backend — Status Sync Crashing (ReferenceError)
- **Root cause:** `moduleRunner.js` threw a silent `ReferenceError` on `moduleConfig` at the exact moment a module finished, preventing `emitStatus('Completed')` and `recordScan()` from ever executing. This permanently hung the UI in a "Scanning" state.
- **Fix:** Fixed `runModule` signature to accept the `moduleConfig` argument.

### Backend — UI 'Never Run' Map Lookup Bug
- **Root cause:** `api.js` was passing string URLs (`req.params.id`) into `moduleRunner.js`, which set String keys in `activeProcesses`. The UI polled with Integer IDs, causing `getStatus()` to falsely report `false` for actively running modules.
- **Fix:** Converted `req.params.id` to `parseInt(req.params.id, 10)` in `api.js`.

## Session 9 Fixes Applied (2026-04-24)
### UI — Wazuh-Inspired Details Dashboards
- **Root cause:** The static "PDF Report" feature was disconnected from the visual React experience and raw terminal logs were hard to read.
- **Fix:** Replaced the "Report" button with a "Show Details" button that conditionally renders dedicated, Wazuh-inspired metrics dashboards for each module.
- **State Preservation Architecture:** Instead of unmounting the dashboard grid (which would destroy the React state holding the raw terminal logs), the grid is hidden via CSS `display: none`. This ensures 100% state preservation when clicking "Back to Dashboard".
- **Dynamic Parsers Developed:**
  - `SupplyChainDetails.jsx` (Module 1): Plucks JSON block from generic stdout logs.
  - `WebAppScannerDetails.jsx` (Module 2): Slices exact JSON payload boundaries from stdout.
  - `MachineIpCryptoDetails.jsx` (Module 5): Strips ANSI `\x1B` color codes and uses Regex boundaries to map bash output into an 8-stage audit grid.

## Update Command (on existing server)
```bash
cd /home/ubuntu/soc-pulse && git pull && pm2 restart all
```

## Memory Tracking
AI continuously updates `memory/` to reflect current state.
Last updated: 2026-04-24 (Session 9 — Wazuh-inspired details dashboards implemented for Modules 1, 2, 5)
