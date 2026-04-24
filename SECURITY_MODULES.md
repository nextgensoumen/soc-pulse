# 🛡️ SOC Pulse — Deep Dive: The 5 Security Modules

This document provides a comprehensive breakdown of the 5 specialized security modules that power SOC Pulse. Each module is engineered to address a specific, critical attack vector in modern cloud and application infrastructure. 

---

## 1. 📦 Module 1: Supply Chain Defense (`module-supply-chain-defense`)

### What is it?
A deep-level dependency scanner powered by the Shai-Hulud 2.0 heuristics engine. It scans your local Node.js projects to detect malicious, compromised, or typosquatted NPM packages.

### Why is it needed?
Modern applications rely on hundreds of third-party open-source packages. Attackers frequently hijack legitimate packages or create fake ones with similar names (typosquatting) to steal environment variables, install backdoors, or deploy crypto-miners directly onto your server.

### How does it work?
The module parses your `package.json` and `node_modules` tree, comparing the hashes and names of installed dependencies against a constantly updated threat intelligence database of over 790 known malicious packages (e.g., packages that abuse TruffleHog, steal credentials, etc.). 

### How does it help the SOC?
It shifts security "left" by catching poisoned dependencies *before* they can be executed in a production environment. The SOC receives an immediate, automated alert if a developer inadvertently installs a weaponized package.

### What the Dashboard Shows:
When you click **"Show Details"** in the SOC Pulse Dashboard, you will see a simple, 3-section layout:
* **🔴 Problems Found:** Highlights any compromised package found, explains the threat (e.g., "Data Exfiltration Backdoor"), and provides exact `npm uninstall` commands to neutralize it immediately.
* **✅ Passed Items:** Confirms the exact number of clean packages scanned.
* **📊 Threat DB Stats:** Shows the active database version and the number of known malicious signatures it checked against.
* **🖥️ Raw Forensic Logs:** A toggle to view the complete JSON output from the execution engine for deep analysis.

---

## 2. 🌐 Module 2: Web App Scanner (`module-webapp-scanner`)

### What is it?
A localized Dynamic Application Security Testing (DAST) suite specifically built to hunt for **CVE-2025-55182**—a catastrophic vulnerability in React Server Components.

### Why is it needed?
Unauthenticated attackers can exploit improperly configured React Server Components to achieve Remote Code Execution (RCE) on your Node.js server. Because this is a framework-level flaw, traditional network firewalls cannot block it. 

### How does it work?
The module safely evaluates your web directory's framework topology without sending data to third-party APIs. It checks if Next.js App Router or React Server Components are actively enabled and exposes whether the server is improperly serializing components.

### How does it help the SOC?
It gives the SOC absolute visibility into the application layer. Rather than guessing if a web app is vulnerable to the latest CVSS 10.0 exploit, the SOC gets a definitive "Vulnerable" or "Safe" verdict based on local topology analysis.

### What the Dashboard Shows:
* **🔎 CVE Knowledge Card:** A plain-English explanation of what CVE-2025-55182 is and how an attacker might exploit it.
* **🔴 Problems Found:** If vulnerable, it lists the exact Next.js projects at risk and provides upgrade paths or mitigation flags.
* **✅ Passed Items:** If the app uses `react-client-only` or older, non-vulnerable frameworks, it explains *why* the server is safe (e.g., "No Server Components active").
* **🖥️ Raw Forensic Logs:** The exact JSON and stdout streams from the binary.

---

## 3. 🔐 Module 3: System Endpoint Hardening (`module-aws-hardening`)

### What is it?
An autonomous Ubuntu Server OS configuration engine. It transforms a standard Ubuntu installation into a hardened, attack-resistant fortress.

### Why is it needed?
Default Linux installations prioritize convenience over security. They lack active file-tampering monitors, fail to block repeated brute-force SSH logins, and possess vulnerable kernel network settings that allow IP spoofing.

### How does it work?
The orchestrator auto-detects your Ubuntu version (e.g., 22.04 LTS vs 24.04 LTS) and applies specific configurations:
* **AIDE:** Creates cryptographic hashes of core system files to detect tampering.
* **Fail2Ban:** Bans IP addresses attempting to brute-force passwords.
* **AuditD:** Watches for privilege escalation attempts.
* **Sysctls:** Hardens the kernel against network flood attacks.
* *Crucially, it is AWS-Aware:* It dynamically stages (but does not activate) UFW firewalls to prevent you from being locked out of AWS EC2 Instance Connect.

### How does it help the SOC?
It provides a standardized, baseline endpoint security posture across your entire cloud fleet with zero manual configuration. The SOC knows the OS is defending itself from automated botnets.

### What the Dashboard Shows:
* **🛡️ Service Health Grid:** A live checklist showing if critical services (`auditd`, `fail2ban`, `clamav`) are actively running post-hardening.
* **✅ Passed Items (Controls Matrix):** Explains all 10 applied configurations (e.g., "Kernel Sysctls", "SSH Daemon") in plain English and describes exactly how they block attackers.
* **⚠️ Info / Warnings:** Explains AWS Safety Mode (why UFW is staged but not enabled) and any missing compliance packages.
* **🖥️ Raw Forensic Logs:** The full terminal execution logs from the hardening run.

---

## 4. 🩹 Module 4: Autonomous CVE Remediation (`module-ir-cve-patcher`)

### What is it?
A rapid-response incident remediation tracker and patcher. It scans the operating system for top-tier vulnerabilities and actively patches them without human intervention.

### Why is it needed?
When a massive OS-level vulnerability drops (like the XZ-Backdoor or regreSSHion), system administrators often lack the time to manually SSH into hundreds of servers to apply mitigations.

### How does it work?
It uses individual execution scripts targeted at 7 highly-critical CVEs:
1. **XZ-Backdoor (CVE-2024-3094)**
2. **regreSSHion (CVE-2024-6387)**
3. **PwnKit (CVE-2021-4034)**
4. **Looney Tunables (CVE-2023-4911)**
5. **Baron Samedit (CVE-2021-3156)**
6. **Dirty Pipe (CVE-2022-0847)**
7. **Log4Shell (CVE-2021-44228)**

It runs non-destructive tests to check vulnerability status. If vulnerable, it triggers safe, headless auto-patching logic (e.g., stripping SUID bits or configuring SSH GraceTimes).

### How does it help the SOC?
It turns the SOC from a passive monitoring station into an active defense mechanism. Threat remediation happens in minutes natively on the machine, closing the window of exposure.

### What the Dashboard Shows:
* **🔴 Vulnerable (Action Required):** If a CVE couldn't be auto-patched, it provides manual commands to secure the system.
* **🟢 Patched (Auto-Mitigated):** Shows the exact terminal commands the system ran autonomously to secure the vulnerability.
* **✅ Safe (Not Vulnerable):** Displays the safe version detected on the server alongside a plain-English explanation of the CVE.
* **🖥️ Raw Forensic Logs:** Full output of the behavioral exploit tests and patch executions.

---

## 5. 🔑 Module 5: Machine IP Cryptography (`module-aws-ssl-manager`)

### What is it?
A specialized TLS/SSL compliance auditor for Let's Encrypt certificates bound directly to public AWS IPv4 addresses.

### Why is it needed?
Mismanaged SSL certificates cause massive outages and trigger browser security warnings that scare away users. Tracking certificate expiry and automatic renewal jobs on headless servers is notoriously difficult.

### How does it work?
It utilizes a zero-network Node.js audit script (`audit.js`) to locally parse Certbot ACME configurations. It checks 8 different cryptographic components: Certbot Installation, Status, Expiry, TLS Configuration, Auto-Renewal Jobs, HSTS, Certificate Transparency, and overall Summary.

### How does it help the SOC?
It guarantees the SOC has instant visibility into the cryptographic health of the endpoint. It prevents outages by catching broken auto-renewal cron jobs or expired certificates before users notice.

### What the Dashboard Shows:
* **📊 8-Stage Audit Grid:** Breaks down the 8 configuration checks visually.
* **✅ Passed Items:** Explains why an active certificate and proper TLS settings are crucial for data-in-transit security.
* **🔴 Problems Found:** Highlights missing certificates, broken renewal hooks, or missing software, providing exact commands (e.g., `apt install certbot`) to fix the issues.
* **🖥️ Raw Forensic Logs:** The complete output of the cryptographic assessment engine.
