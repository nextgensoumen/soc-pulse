# UI/UX Finalization — Session 10 (2026-04-24)

## Frontend File Map (`dashboard/src/`)
```
App.jsx                          — Root: routing, WebSocket, module state
index.css                        — Global styles, glassmorphism, animations
components/
  Sidebar.jsx                    — Left nav, language cycler, view switching
  TopBar.jsx                     — Top header bar, system info
  ModuleCard.jsx                 — Per-module card: run/stop/logs/show details
  DocumentationView.jsx          — Doc viewer for module documentation
  details/
    SupplyChainDetails.jsx       — Module 1 detail dashboard (377 lines)
    WebAppScannerDetails.jsx     — Module 2 detail dashboard (337 lines)
    SystemHardeningDetails.jsx   — Module 3 detail dashboard (340 lines)
    CveRemediationDetails.jsx    — Module 4 detail dashboard (317 lines)
    MachineIpCryptoDetails.jsx   — Module 5 detail dashboard (334 lines)
utils/
  reportGenerator.js             — (legacy, still imported but not primary UI)
```

---

## App.jsx — Root Component (269 lines)

### State
| State | Type | Purpose |
|---|---|---|
| `activeView` | string | `'dashboard'` / `'details-N'` / `'doc-N'` |
| `detailsLogs` | array | Logs passed from clicked ModuleCard to detail component |
| `modules` | array | 5 module objects: `{id, title, desc, icon, status, isRunning}` |

### Key Design Decision — State Preservation
```jsx
// Grid is HIDDEN via CSS, not unmounted
// This keeps ModuleCard's logs[] state alive when Details view opens
<div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
  {modules.map(mod => <ModuleCard ... />)}
</div>
```

### Routing (no react-router — pure state)
```
activeView = 'dashboard'   → show modules grid
activeView = 'details-1'   → SupplyChainDetails (logs={detailsLogs})
activeView = 'details-2'   → WebAppScannerDetails
activeView = 'details-3'   → SystemHardeningDetails
activeView = 'details-4'   → CveRemediationDetails
activeView = 'details-5'   → MachineIpCryptoDetails
activeView = 'doc-N'       → DocumentationView
```

### WebSocket (cloud-hardened)
```js
const socket = io('http://<hostname>:5000', {
  reconnectionAttempts: 100,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.3,
  timeout: 20000,
  transports: ['websocket', 'polling'],  // polling fallback
});
```

### Status Sync (Dual-mode: WebSocket + HTTP Polling)
- WebSocket `module_status_change` → instant update
- HTTP poll every 3000ms (`setInterval`) → catches missed events
- On module start: extra polls at 500ms, 2000ms, 5000ms → catches fast modules (SSL at 0.1s)

### FallingSunflowers Component
- 25 animated 🌻 particles, `pointer-events: none`
- Random: position, size (1.2–2.7rem), duration (15–40s), blur (0–3px), opacity (0.15–0.55)
- CSS class: `sunflower-particle` / `particles-container`

### Footer
- `🌻 SOC PULSE` in `#FFd600` with glow text-shadow
- "Developed & Designed by **ULTRON**" in `#FF6D00` with drop-shadow

---

## ModuleCard.jsx (151 lines)

### Props
```
id, title, description, icon, status, threatLevel, isRunning,
socket, backendUrl, onStatusRefresh, onShowDetails
```

### Local State
| State | Purpose |
|---|---|
| `logs[]` | Accumulates `{text, type}` objects from WebSocket `log_stream` events |
| `showLogs` | Toggle mini terminal panel (150px) inside the card |

### Key Behaviors
- **Log accumulation:** subscribes via `socket.emit('subscribe_module', id)`, filters by `data.moduleId == id`
- **Auto-scroll:** `logEndRef.current.scrollIntoView()` fires whenever `logs` or `showLogs` changes
- **On new run:** `setLogs([])` clears previous run + `setShowLogs(true)` opens terminal
- **Triple-poll fix:** After start → `setTimeout(onStatusRefresh, 500/2000/5000)` for fast modules

### Buttons (3 buttons in footer)
| Button | Condition | Action |
|---|---|---|
| `Run Module` / `Stop Execution` | Always shown | POST `/api/modules/:id/start` or `/stop` |
| `Show Logs` / `Hide Logs` | Always shown | Toggles 150px mini terminal |
| `👁️ Show Details` (purple gradient) | Only if `logs.length > 0 && !isRunning` | Calls `onShowDetails(id, logs)` → opens full detail page |

### Loading Bar
- Shown only while `isRunning === true`
- CSS: `.module-loading-bar` / `.module-loading-fill` animated sweep

### Status Badge Colors
```
'completed' / 'active' / 'patched' → status-success (green)
'scanning'                          → status-warning (amber)
'error' / 'offline'                 → status-danger (red)
'idle' / default                    → status-muted (grey)
```
While running: badge always shows `Scanning...`

---

## 3-Section Detail Layout — ALL 5 Modules

Every detail component follows this exact structure:

```
[Header: icon + title + host/IP + Back button]
[Status/Info Banner: overall result or AWS safety notice]
[Metric Cards: 4–5 key numbers from parsed logs]
────────────────────────────────────────────────────────
🔴 Problems Found  [badge: N issue(s)]
   IF problems exist:
     Per-problem card:
       - Live log lines (colored by [⚠]/[✓]/[!]/[→])
       - 🔍 "What this means (simple terms)"
       - 🛡️ Mitigation Plan: numbered steps, commands in #a78bfa monospace
   IF no problems:
       - Green "All clear" banner
────────────────────────────────────────────────────────
✅ Passed Items  [badge: N passed]
   Grid of checks — each shows:
     - Plain-English explanation of what this check does
     - Condensed log lines (first 4–5 lines)
────────────────────────────────────────────────────────
[Center button: 🖥️ View Full Terminal Output (Raw Logs)]
   On click: 400px scrollable dark terminal
   bg: #020617, font: monospace 0.8rem
   Full unfiltered logs, ANSI codes stripped
```

---

## Detail Component Details

### SupplyChainDetails.jsx — Module 1 (377 lines)
- **Parser:** Brace-counting JSON extraction (`JSON Report:\n{...}`)
- `getThreatExplanation(finding)` → 5 threat types → plain English
- `getMitigationPlan(finding)` → `npm uninstall` or `npm install@fixedVersion`
- "What Was Checked" grid: 6 checks (malware hash, backdoor, TruffleHog, typosquat, lockfile, node_modules)
- Threat DB footer: version, last updated, known threats count
- Status banner: CLEAN (green) or VULNERABLE (red)

### WebAppScannerDetails.jsx — Module 2 (337 lines)
- `CVE_KNOWLEDGE['CVE-2025-55182']`: CVSS 10.0 — what it is, how attack works, affected-when
- `getFrameworkRisk(framework)` → LOW / MEDIUM / HIGH RISK with reason
- Per-project breakdown: path, framework type, App Router status, risk context box
- 5 "What Was Checked Per Project" cards
- Scan errors section (shown only if errors exist)

### SystemHardeningDetails.jsx — Module 3 (340 lines)
- `CONTROL_KNOWLEDGE` map: 10 controls — Kernel Sysctls, AuditD, Fail2Ban, AppArmor, ClamAV,
  AIDE, rkhunter, Unattended-Upgrades, debsums, SSH Daemon, UFW Firewall
  - Each: `what` + `impact` (business consequence)
- Problems from real log patterns:
  - `openscapMissing` → LOW severity, non-critical optional tool
  - `firewallNotActive` → INFO, AWS Safety Mode (intentional, not a gap)
- Post-hardening service health check grid (auditd, fail2ban, clamav, apparmor)
- AWS Safety banner (blue): explains UFW staging
- Warning banner: "Hardening Finished With Warnings — N issue(s)"

### CveRemediationDetails.jsx — Module 4 (317 lines)
- `CVE_DB` knowledge base: 6 CVEs
  - CVE-2024-3094 XZ Backdoor 🧬 — CVSS 10.0
  - CVE-2021-4034 PwnKit 👑 — CVSS 7.8
  - CVE-2023-4911 Looney Tunables 🐰 — CVSS 7.8
  - CVE-2021-3156 Baron Samedit 🎭 — CVSS 7.8
  - CVE-2022-0847 Dirty Pipe 🪈 — CVSS 7.8
  - CVE-2023-38408 regreSSHion 🔐 — CVSS 8.1
- `renderLogLine()`: `[!]`→🚨 red, `[→]`→⚡ amber, `[✓]`→✅ green
- Section regex: `🔍 Scanning: CVE-XXXX-XXXX [CVSS N.N TYPE]`
- Status detection: `content.includes('SAFE:')` / `PATCHED:` / `VULNERABLE:`
- Display order: VULNERABLE first, then PATCHED (with live mitigation log), then SAFE

### MachineIpCryptoDetails.jsx — Module 5 (334 lines)
- `SECTION_KNOWLEDGE` map: 8 SSL audit sections
  - Certbot, Certificate Status, Certificate Expiry, SSL/TLS Configuration,
    Auto-Renewal, HSTS, Certificate Transparency, Summary
  - Each: `what` + `okMeans` + `problemMeans` + `mitigation[]`
- `getSectionStatus()`: warns on `[⚠]`, `NOT installed`, `NOT configured`, `No certs`
- Section regex: `━━ [N/8] Section Title ━━`
- AWS Audit Mode detection → blue info banner
- 5 metric cards: Certbot Engine, Active Certs, Auto-Renewal, Issues Found, Exec Time
- Passed Items in 2-column grid (minmax 320px)

---

## Color Palette (All Detail Components — Consistent)

| Element | Color |
|---|---|
| Warning/problem card border | `#f59e0b` amber |
| Critical vulnerability border | `#ef4444` red |
| Passed/OK border | `#10b981` emerald |
| Commands / terminal text | `#a78bfa` purple |
| Host / IP / monospace info | `#38bdf8` sky blue |
| Card background | `#0f172a` dark navy |
| Inner panel gradient | `linear-gradient(145deg, #0f172a, #1e293b)` |
| Full page bg | via `index.css` sunflower theme |
| Raw log terminal bg | `#020617` near-black |

---

## Visual Theme (index.css)

- **Palette:** Sunflower Yellow `#FFd600` + Amber `#FF6D00` + Dark Brown-Black panels
- **Glassmorphism:** `backdrop-filter: blur()`, semi-transparent backgrounds
- **Particle Engine:** 25 falling 🌻 via `sunflowerFlow` keyframe (pointer-events: none)
- **Animations:** `scannerSweep` (loading bar), `fadeIn` (detail transitions), `sunflowerFall`
- **Font:** Google Fonts (Inter/Roboto/Outfit via CSS import)
- **Sidebar:** Language cycler — English "Pulse" → Hindi "पल्स" → Bangla "পালস" every 1500ms

---

## Anti-Hang Guarantees (Confirmed in moduleRunner.js)

| Guard | Value | Purpose |
|---|---|---|
| `DEBIAN_FRONTEND=noninteractive` | always set | No apt-get prompts |
| `NEEDRESTART_MODE=a` | always set | No needrestart dialog (Ubuntu 22+) |
| `NEEDRESTART_SUSPEND=1` | always set | Double-locks needrestart |
| Auto-timeout | 30 min (default) | Force-kills stuck modules |
| SIGTERM → SIGKILL | 5s escalation | Hard-kills bash scripts ignoring SIGTERM |
| Memory cap | 2000 log lines | Prevents OOM on 45-min hardening |
| `allowedExitCodes: [1]` | Module 5 | Exit 1 = Completed (not Failed) |
| pm2 max-restarts | 10 | Backend restarts on crash |
| pm2 startup | persisted | Survives reboots |

*Last updated: 2026-04-24 (Session 10 — Complete. All dashboard features documented.)*
