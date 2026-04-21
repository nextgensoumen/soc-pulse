# deep-analysis: module-aws-hardening (formerly module-server-hardening)

## Overview
This module acts as the core Endpoint Protection system for the SOC Pulse Orchestrator. 
The original script (`ubuntu-hardening-24-04.sh`) was a generic playbook for establishing DISA STIG-level security on bare-metal architectures. 

## The Cloud Lockout Problem
The major problem with the original generic script was that it violently overrode UFW (Uncomplicated Firewall) rules to block default traffic, and rewrote `/etc/ssh/sshd_config` to enforce strict cipher usage. Because AWS EC2 instances dynamically rely on `cloud-init` key-pair injections and Security Groups above the OS-layer, executing the previous script would instantly and permanently lock the administrator out of the machine over SSH.

## The AWS-Safe Refactor
This module was extracted and completely redesigned explicitly for AWS Ubuntu configurations (`ubuntu-aws-hardening.sh`).
It safely strips out the locking components (UFW, SSHd) while aggressively preserving:
1. **AIDE Deployment:** Installs and configures file-integrity monitoring.
2. **AuditD Injection:** Injects kernel-level event tracking watching for any modification to `/etc/shadow` and `/etc/passwd`.
3. **ICMP / TCP Sysctls:** Maps `/etc/sysctl.d/99-aws-security.conf` to block IP spoofing, drop malicious ICMP broadcast payloads, and suppress bad SYN flood attacks at the kernel level without interrupting actual cloud traffic.
4. **Fail2ban Integration:** Synchronizes Fail2Ban intrusion detection to automatically ban IPs brute-forcing the primary Port 22 logs (`/var/log/auth.log`).

## How it Integrates with SOC Pulse
It maps directly to **Module 3** (Endpoint Protection) inside the `backend/routes/api.js` Express router.
When a user clicks "Run Module" via the frontend React UI, the node server dynamically invokes:
```bash
sudo ./ubuntu-aws-hardening.sh
```
Because the script was redesigned to be headless and non-interactive, the entire stdout matrix cleanly pipelines back through Socket.io rendering the Kernel Sysctl and Apt-get package installation updates cleanly onto the dashboard!
