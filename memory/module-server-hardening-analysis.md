# deep-analysis: module-server-hardening

## Overview
The `module-server-hardening` module is a massive, production-grade bash scripting suite designed to automatically configure an Ubuntu Linux server to meet enterprise security compliance standards (like DISA-STIG and CIS Benchmarks).

## The Scripts
The module contains three separate shell scripts optimized for different generations of Ubuntu:
1. `ubuntu-hardening-original.sh` (For legacy Ubuntu 18.04 up to 22.04)
2. `ubuntu-hardening-24-04.sh` (For Ubuntu 24.04 LTS "Noble Numbat", utilizing modern systemd timers)
3. `ubuntu-hardening-25.sh` (For bleeding-edge Ubuntu 25.x, using Chrony NTS validation, Cgroup v2, and Intel TDX)

## Core Security Implementations
Depending on your AWS Ubuntu Linux version, executing the appropriate script applies massive architectural lock-downs across the board:

1. **Intrusion & Rootkit Prevention:**
   - Installs and configures `Fail2Ban`, `rkhunter` (Rootkit Hunter), and `chkrootkit`.
   - Disables password-based SSH authentication entirely (forcing SSH Keys only) to prevent brute force attacks.
2. **File Integrity Monitoring (AIDE):**
   - Initializes a baseline cryptographically hashed database of all system files. It scans daily via a `systemd` timer to detect if a hacker silently replaced a core binary (like `/bin/login`).
3. **Advanced Auditing (`auditd`):**
   - Applies an enormous payload of `auditd` rules specifically targeting "Living Off The Land" (LOTL) attacks. It immediately alerts if users execute dangerous commands (like arbitrary `curl | sh`, `scp` data exfiltration, `base64` obfuscation, or privileged container escape methods).
4. **Malware / Access Controls:**
   - Configures `ClamAV` daemon with CPU restrictions (cgroups) for background virus scanning.
   - Enforces strict `AppArmor` profiles across critical services so compromised apps cannot perform out-of-bounds operations.
5. **Firewall (`ufw`):**
   - Enforces a default deny-all incoming traffic policy, allowing only rate-limited SSH. 

## Integration with SOC Pulse
In the unified dashboard, this is the **Endpoint Hardening** card. 
- It tracks whether your infrastructure is properly aligned with these strict security checklists. 
- It currently shows a status of **"Patched"** (meaning the system is compliant) and clicking "Verify Rules" would trigger a quick audit (likely via `Lynis` or `OpenSCAP`, which are also installed by this script) to ensure the hardening configurations haven't drifted over time.
