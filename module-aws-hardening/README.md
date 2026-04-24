# 🔐 Module 3: System Endpoint Hardening

## 🔍 What is it?
This module is an autonomous Ubuntu Server OS configuration engine. It runs locally to transform a standard, vulnerable Ubuntu installation into a hardened, attack-resistant fortress.

## 🛑 Why is it needed?
Default Linux installations prioritize convenience over security. Out of the box, they lack active file-tampering monitors, fail to block repeated brute-force SSH logins, and possess vulnerable kernel network settings that allow IP spoofing. If a server is exposed to the public internet, it will be brute-forced within minutes.

## ⚙️ How does it work?
The orchestrator auto-detects your specific Ubuntu version (e.g., 22.04 LTS vs 24.04 LTS) and routes to the correct hardening playbook. It actively modifies kernel parameters, installs security daemons, and locks down SSH configurations.

## 🛡️ How does it help the SOC?
It provides a standardized, baseline endpoint security posture across your entire cloud fleet with zero manual configuration. The SOC knows definitively that the OS is actively defending itself from automated botnets and privilege escalation attempts.

---

## 📊 Applied Security Controls (Table Format)

| Control | Description | Threat Mitigated |
|---|---|---|
| **Fail2Ban** | Monitors logs and bans IPs with repeated failed logins. | Brute-force SSH attacks. |
| **AIDE** | Creates cryptographic hashes of core system files. | Undetected file tampering / Rootkits. |
| **AuditD** | Watches for unauthorized access to `/etc/shadow`. | Privilege escalation. |
| **Kernel Sysctls** | Blocks ICMP broadcasts and routes IPv4 spoof drops. | Network flood attacks / IP spoofing. |
| **SSH Hardening** | Disables password auth and root login. | Unauthorized remote access. |

---

## 🚀 What is Unique About This Project's Dashboard?
* **Emoji-Based Matrix Extraction:** The terminal logs for system hardening are incredibly noisy (500+ lines of `apt-get` installs). Our dashboard uniquely filters out all this noise and targets specific emojis (`✅`, `⛔`) from the summary box to build a clean, visual Controls Matrix in real-time.
* **Educational Explanations:** The dashboard doesn't just say "Sysctls applied." It uses a custom `CONTROL_KNOWLEDGE` map to explain in plain English exactly what the control is and how it protects the server.

## 🛠️ What We Modified & Engineered
This is one of the most heavily engineered modules in the project, specifically modified for **AWS Cloud Safety**:
* **SSH Lockout Prevention:** Standard hardening scripts write deprecated `Protocol 2` and `HostKey` directives into drop-in config files. On modern Ubuntu 24.04 (OpenSSH 9.x), this causes the SSH daemon to crash, permanently breaking **AWS EC2 Instance Connect**. We surgically stripped these directives to guarantee 100% SSH availability post-hardening.
* **Headless APT Execution:** We engineered `DEBIAN_FRONTEND=noninteractive` and `NEEDRESTART_MODE=a` to suppress Ubuntu's blocking purple dialogue boxes, ensuring the orchestrator never hangs.
* **AWS UFW Safety Mode:** We dynamically stage (but intentionally do not activate) UFW firewalls. AWS Security Groups already handle ingress; enabling UFW on top often causes administrative lockouts.

---

## 🖥️ Dashboard Features: What It Actually Shows
When you click **"Show Details"** in the SOC Pulse Dashboard, you are presented with a highly-structured, 3-section Wazuh-inspired interface:

1. **🔴 Problems Found (Actionable Intelligence):** 
   * Highlights missing compliance packages (like OpenSCAP) and explains how to manually install them.
   * Displays an **AWS Safety Banner** explaining why UFW was intentionally bypassed to prevent lockouts.
2. **✅ Passed Items:** 
   * **🛡️ Service Health Grid:** A live checklist showing if critical services (`auditd`, `fail2ban`, `clamav`) successfully started post-hardening.
   * Explains all 10 applied configurations in plain English.
3. **🖥️ Raw Forensic Logs:** 
   * A collapsible toggle revealing the full terminal execution logs from the entire hardening run, allowing administrators to audit the exact `sysctl` and `apt` commands executed.
