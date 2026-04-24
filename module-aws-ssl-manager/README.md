# 🔑 Module 5: Machine IP Cryptography

## What is it?
A specialized TLS/SSL compliance auditor for Let's Encrypt certificates bound directly to public AWS IPv4 addresses.

## Why is it needed?
Mismanaged SSL certificates cause massive outages and trigger browser security warnings that scare away users. Tracking certificate expiry and automatic renewal jobs on headless servers is notoriously difficult.

## How does it work?
It utilizes a zero-network Node.js audit script (`audit.js`) to locally parse Certbot ACME configurations. It checks 8 different cryptographic components: Certbot Installation, Status, Expiry, TLS Configuration, Auto-Renewal Jobs, HSTS, Certificate Transparency, and overall Summary.

## How does it help the SOC?
It guarantees the SOC has instant visibility into the cryptographic health of the endpoint. It prevents outages by catching broken auto-renewal cron jobs or expired certificates before users notice.

## What the Dashboard Shows:
* **📊 8-Stage Audit Grid:** Breaks down the 8 configuration checks visually.
* **✅ Passed Items:** Explains why an active certificate and proper TLS settings are crucial for data-in-transit security.
* **🔴 Problems Found:** Highlights missing certificates, broken renewal hooks, or missing software, providing exact commands (e.g., `apt install certbot`) to fix the issues.
* **🖥️ Raw Forensic Logs:** The complete output of the cryptographic assessment engine.
