# 🔐 Module 3: System Endpoint Hardening

## What is it?
An autonomous Ubuntu Server OS configuration engine. It transforms a standard Ubuntu installation into a hardened, attack-resistant fortress.

## Why is it needed?
Default Linux installations prioritize convenience over security. They lack active file-tampering monitors, fail to block repeated brute-force SSH logins, and possess vulnerable kernel network settings that allow IP spoofing.

## How does it work?
The orchestrator auto-detects your Ubuntu version (e.g., 22.04 LTS vs 24.04 LTS) and applies specific configurations:
* **AIDE:** Creates cryptographic hashes of core system files to detect tampering.
* **Fail2Ban:** Bans IP addresses attempting to brute-force passwords.
* **AuditD:** Watches for privilege escalation attempts.
* **Sysctls:** Hardens the kernel against network flood attacks.
* *Crucially, it is AWS-Aware:* It dynamically stages (but does not activate) UFW firewalls to prevent you from being locked out of AWS EC2 Instance Connect.

## How does it help the SOC?
It provides a standardized, baseline endpoint security posture across your entire cloud fleet with zero manual configuration. The SOC knows the OS is defending itself from automated botnets.

## What the Dashboard Shows:
* **🛡️ Service Health Grid:** A live checklist showing if critical services (`auditd`, `fail2ban`, `clamav`) are actively running post-hardening.
* **✅ Passed Items (Controls Matrix):** Explains all 10 applied configurations (e.g., "Kernel Sysctls", "SSH Daemon") in plain English and describes exactly how they block attackers.
* **⚠️ Info / Warnings:** Explains AWS Safety Mode (why UFW is staged but not enabled) and any missing compliance packages.
* **🖥️ Raw Forensic Logs:** The full terminal execution logs from the hardening run.
