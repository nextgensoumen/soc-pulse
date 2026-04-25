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

SOC Pulse consolidates five independent, highly-specialized security disciplines—ranging from Node.js supply-chain monitoring to deep-OS kernel hardening—into a single, highly intuitive Command Center interface. It drastically lowers the barrier to entry for securing cloud assets by giving system administrators a single pane of glass from which to trigger and monitor critical vulnerability assessments natively.

Everything in SOC Pulse is **100% Live Data**. There is zero mock data. All scan history, threat verdicts, module status, and system info are dynamically pulled from real-time execution outputs directly on your server.

---

## ❓ Why is SOC Pulse Needed?

In modern cloud environments, infrastructure is under constant, automated attack from botnets the second an IP address goes public. Traditionally, securing a server required an administrator to piecemeal dozens of disparate scripts—one script for SSL, another for kernel hardening, another to hunt for Node.js backdoors, and entirely different tools to track OS-level vulnerabilities like the XZ-Backdoor or Log4Shell. 

This fragmentation causes **alert fatigue** and leads to severe security misconfigurations. Without a centralized command center, administrators often lack real-time visibility into whether their servers are actively defending themselves or if they have silently been compromised by a supply-chain vulnerability.

SOC Pulse solves this by unifying the entire defensive stack. It removes the necessity of juggling multiple SSH sessions and log files by consolidating everything into a single, automated, and visually dense dashboard.

## 🌟 What Makes It Different and Unique?

Unlike commercial, cloud-hosted security dashboards (like Datadog or CrowdStrike) that require you to install heavy proprietary agents that upload your private code and telemetry to a third-party server, **SOC Pulse runs 100% locally on your own machine.** 

1. **Zero Data Exfiltration:** Your forensic logs, code topologies, and vulnerability scans never leave your EC2 instance. The React dashboard is hosted *by* your server, *for* your server.
2. **AWS Lockout Prevention:** Standard open-source hardening scripts blindly activate firewalls (like UFW) or alter SSH protocols, which violently destroys AWS EC2 Instance Connect access, permanently locking you out of your own server. SOC Pulse was engineered specifically to avoid this, surgically stripping deprecated protocols while maintaining maximum security.
3. **The "No-Hang" Orchestrator:** Terminal scripts often hang on unexpected prompts (like `apt-get` asking for input or DNS failing during an SSL check). Our Node.js orchestrator uses a strictly buffered `child_process` system with `DEBIAN_FRONTEND=noninteractive` to guarantee that the UI never hangs, crashes, or runs out of memory.

## 🎯 Why Use SOC Pulse?

If you are deploying a web application, an API, or a raw cloud server to production, you cannot afford to guess if it is secure. You should use SOC Pulse because it shifts you from a **passive monitoring posture** to an **active defense posture** instantly. 

With one command (`./soc-pulse-start.sh`), you gain the ability to:
* **Stop Credential Stealers:** Catch Typosquatted NPM packages before they execute.
* **Stop Framework Exploits:** Verify your React/Next.js stack isn't vulnerable to CVSS 10.0 RCEs.
* **Stop Brute-Force Attacks:** Automatically ban malicious IPs via Fail2Ban and Kernel Sysctls.
* **Stop Outages:** Track Let's Encrypt SSL certificates before they expire.
* **Auto-Mitigate Zero-Days:** Automatically patch OS vulnerabilities without waiting for human intervention.

It is built for developers and system administrators who want enterprise-grade SOC visibility without the enterprise-grade price tag or complexity.

> 📊 **[View the Full System Workflow & Architecture Diagrams →](./WORKFLOW.md)**
>
> *Includes: End-to-end data flow, module execution lifecycle, OS operation maps, directory structure, and threat coverage mindmap.*
>
> 🔬 **[View the Official Production Validation & Test Report →](./TEST_REPORT.md)**
>
> *Includes: Detailed cross-version Ubuntu testing, SSH lockout prevention validation, and No-Hang guarantees.*
>
> 🧩 **[Deep Dive: Explaining the 5 Security Modules →](./SECURITY_MODULES.md)**
>
> *Includes: A detailed breakdown of every module, why it's needed, how it defends the OS, and exactly what data it feeds to the Dashboard.*

---

## 🏗️ Core Application Architecture

Unlike traditional open-source dashboards that rely on hardcoded mockup data, SOC Pulse is a **living orchestration engine**. The architecture is structurally categorized into three specific planes:

1. **The Visualization Plane (Frontend Dashboard):**
   * Constructed using **React + Vite**, styled with a futuristic, data-dense dark mode aesthetic ("Glassmorphism").
   * **State Preservation:** Uses CSS display toggling to preserve forensic logs even when navigating between modules.
   * **3-Section Wazuh Layout:** Intelligent React parsers dynamically extract terminal output and render it into three distinct visual blocks: 🔴 Problems Found, ✅ Passed Items, and 🖥️ Raw Forensic Logs.
   * Connects dynamically via WebSocket with auto-reconnection algorithms (exponential backoff).

2. **The Orchestration Plane (Node.js API):**
   * Features a detached **Express REST API** coupled directly with a **Socket.io WebSocket** server binding to Port 5000.
   * Leverages internal `child_process.spawn()` commands. When a user tells the dashboard to run a security sweep, the Orchestrator safely executes the corresponding local shell bash/NPM payloads. The raw `stdout/stderr` streams are instantly mirrored via Websockets back directly into UI terminal windows.
   * **The "No-Hang" Guarantee:** Features hard-timeouts, strict memory buffering (caps at 2000 lines to prevent OOM errors), and headless execution (`DEBIAN_FRONTEND=noninteractive`) to ensure OS tasks never crash the dashboard.

3. **The Defensive Plane (The Micro-Modules):**
   * 5 natively compiled, locally-executed security modules. We specifically stripped outer-internet dependencies from these modules to ensure your SOC is impervious to secondary supply-chain exploitation during audits.

---

## ⚙️ The Security Array (Integrated Threat Modules)

SOC Pulse replaces generalized security "playbooks" with automated, highly-focused cloud defense modules:

### 1. 🛡️ Supply Chain Defense (`module-supply-chain-defense`)
**Threat Mitigated:** Node Package Manager (NPM) supply chain attacks, Typosquatting, and Credential Stealers.
* **The Intelligence:** Uses the Shai-Hulud 2.0 heuristics engine to aggressively scan local `package.json` configurations against a database of roughly 790+ known compromised packages. 
* **The Dashboard Output:** The dashboard employs a custom brace-counting parser to extract the JSON output directly from the Bash stream. It highlights compromised packages and automatically generates the exact `npm uninstall` commands required to remediate the threat.

### 2. 🌐 Web App Scanner (`module-webapp-scanner`)
**Threat Mitigated:** CVE-2025-55182 (CVSS 10.0 Remote Code Execution).
* **The Intelligence:** A localized DAST executor that evaluates React Server Components (RSC) and Next.js topologies. It hunts for an extremely dangerous RSC Flight protocol parsing error that allows unauthenticated hackers to execute terminal commands on your server, bypassing standard network firewalls (WAFs).
* **The Dashboard Output:** Dynamically maps out the web application's framework architecture (e.g., Client-Only vs App Router) and provides a definitive "Safe" or "Vulnerable" verdict without ever sending your proprietary code to a 3rd party API.

### 3. 🔐 System Endpoint Hardening (`module-aws-hardening`)
**Threat Mitigated:** Brute-force SSH attacks, IP Spoofing, File Tampering, and Privilege Escalation.
* **The Intelligence:** An autonomous OS configuration engine that detects your Ubuntu version (22.04 LTS or 24.04 LTS) and natively locks down the kernel. It enforces Sysctls, AIDE, Fail2Ban, and AuditD.
* **AWS Lockout Prevention:** Standard scripts overwrite `sshd_config` with deprecated `Protocol 2` and `HostKey` directives, destroying **AWS EC2 Instance Connect** on OpenSSH 9.x. Our engine strips these out and dynamically stages UFW without enabling it, ensuring 100% SSH availability post-hardening.
* **The Dashboard Output:** Uses an Emoji Matrix Parser to visually render a live Service Health Grid of all successfully started daemons.

### 4. 🩹 Autonomous CVE Remediation (`module-ir-cve-patcher`)
**Threat Mitigated:** 7 Critical OS-level vulnerabilities (RCE & LPE).
* **The Intelligence:** A headless rapid-response tracker that runs behavioral exploit tests natively on the machine and mitigates vulnerabilities without human intervention.
* **Tracked CVEs:**
  - **CVE-2024-3094 (XZ-Backdoor):** Analyzes `liblzma` and downgrades.
  - **CVE-2024-6387 (regreSSHion):** Secures `LoginGraceTime 0`.
  - **CVE-2021-4034 (PwnKit):** Strips SUID from `pkexec`.
  - **CVE-2021-3156 (Baron Samedit):** Tests `sudoedit` heap overflow.
  - **CVE-2023-4911 (Looney Tunables)** & **CVE-2022-0847 (Dirty Pipe)** & **CVE-2021-44228 (Log4Shell)**
* **The Dashboard Output:** Separates vulnerabilities into three distinct UI categories (Vulnerable, Patched, Safe). It utilizes mathematical fallback counters to ensure the Total Scanned metric is always perfectly accurate even if Regex encounters unexpected Bash output.

### 5. 🔑 Machine IP Cryptography (`module-aws-ssl-manager`)
**Threat Mitigated:** Expired Certificates, Let's Encrypt outages, Weak TLS Ciphers.
* **The Intelligence:** As of July 2025, Let's Encrypt allows SSL certs on public AWS IPv4 addresses. However, they expire every 6 days. We completely rewrote the standard Bash auditor into a **Zero-Network Node.js engine (`audit.js`)**. It checks 8 distinct cryptographic factors locally, completely avoiding the DNS hanging issues that plague AWS EC2 VPCs.
* **The Dashboard Output:** Strips ANSI color codes and parses the data into a stunning, interactive 8-Stage Audit Grid, providing immediate warnings for broken Cron renewal jobs.

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
├── /module-ir-cve-patcher      - Automated 7-CVE Mitigation Scripts
├── /module-supply-chain-defense- Shai-Hulud malicious dependency sniffer
├── /module-webapp-scanner      - React2Shell remote exploitation defensive suite
└── soc-pulse-start.sh          - The primary runtime bootloader
```

---

## 🚀 Step-by-Step Deployment Guide

SOC Pulse is designed as a "One-Command Deployment" ecosystem. It automatically handles system packages, Node.js installations, Process Managers (PM2), and compiling.

### Hardware & OS Requirements
To ensure the Node.js orchestrator and React dashboard run flawlessly during intensive security sweeps, the following baseline is required (and officially tested):

| Requirement | Specification | Justification |
|---|---|---|
| **Operating System** | Ubuntu 22.04 LTS or 24.04 LTS | Certified for kernel compatibility and OpenSSH 9.x behaviors. |
| **Instance Type** | AWS `t2.large` (2 vCPUs, 8 GB Memory) | Prevents Node.js Out-Of-Memory (OOM) errors during heavy DAST sweeps. |
| **Storage** | Minimum 20 GB gp2/gp3 SSD | Accommodates Node modules, OS file backups, and heavy log retention. |

### Prerequisite: AWS Security Group (Firewall)
Before deploying, you **MUST** open the following inbound ports in your AWS EC2 Security Group:

| Port | Protocol | Purpose | Required For |
|---|---|---|---|
| **22** | TCP | SSH Access | Remote server management and command-line execution. |
| **5000** | TCP | Backend API & WebSocket | Live streaming of terminal logs to the frontend orchestrator. |
| **5173** | TCP | React Dashboard | Accessing the SOC Pulse graphical user interface. |
| **80** | TCP | HTTP-01 ACME Challenge | *Optional:* Only required for issuing Let's Encrypt IPv4 Certificates. |

### Step 1: Clone the Repository
SSH into your Ubuntu Server and switch to the root user, then clone the repository:
```bash
sudo su -
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse
```

### Step 2: Grant Execution Permissions
Ensure the bootloader and underlying bash modules are allowed to execute:
```bash
chmod +x soc-pulse-start.sh
```

### Step 3: Run the Master Bootloader
Launch the automated setup sequence:
```bash
./soc-pulse-start.sh
```

#### What happens during setup?
1. **System Prep:** Quietly updates `apt` packages, suppresses interactive OS prompts, and safely installs Node.js v20 LTS.
2. **Process Manager:** Installs PM2 globally. This keeps the SOC Pulse backend and frontend running forever, even if you close your terminal.
3. **Compilation:** Safely navigates into isolated modules, installs dependencies, and compiles TypeScript logic into executable binaries.
4. **Daemon Launch:** Triggers PM2 to fork the Backend and Dashboard into background daemons.

### Step 4: Access the Dashboard
Once the script successfully completes, navigate to your public AWS IP in your browser:
```text
http://<YOUR-AWS-PUBLIC-IP>:5173
```

---

## 🔄 Updating, Restarting, and Managing the Server

Because SOC Pulse runs via **PM2**, the services will survive server reboots and SSH disconnects. If you push new code to GitHub, or need to debug an issue, use these exact commands.

### How to pull new code and restart (The "Update" Command)
If the repository has been updated, run this to pull changes and restart the application seamlessly. *(Note: We use `git checkout` first to discard any local modifications to the live scan history data, preventing git merge conflicts).*
```bash
cd /home/ubuntu/soc-pulse
git checkout backend/data/scan-history.json
git pull
pm2 restart all
```

### Essential PM2 Commands
```bash
# View the status of all running SOC Pulse services
pm2 list

# Watch a live, continuous stream of system logs (Ctrl+C to exit)
pm2 logs

# Restart specifically the backend API
pm2 restart soc-pulse-backend

# Restart specifically the React frontend
pm2 restart soc-pulse-dashboard

# Stop everything temporarily
pm2 stop all
```

---

## 🛠️ Troubleshooting & Common Issues

**1. I can't access the dashboard (Site can't be reached)**
* **Fix:** Check your AWS Security Group. Ensure **Inbound TCP Port 5173** is allowed from `0.0.0.0/0` (or your IP). 

**2. The dashboard loads, but modules won't run or show "Offline"**
* **Fix:** The frontend cannot reach the backend. Ensure **Inbound TCP Port 5000** is allowed in your AWS Security Group. 
* **Fix:** Check if the backend crashed by running `pm2 list` and `pm2 logs soc-pulse-backend`.

**3. "Address already in use" error during setup**
* **Fix:** Something else is running on port 5000 or 5173. The `soc-pulse-start.sh` script attempts to kill blocking processes automatically, but you can manually force clear them: `fuser -k 5000/tcp` and `fuser -k 5173/tcp`, then run `./soc-pulse-start.sh` again.

**4. A module is stuck on "Running" indefinitely**
* **Fix:** Click "Stop Execution" on the dashboard. If the UI is out of sync, refresh the page. The system is designed with hard-timeouts (e.g., 5 mins for Scanners) and will self-terminate hung processes automatically.

---

## 🙏 Acknowledgments

SOC Pulse integrates and builds upon several specialized open-source security tools. We would like to acknowledge the following organizations and developers for their foundational engines that power this command center:

* **[gensecaihq](https://github.com/gensecaihq):** For providing the core engines utilized in the System Endpoint Hardening, Supply Chain Defense, and Web App Scanner modules.
* **[alokemajumder](https://github.com/alokemajumder):** For the vulnerability checking and mitigation scripts utilized within the Autonomous Remediation engine.
