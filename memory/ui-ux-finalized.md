# UI/UX Finalization — Session 10 (2026-04-24)

## Frontend Architecture — Current State

### Dashboard Grid → Details View Routing
- State-based routing: `activeView` in `App.jsx` controls which component renders
- **State Preservation:** Grid hidden via CSS `display:none` (NOT unmounted) when details open
  - This preserves all `logs` state in ModuleCard so logs are available to Details components
- All 5 "Show Details" buttons pass `logs` (array of `{text, type, timestamp}`) to detail components

### 3-Section Standard Layout — ALL 5 Modules
Every module detail page follows the exact same structure:

```
Header (icon + title + host info + Back button)
Status/Info Banner
Metric Cards (4–5 key numbers)
─────────────────────────────────────────────────
🔴 Problems Found [count badge]
   If problems: card per problem →
     - Live log lines from that section
     - 🔍 What this means (simple terms)
     - 🛡️ Mitigation Plan (numbered, commands in purple monospace)
   If no problems: green "All clear" banner
─────────────────────────────────────────────────
✅ Passed Items [count badge]
   Grid of passed checks — each with:
     - What this check does (plain English)
     - Condensed log output from that check
─────────────────────────────────────────────────
🖥️ Raw Forensic Logs [toggle button]
   Full 400px scrollable terminal output
   Background: #020617 | Font: monospace 0.8rem
─────────────────────────────────────────────────
```

### Module Detail Components

#### SupplyChainDetails.jsx (377 lines) — Module 1
- Parser: JSON brace-counting (handles nested `{` inside strings)
- `getThreatExplanation(finding)`: malware/backdoor/typosquat/CVE/secret → plain English
- `getMitigationPlan(finding)`: auto `npm uninstall` or `npm install@fixedVersion`
- "What Was Checked" grid: 6 security checks with descriptions
- DB metadata footer: version, last updated, known threats count

#### WebAppScannerDetails.jsx (337 lines) — Module 2
- `CVE_KNOWLEDGE['CVE-2025-55182']`: CVSS 10.0, what it is, how attack works, affected-when
- `getFrameworkRisk(framework)`: LOW/MEDIUM/HIGH based on App Router detection
- Per-project safe/vulnerable breakdown with path + framework topology
- Risk context box per project (color-coded)
- 5 "What Was Checked" cards

#### SystemHardeningDetails.jsx (340 lines) — Module 3
- `CONTROL_KNOWLEDGE` map: 10 controls (Kernel Sysctls, AuditD, Fail2Ban, AppArmor, ClamAV,
  AIDE, rkhunter, Unattended-Upgrades, debsums, SSH Daemon, UFW Firewall)
- Each control: `what` (technical) + `impact` (business consequence)
- Problems built from real log patterns:
  - `openscapMissing` → LOW severity, non-critical
  - `firewallNotActive` → INFO, AWS Safety Mode (intentional)
- Post-hardening service grid: auditd, fail2ban, clamav, apparmor status
- AWS Safety banner (blue) explains intentional UFW staging

#### CveRemediationDetails.jsx (317 lines) — Module 4
- `CVE_DB` knowledge base: 6 CVEs with icon, name, CVSS, what/impact, affected/safe versions
  - CVE-2024-3094 (XZ Backdoor 🧬), CVE-2021-4034 (PwnKit 👑)
  - CVE-2023-4911 (Looney Tunables 🐰), CVE-2021-3156 (Baron Samedit 🎭)
  - CVE-2022-0847 (Dirty Pipe 🪈), CVE-2023-38408 (regreSSHion 🔐)
- `renderLogLine()` maps `[!]`/`[→]`/`[✓]` to colored emoji icons
- Section regex: `🔍 Scanning: CVE-XXXX-XXXX [CVSS N.N TYPE]`
- VULNERABLE first, then PATCHED with live log steps

#### MachineIpCryptoDetails.jsx (334 lines) — Module 5
- `SECTION_KNOWLEDGE` map: 8 sections
  - Certbot, Certificate Status, Certificate Expiry, SSL/TLS Configuration
  - Auto-Renewal, HSTS, Certificate Transparency, Summary
- Each section: `what` + `okMeans` + `problemMeans` + `mitigation[]`
- `getSectionStatus()`: detects `[⚠]`, `NOT installed`, `NOT configured`, `No certs`
- Section regex: `━━ [N/8] Section Title ━━`
- AWS Audit Mode detection → blue info banner
- 5 metric cards: Certbot Engine, Active Certs, Auto-Renewal, Issues Found, Exec Time

### Color Palette (Consistent Across All Details)
| Purpose | Color |
|---|---|
| Problems border (warning) | `#f59e0b` amber |
| Problems border (critical) | `#ef4444` red |
| Passed border | `#10b981` emerald |
| Commands/monospace | `#a78bfa` purple |
| Host/IP info | `#38bdf8` sky blue |
| Background cards | `#0f172a` dark navy |
| Inner panel | `linear-gradient(145deg, #0f172a, #1e293b)` |

### Anti-Hang Guarantees (Verified in moduleRunner.js)
- `DEBIAN_FRONTEND=noninteractive` — no apt prompts ever
- `NEEDRESTART_MODE=a` + `NEEDRESTART_SUSPEND=1` — no needrestart dialog on Ubuntu 22+
- 30-min auto-timeout + SIGTERM→SIGKILL escalation — any stuck module is force-killed
- 2000 log-line memory cap — prevents OOM on 45-min hardening runs
- pm2 max-restarts=10 + startup persisted — survives crashes and reboots

*Last updated: 2026-04-24 (Session 10 — All 5 module details hardened. Baron Samedit added. Structural audit complete.)*
