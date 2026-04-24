# 🛡️ SOC Pulse — Deep Dive: The 5 Security Modules

The SOC Pulse architecture is powered by 5 distinct, highly-specialized security modules. Each module is engineered to address a specific, critical attack vector in modern cloud and application infrastructure. 

For detailed information on how each module works, why it is needed, how it defends the OS, and exactly what data it feeds to the Dashboard, please refer to their dedicated documentation files below:

---

### 📦 [Module 1: Supply Chain Defense](./module-supply-chain-defense/README.md)
* **What it does:** Scans your Node.js projects to detect malicious, compromised, or typosquatted NPM packages using the Shai-Hulud 2.0 heuristics engine.
* **Threats mitigated:** NPM supply chain attacks, data exfiltration backdoors, credential stealers.

### 🌐 [Module 2: Web App Scanner](./module-webapp-scanner/README.md)
* **What it does:** Executes localized Dynamic Application Security Testing (DAST) specifically built to hunt for **CVE-2025-55182** in React applications.
* **Threats mitigated:** Unauthenticated Remote Code Execution (RCE) via React Server Components.

### 🔐 [Module 3: System Endpoint Hardening](./module-aws-hardening/README.md)
* **What it does:** An autonomous Ubuntu Server OS configuration engine that fortifies the kernel, installs AIDE/Fail2Ban/AuditD, and stages UFW without breaking AWS SSH access.
* **Threats mitigated:** Brute-force SSH attacks, IP spoofing, file tampering, unauthorized privilege escalation.

### 🩹 [Module 4: Autonomous CVE Remediation](./module-ir-cve-patcher/README.md)
* **What it does:** A rapid-response incident remediation tracker that scans the OS for top-tier vulnerabilities and actively patches them without human intervention.
* **Threats mitigated:** XZ-Backdoor, regreSSHion, PwnKit, Looney Tunables, Baron Samedit, Dirty Pipe, Log4Shell.

### 🔑 [Module 5: Machine IP Cryptography](./module-aws-ssl-manager/README.md)
* **What it does:** A specialized TLS/SSL compliance auditor for Let's Encrypt certificates bound directly to public AWS IPv4 addresses.
* **Threats mitigated:** SSL/TLS misconfigurations, expired certificates, broken auto-renewal cron jobs, man-in-the-middle attacks.
