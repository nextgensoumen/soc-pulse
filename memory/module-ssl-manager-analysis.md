# deep-analysis: module-ssl-manager

## Overview
The `module-ssl-manager` is a highly advanced, enterprise-grade bash script designed exclusively for managing **Let's Encrypt SSL Certificates for Public IP Addresses.** 

*Context:* According to the internal documentation, Let's Encrypt enabled issuing SSL certificates directly to IP addresses in July 2025 (rather than just domain names). However, these IP certificates are heavily restricted—they are only issued in the staging environment currently and **only last for 6 days** (short-lived certificates).

## Core Mechanisms
The main engine is the massive `letsencrypt-ip-ssl-manager.sh` script, which automates this complex process:

1. **IP Validation:** 
   It strictly validates the target IP. It ensures it is a public IPv4 or IPv6 address and mathematically filters out any private networks (like `192.168.x.x` or `10.x.x.x`).
2. **Aggressive Auto-Renewal:**
   Because the SSL certificates expire in just 6 days, a standard 30-day cron job will result in outages. This script sets up extremely aggressive systemd timers/cron hooks that attempt to automatically renew the certificates **every 4 hours** while hooking into Nginx or Apache to reload the web server.
3. **Disaster Recovery & Redundancy:**
   The script contains enterprise features like automated configuration backups (up to `MAX_BACKUPS=10`), an entirely guided `--emergency` recovery mode, and `--integrity-check` systems to detect file corruption in the certificate pipelines.
4. **Interactive Setup:**
   It contains a full UI wizard inside the terminal (`--setup`) to guide the user through capturing their email, webroot (`/var/www/html`), enabling notifications, and detecting the currently running web server natively.

## How it Integrates with SOC Pulse
In our UI, this is the **Cryptographic Manager** card (currently marked as "Active" with a "Low" threat level). 
- It tracks the 4-hour renewal loop of these certificates.
- The UI contains a **"Force Renew"** action button, which maps directly to executing `./letsencrypt-ip-ssl-manager.sh --force-renew` on your AWS Ubuntu machine to instantly refresh the keys if a compromise is suspected or an outage occurs.
