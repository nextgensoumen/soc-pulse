# SOC Pulse — Session Memory: Final UI & Documentation Fixes
**Last Updated:** 2026-04-25

---

## This Session: What Was Done

### 1. README.md — Major Additions
All the following sections were added to the main `README.md` and pushed to GitHub:

- **Why is SOC Pulse Needed?** — Contextual explanation of alert fatigue and fragmented security tooling.
- **What Makes It Unique?** — Three key differentiators: Zero Data Exfiltration (local-only), AWS Lockout Prevention (no UFW SSH breakage), No-Hang Orchestrator (buffered child_process).
- **Why Use SOC Pulse?** — Active defense posture vs passive monitoring, one-click remediation list.
- **Hardware & OS Requirements Table** — Formatted as a Markdown table. Officially tested on `t2.large` (2 vCPUs, 8GB RAM) on Ubuntu 22.04 LTS and 24.04 LTS.
- **AWS Security Group Prerequisites Table** — Port 22, 5000, 5173, 80 with purpose and justification columns.
- **Acknowledgments Section** — Credits to `gensecaihq` and `alokemajumder` only (user's explicit request).

---

### 2. TEST_REPORT.md — Updated
- Changed "Instance Arch" column to "Instance Type"
- Specified `t2.large (2 vCPU, 8GB RAM)` for both Ubuntu 22.04 and 24.04 test rows.

---

### 3. Dashboard UI — Critical Bug Fixes

#### Bug: Sidebar Modules Showed Blank Dark Screen
- **Root Cause:** `DocumentationView.jsx` was storing pre-evaluated JSX as object values (`content: (<div>...</div>)`). This caused a fatal React crash at import time.
- **Fix:** Rewrote all 5 module docs to use `renderContent()` functions instead of static JSX values. Now each module's JSX is only evaluated when clicked.
- **File:** `dashboard/src/components/DocumentationView.jsx`

#### Feature: Sidebar Now Links to Documentation
- **Old Behavior:** Sidebar module links (`module-1`, `module-2`, etc.) had no routing target.
- **New Behavior:** All 5 sidebar links now route to `doc-1` through `doc-5`, which renders the deep-dive `DocumentationView` for that module.
- **File:** `dashboard/src/components/Sidebar.jsx`

#### Feature: 📖 Docs Button Added to Module Cards
- A new **"📖 Docs"** button was added to every `ModuleCard` footer alongside the existing "Show Logs" and "👁️ Show Details" buttons.
- Clicking it calls `onShowDocs()` which sets `activeView` to `doc-{id}`.
- **Files:** `dashboard/src/components/ModuleCard.jsx`, `dashboard/src/App.jsx`

---

### 4. GitHub Release — v3.0.0
- A full GitHub Release draft was provided for `v3.0.0` titled **"SOC Pulse v3.0.0: The Command Center Update"**.
- The release notes cover: No-Hang Orchestrator, Glassmorphic React Dashboard, State Preservation, 5 module upgrades, and production validation on `t2.large`.

---

## Current File Architecture of Key Components

```
dashboard/src/
├── App.jsx                          — Main router. Sets activeView to 'doc-{id}', 'details-{id}', or 'dashboard'
├── components/
│   ├── Sidebar.jsx                  — Left nav; all module links route to doc-{id} views
│   ├── ModuleCard.jsx               — Each card has: Run, Show Logs, 📖 Docs, and 👁️ Show Details buttons
│   └── DocumentationView.jsx        — 5 module deep-dive docs using renderContent() functions (NOT JSX objects)
```

---

## Routing Architecture in App.jsx

| `activeView` Value | What Renders |
|---|---|
| `dashboard` | Main module card grid |
| `doc-1` to `doc-5` | `DocumentationView` for that module |
| `details-1` to `details-5` | Wazuh-style post-run details view |

---

## Git Commits Made This Session (Latest First)

| Commit | Message |
|---|---|
| `d5afbcd` | fix: rewrite DocumentationView to prevent blank screen crash |
| `6339eef` | feat: link sidebar and module cards to documentation views |
| `471baf7` | docs: simplify Acknowledgments to gensecaihq and alokemajumder |
| `726ab36` | docs: add Acknowledgments section |
| `287964e` | docs: format hardware requirements and AWS firewall as tables |
| `f0bd30f` | docs: add t2.large hardware requirements and OS specs |
| `42dbfba` | docs: add Why/Unique/Why sections to main README |

---

## Production Deployment Status
- **Platform:** AWS EC2 `t2.large`
- **OS Tested:** Ubuntu 22.04.5 LTS + Ubuntu 24.04.4 LTS
- **Status:** PRODUCTION-READY ✅
- **GitHub Repo:** https://github.com/nextgensoumen/soc-pulse
- **Startup Command:** `./soc-pulse-start.sh` (uses PM2, auto-restarts on reboot)
