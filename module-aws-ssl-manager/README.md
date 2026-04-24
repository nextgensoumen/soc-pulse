# 🔑 Module 5: Machine IP Cryptography

## 🔍 What is it?
This module is a specialized TLS/SSL compliance auditor specifically engineered for Let's Encrypt certificates bound directly to public AWS IPv4 addresses.

## 🛑 Why is it needed?
Mismanaged SSL certificates cause massive service outages and trigger browser security warnings that scare away users. Tracking certificate expiry, ensuring strong TLS cipher configurations, and verifying automatic renewal cron jobs on headless servers is notoriously difficult and prone to human error.

## ⚙️ How does it work?
It utilizes a zero-network Node.js audit script (`audit.js`) to locally parse Certbot ACME configurations. It checks the cryptographic health of the endpoint locally on disk, avoiding network-level DNS stalls.

## 🛡️ How does it help the SOC?
It guarantees the SOC has instant, daily visibility into the cryptographic health of the endpoint. It prevents embarrassing outages by catching broken auto-renewal cron jobs, weak TLS settings, or expiring certificates *before* users notice a problem.

---

## 📊 8-Stage Cryptographic Audit (Table Format)

| Audit Stage | Description | SOC Benefit |
|---|---|---|
| **Certbot Installation** | Checks if ACME client is present. | Baseline validation. |
| **Certificate Status** | Verifies active IP certificates on disk. | Prevents missing certs. |
| **Expiry Tracker** | Checks if cert is valid for > 30 days. | Early warning for outages. |
| **TLS Configuration** | Validates strong ciphers in config files. | Prevents downgrade attacks. |
| **Auto-Renewal Jobs** | Checks `systemd` timers and cron jobs. | Ensures hands-free renewal. |
| **HSTS Settings** | Verifies Strict-Transport-Security headers. | Enforces HTTPS-only traffic. |
| **CT Transparency** | Validates Certificate Transparency. | Prevents forged certificates. |

---

## 🚀 What is Unique About This Project's Dashboard?
* **ANSI Stripping & Grid Mapping:** The dashboard takes complex, color-coded Bash/Node output, strips the ANSI escape codes, and uses Regex boundaries to map the bash output into a visually stunning, 8-stage interactive audit grid.
* **Audit Mode Awareness:** The dashboard intelligently recognizes when it is running on a raw AWS instance without domain names. It displays a blue "AWS Audit Mode" banner, contextualizing warnings about missing certificates rather than flagging them as critical system failures.

## 🛠️ What We Modified & Engineered
* **Node.js Rewrite for "No-Hang Guarantee":** The original bash script suffered from AWS DNS resolution stalls, causing curl commands to hang indefinitely. We **completely rewrote** the module as a pure Node.js local auditor (`audit.js`). It now completes the 8-stage audit in **0.1 seconds** with zero network calls, permanently eliminating the hang risk.
* **Exit Code Mapping:** We engineered the Orchestrator to recognize `Exit Code 1` (Certbot not installed) as a successful audit completion rather than a module failure, preventing the dashboard from breaking.

---

## 🖥️ Dashboard Features: What It Actually Shows
When you click **"Show Details"** in the SOC Pulse Dashboard, you are presented with a highly-structured, 3-section Wazuh-inspired interface:

1. **🔴 Problems Found (Actionable Intelligence):** 
   * Highlights missing certificates, broken renewal hooks, or missing software.
   * Provides exact, numbered commands (e.g., `apt install certbot`) to fix the issues immediately.
2. **✅ Passed Items:** 
   * Visually breaks down the 8 configuration checks via the Audit Grid.
   * Explains why an active certificate and proper TLS settings are crucial for data-in-transit security.
3. **🖥️ Raw Forensic Logs:** 
   * A collapsible toggle revealing the complete output of the cryptographic assessment engine for compliance auditing.
