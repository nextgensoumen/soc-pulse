# 🛡️ SOC Pulse Module: AWS Server Hardening

## Overview
This module represents **Endpoint Hardening** via the SOC Pulse Orchestrator. 
The original server-hardening script was a massive, legacy utility designed to forcefully secure bare-metal servers by completely dominating their network firewalls, SSH daemons, and administrative limitations.

## The AWS Cloud Problem
Because Amazon Web Services (AWS) explicitly uses dynamic `cloud-init` configurations and Security Groups, running the legacy script blindly on EC2 instances breaks SSH handshakes and triggers permanent lockouts.

## The SOC Pulse Refactor
This script (`ubuntu-aws-hardening.sh`) is a heavily optimized, cloud-first implementation of the server hardening playbook. It preserves all the brilliant auditing mechanisms while discarding the dangerous network overwrites.

### What it Enforces:
- **Kernel Networking:** It injects deep Linux Kernel Sysctls (`/etc/sysctl.d/99-aws-security.conf`) to actively block IP spoofing, drop malicious ICMP broadcast payloads, and suppress bad SYN attacks.
- **Intrusion Prevention (Fail2Ban):** Protects Port 22 natively by banning IP addresses that attempt brute-force dictionary attacks against your SSH daemon.
- **Audit Logging (AuditD):** Adds kernel-level watchers (`/etc/audit/rules.d/audit.rules`) to monitor and log whenever critical identity files (`/etc/passwd`, `/etc/shadow`) are maliciously modified.
- **Anti-Virus (ClamAV):** Sets up background malware scanning daemons.

### How it Integrates with SOC Pulse
The Express backend explicitly triggers this script via Module ID 3 when requested by the dashboard UI:
```bash
sudo ./ubuntu-aws-hardening.sh
```
All system installations and Sysctl configurations stream natively out to the browser DOM, allowing the Administrator to monitor real-time server patching securely.
