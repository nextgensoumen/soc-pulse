<div align="center">
  <img src="./dashboard/public/soc-pulse-logo.png" alt="SOC Pulse Logo" width="160" />
  <h1>SOC Pulse: Automated Cloud Security Command Center</h1>
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

> 📊 **[View the Full System Workflow & Architecture Diagrams →](./WORKFLOW.md)**
> 
> *Includes: End-to-end data flow, module execution lifecycle, OS operation maps, directory structure, and threat coverage mindmap.*

---

## 🏗️ Core Application Architecture 

Unlike traditional open-source dashboards that rely on hardcoded mockup data, SOC Pulse is a **living orchestration engine**. The architecture is structurally categorized into three specific planes:

1. **The Visualization Plane (Frontend Matrix):**
   * Constructed using **React + Vite**, styled with a futuristic, data-dense dark mode aesthetic ("Glassmorphism").
   * Connects dynamically via the `window.location.hostname` variable, guaranteeing that deploying into random AWS subnets never breaks routing references back to localhost.
   
2. **The Orchestration Plane (Node.js API):**
   * Features a detached **Express REST API** coupled directly with a **Socket.io WebSocket** server binding to Port 5000.
   * Leverages internal `child_process.spawn()` commands. When a user tells the dashboard to run a security sweep, the Orchestrator safely executes the corresponding local shell bash/NPM payloads. The raw `stdout/stderr` streams are instantly mirrored via Websockets back directly into UI terminal windows.

3. **The Defensive Plane (The Micro-Modules):**
   * 5 natively compiled, locally-executed modules. We specifically stripped outer-internet dependencies (`npx` commands and generalized MacOS/BSD installer scripts) from these modules to ensure your SOC is impervious to secondary supply-chain exploitation during audits.

---

## ⚙️ The Security Array (Integrated Threat Modules)

SOC Pulse replaces generalized security "playbooks" with automated, highly-focused cloud defense modules:

### 1. 🛡️ Supply Chain Defense (`module-supply-chain-defense`)
Designed to combat the rise of Node Package Manager (NPM) infiltration. 
* **The Intelligence:** Uses a specialized TypeScript heuristic engine (the Shai-Hulud monitor) to aggressively scan local `package.json` configurations against a database of roughly 795 known compromised packages. Unwitting developers occasionally install weaponized sub-dependencies. This checks for those.

### 2. 🌐 DAST Web App Scanner (`module-webapp-scanner`)
A localized DAST (Dynamic Application Security Testing) executor programmed explicitly to hunt the catastrophic **CVE-2025-55182** vulnerability.
* **The Intelligence:** Evaluates React Server Components (RCS) and Next.js mutations. Unauthenticated hackers utilize RSC Flight protocol parsing errors to achieve Remote Code Execution. By using a pre-compiled `dist/cli/index.js` scan logic node, SOC Pulse validates your own web-tier interfaces against this 10.0 CVSS vector without communicating with remote third-party scanners.

### 3. 🔐 Cloud Endpoint Hardening (`module-aws-hardening`)
A customized Ubuntu deployment playbook meant for fortifying the underlying AWS environment without causing administrative lockouts.
* **The Intelligence:** Standard Linux Hardening scripts violently block AWS Security Groups via UFW, or override AWS `cloud-init` SSH daemon handshakes, permanently destroying the server connection. Our SOC logic discards TCP blocks and instead locks the OS via:
  - **AIDE:** Tracking critical File Integrity signatures.
  - **Fail2Ban:** Stopping sustained brute force attacks mapping on port 22 natively.
  - **Kernel Sysctls:** Injecting variables to route-drop ICMP payloads and IPv4 spoof attacks.
  - **AuditD:** Tracing specific malicious modifications to the `/etc/shadow` credential pool.

### 4. 🩹 Autonomous Incident Remediation (`module-ir-cve-patcher`)
A disaster mitigation tracker built exactly for rapid-response to severe OS backdoors.
* **The Intelligence:** Its primary focus targets the horrific `xz-utils` backdoor logic (CVE-2024-3094) found in Linux. By parsing DPkg logs silently against localized `awk` conditionals, the module dynamically tracks if your current APT snapshot is operating off a compromised daemon. It is built to resolve the threat headlessly without throwing blocking GUI prompts on your server.

### 5. 🔑 Cryptographic IP Manager (`module-aws-ssl-manager`)
A specialized compliance tracking engine addressing the Let's Encrypt "Public IP Certificate" structure roll-out.
* **The Intelligence:** As of July 2025, AWS administrators can bind valid HTTPS certificates to raw IP addresses rather than domains. However, they expire every 6 days. Our manager verifies the exact status of the ACME configurations, checking Certbot dependency logic sequentially without triggering unnecessary downloads or crashing on unexpected variables.

---

## 📂 File System Layout

```text
SOC-Pulse/
├── /backend                    - Express REST router & Child Process Orchestrator
├── /dashboard                  - Vite/React UI & Socket.io listeners
├── /memory                     - Deep-dives on internal engineering decisions
├── /setup                      - Configuration automated installers
├── /module-aws-hardening       - The Endpoint OS protection toolkit
├── /module-aws-ssl-manager     - IP Certbot validation tools
├── /module-ir-cve-patcher      - Deep-dive XZ-Utils automated patching script
├── /module-supply-chain-defense- Shai-Hulud malicious dependency sniffer
├── /module-webapp-scanner      - React2Shell remote exploitation defensive suite
└── soc-pulse-start.sh          - The primary runtime bootloader
```

---

## 🚀 One-Click Autonomous Deployment

SOC pulse is configured to be incredibly easy to spin up. It comes packed with a global startup orchestrator that maps, patches, updates, and deploys the entire ecosystem instantly.

**1. Clone the Repository on your AWS Ubuntu Instance:**
```bash
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse
```

**2. Ensure Execution Permissions:**
```bash
chmod +x soc-pulse-start.sh setup/*.sh 
```

**3. Launch the Master Bootloader:**
```bash
./soc-pulse-start.sh
```

### What Happens When You Run The Bootloader?
* **Phase 1** checks core system dependencies (curl, python, node, gcc) and inherently upgrades outdated `apt-get` packages securely.
* **Phase 2** automatically navigates into isolated TypeScript modules (like the Web App Scanner), runs `npm install`, and safely auto-compiles the TS logic into executable native binaries via `npm run build`.
* **Phase 3** dynamically initiates the Node REST API endpoint in the background bound to **Port 5000**.
* **Phase 4** triggers the React Webpack compiler and exposes the dashboard UI globally over **0.0.0.0**, accessible directly from **Port 5173**.

### 💻 Accessing the SOC Dashboard
Navigate your browser directly to your AWS instance's IP interface:
```
http://<YOUR-AWS-PUBLIC-IP>:5173
```
*(Ensure that inbound rules for Port 5173 and 5000 are unblocked in your AWS VPC Security Group Console!)*
