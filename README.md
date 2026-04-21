# 🛡️ SOC Pulse: Automated Cloud Command Center

Welcome to **SOC Pulse**, a fully automated, standalone Security Operations Center (SOC) orchestrated entirely for AWS Ubuntu cloud nodes. SOC Pulse unites five distinct, traditionally isolated security silos into one cohesive, single-pane-of-glass architecture. 

It is designed to be completely **self-initializing, headless, and isolated**, binding a beautiful React Dashboard to a real-time Express background worker.

## 🏗️ The Architecture

SOC Pulse does not use fake data or mock configurations. When executed, an Express REST/WebSocket orchestrator (`backend/`) dynamically spawns local shell instances of integrated security scripts across five vectors. Their native stdout strings are pipelined safely through Socket.io and pushed cleanly to an interactive Vite frontend (`dashboard/`).

## ⚙️ The Security Array (5 Integrated Modules)

### 1. 🛡️ Supply Chain Defense (`module-supply-chain-defense`)
A TypeScript malware sniffer targeting NPM's latest supply chain vectors. It natively evaluates your `package.json` against known signatures of the infamous Shai-Hulud backdoor logic.
### 2. 🌐 Web App DAST Scanner (`module-webapp-scanner`)
A proactive vulnerability tracker designed exclusively to hunt **CVE-2025-55182**. It aggressively targets React Server Components and Next.js mutations specifically vulnerable to unauthenticated remote code execution.
### 3. 🔐 AWS Endpoint Hardening (`module-aws-hardening`)
A customized Ubuntu deployment playbook. It injects critical Kernel Sysctls to prevent IPv4 spoofing, drops ICMP attacks, links Fail2ban, and configures AIDE/AuditD. Crucially, it completely bypasses dangerous UFW Firewall alterations to guarantee your AWS Security Groups don't brick your EC2 instance.
### 4. 🩹 Incident Remediation (`module-ir-cve-patcher`)
A headless, non-interactive Bash sequence designed for autonomous disaster mitigation. Its primary target is detecting and resolving the devastating `xz-utils` SSH daemon backdoor (CVE-2024-3094) without requiring manual system administrator input.
### 5. 🔑 IP Cryptographic Manager (`module-aws-ssl-manager`)
A specialized compliance tracker built explicitly for Let's Encrypt's rollout of "IP-Only" SSL certificates. Because AWS bare-IP certs require intense 6-day lifespans, this node audits your system dependencies sequentially to guarantee rotational chron-jobs execute without OS-level hallucinations.

## 🚀 One-Click Deployment

SOC Pulse is capable of completely mapping and building its own environment without manual dependency resolving.

**Clone and launch on any fresh Ubuntu/AWS server:**
```bash
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse
chmod +x soc-pulse-start.sh setup/*.sh

# This single command installs APT/Node components, compiles TypeScript, binds the backend to Port 5000, and deploys the Dashboard to Port 5173 over 0.0.0.0.
./soc-pulse-start.sh
```

### Accessing the Dashboard
Once the master configuration sequence finishes, navigate to your server's Public IP globally:
```
http://<YOUR-AWS-PUBLIC-IP>:5173
```
*Note: Ensure your AWS Security Group permits inbound connectivity across TCP Ports 5173 and 5000!*
