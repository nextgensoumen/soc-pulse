<div align="center">
  <img src="./dashboard/public/soc-pulse-logo.png" alt="SOC Pulse Logo" width="160" />
  <h1>SOC Pulse v3.0</h1>
  <p><b>Automated Cloud Security Command Center</b></p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/Platform-AWS%20Ubuntu-orange" alt="Platform" />
  <img src="https://img.shields.io/badge/Architecture-React%20%2B%20Node.js-blue" alt="Architecture" />
</div>

<div align="center">
  <a href="./WORKFLOW.md">
    <img src="https://img.shields.io/badge/📊%20System%20Workflow-View%20Full%20Architecture%20Diagram-FFd600?style=for-the-badge&labelColor=1a1a1a" alt="System Workflow" />
  </a>
</div>

Welcome to **SOC Pulse**, a fully robust, automated, and centralized Security Operations Center (SOC) framework expressly engineered for Amazon Web Services (AWS) Ubuntu EC2 infrastructure.

SOC Pulse consolidates five independent, previously disconnected security disciplines—ranging from Node.js supply-chain monitoring to deep-OS kernel hardening—into a single, highly intuitive Command Center interface. It drastically lowers the barrier to entry for securing cloud assets by giving system administrators a single pane of glass from which to trigger and monitor critical vulnerability assessments natively.

Everything in SOC Pulse is **100% Live Data**. There is zero mock data. All scan history, threat verdicts, module status, and system info are dynamically pulled from real-time execution outputs on your server.

> 📊 **[View the Full System Workflow & Architecture Diagrams →](./WORKFLOW.md)**
>
> *Includes: End-to-end data flow, module execution lifecycle, OS operation maps, directory structure, and threat coverage mindmap.*

---

## 🏗️ Core Application Architecture

Unlike traditional open-source dashboards that rely on hardcoded mockup data, SOC Pulse is a **living orchestration engine**. The architecture is structurally categorized into three specific planes:

1. **The Visualization Plane (Frontend Dashboard):**
   * Constructed using **React + Vite**, styled with a futuristic, data-dense dark mode aesthetic ("Glassmorphism").
   * Connects dynamically via WebSocket with auto-reconnection algorithms (exponential backoff) to remain highly resilient in cloud environments.

2. **The Orchestration Plane (Node.js API):**
   * Features a detached **Express REST API** coupled directly with a **Socket.io WebSocket** server binding to Port 5000.
   * Leverages internal `child_process.spawn()` commands. When a user tells the dashboard to run a security sweep, the Orchestrator safely executes the corresponding local shell bash/NPM payloads. The raw `stdout/stderr` streams are instantly mirrored via Websockets back directly into UI terminal windows.
   * Handles hard-timeouts, forced graceful shutdowns, and memory tracking to prevent long-running OS tasks from halting the server.

3. **The Defensive Plane (The Micro-Modules):**
   * 5 natively compiled, locally-executed security modules. We specifically stripped outer-internet dependencies from these modules to ensure your SOC is impervious to secondary supply-chain exploitation during audits.

---

## ⚙️ The Security Array (Integrated Threat Modules)

SOC Pulse replaces generalized security "playbooks" with automated, highly-focused cloud defense modules:

### 1. 🛡️ Supply Chain Defense (`module-supply-chain-defense`)
Designed to combat the rise of Node Package Manager (NPM) infiltration.
* **The Intelligence:** Uses a specialized TypeScript heuristic engine (the Shai-Hulud monitor) to aggressively scan local `package.json` configurations against a database of roughly 795 known compromised packages. Unwitting developers occasionally install weaponized sub-dependencies. This checks for those, detecting malware hashes, TruffleHog abuse, and malicious runner code.

### 2. 🌐 Web App Scanner (`module-webapp-scanner`)
A localized DAST (Dynamic Application Security Testing) executor programmed explicitly to hunt the catastrophic **CVE-2025-55182** vulnerability.
* **The Intelligence:** Evaluates React Server Components (RSC) and Next.js mutations. Unauthenticated hackers utilize RSC Flight protocol parsing errors to achieve Remote Code Execution (CVSS 10.0). By using a pre-compiled scan logic node, SOC Pulse validates your own web-tier interfaces without communicating with remote third-party scanners.

### 3. 🔐 System Endpoint Hardening (`module-aws-hardening`)
A customized Ubuntu deployment playbook meant for fortifying the underlying AWS environment **without causing administrative lockouts**.
* **The Intelligence:** Standard Linux Hardening scripts violently block AWS Security Groups via UFW, or override AWS `cloud-init` SSH daemon handshakes, permanently destroying the server connection. Our SOC logic discards TCP blocks and instead locks the OS safely via:
  - **Kernel Sysctls:** Injecting variables to route-drop ICMP payloads and IPv4 spoof attacks.
  - **AIDE:** Tracking critical File Integrity signatures (runs non-interactively).
  - **Fail2Ban:** Stopping sustained brute force attacks mapping on port 22 natively.
  - **AuditD:** Tracing specific malicious modifications to the `/etc/shadow` credential pool.

### 4. 🩹 Autonomous Remediation (`module-ir-cve-patcher`)
A disaster mitigation tracker built exactly for rapid-response to severe OS backdoors and local privilege escalation vulnerabilities.
* **The Intelligence:** Automatically detects and mitigates top-tier OS threats:
  - **CVE-2024-6387 (regreSSHion):** Mitigates by setting `LoginGraceTime 0` securely.
  - **CVE-2021-4034 (PwnKit):** Strips SUID bit from `pkexec` instantly.
  - Also tracks and mitigates **Log4Shell**, **XZ-Backdoor (CVE-2024-3094)**, **Dirty Pipe**, and **Looney Tunables**. It is built to resolve the threat headlessly without throwing blocking GUI prompts on your server.

### 5. 🔑 Machine IP Cryptography (`module-aws-ssl-manager`)
A specialized compliance tracking engine addressing the Let's Encrypt "Public IP Certificate" structure roll-out.
* **The Intelligence:** As of July 2025, AWS administrators can bind valid HTTPS certificates to raw IP addresses. Our manager generates an instant, zero-network Node.js audit of your local Certbot ACME configurations for 6-day IP-Certificate rotations. It checks dependencies, cron renewal jobs, and certificate expiry safely without stalling on cloud DNS resolution issues.

---

## 📂 File System Layout

```text
SOC-Pulse/
├── /backend                    - Express REST router & Child Process Orchestrator
├── /dashboard                  - Vite/React UI & Socket.io listeners
├── /memory                     - Deep-dives on internal engineering decisions & goals
├── /setup                      - Configuration automated installers
├── /module-aws-hardening       - The Endpoint OS protection toolkit
├── /module-aws-ssl-manager     - IP Certbot validation tools & Node.js Auditor
├── /module-ir-cve-patcher      - Automated CVE Mitigation Scripts
├── /module-supply-chain-defense- Shai-Hulud malicious dependency sniffer
├── /module-webapp-scanner      - React2Shell remote exploitation defensive suite
└── soc-pulse-start.sh          - The primary runtime bootloader
```

---

## 🚀 One-Command Cloud Deployment

SOC Pulse is configured to be incredibly easy to spin up on any AWS Ubuntu instance. It comes packed with a global startup orchestrator that maps, patches, updates, and deploys the entire ecosystem instantly.

**1. Clone the Repository on your AWS Ubuntu Instance:**
*(Switch to root user first if desired: `sudo su -`)*
```bash
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse
```

**2. Ensure Execution Permissions:**
```bash
chmod +x soc-pulse-start.sh
```

**3. Launch the Master Bootloader:**
```bash
./soc-pulse-start.sh
```

### What Happens When You Run The Bootloader?
* **Phase 1 (System Prep):** Updates system tools, suppresses interactive dpkg prompts (`DEBIAN_FRONTEND=noninteractive`), and safely installs Node.js v20 LTS.
* **Phase 2 (PM2 Installation):** Installs the PM2 production process manager to keep the backend and dashboard running even after you close your SSH connection.
* **Phase 3 (Module Compilation):** Automatically navigates into isolated TypeScript modules (like the Web App Scanner) and safely auto-compiles the TS logic into executable native binaries.
* **Phase 4 (Launch):** Triggers `pm2` to launch the **Backend API (Port 5000)** and the **Vite Dashboard (Port 5173)**.

### 💻 Accessing the SOC Dashboard
Once the script completes, navigate your browser directly to your AWS instance's IP interface:
```
http://<YOUR-AWS-PUBLIC-IP>:5173
```
*(Ensure that inbound TCP rules for Port 5173 and 5000 are unblocked in your AWS VPC Security Group Console!)*

---

## 🛠️ Management Commands

Because SOC Pulse runs via `pm2`, your services will survive reboots and SSH disconnects. Use these commands to manage the platform from the server:

```bash
# View running SOC Pulse services
pm2 list

# Watch live output logs of the backend/dashboard
pm2 logs

# Restart all SOC Pulse services (useful after git pull)
pm2 restart all
```
