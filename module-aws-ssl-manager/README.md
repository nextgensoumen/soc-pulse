# 🛡️ SOC Pulse Module: AWS IP Certificate Manager

## Overview
This module directly manages HTTPS configurations natively requested directly to your **AWS Public IPv4 Address**.
Because Let's Encrypt only allowed domains until July 2025, enabling bare-IP certificates is a brand new feature necessitating strict, localized Certbot integration. Note that these ACME profiles are currently staged and emit 6-day certificates, requiring aggressive rotation capabilities.

## The Cloud Overengineering Problem
The legacy version of this manager (`module-ssl-manager`) operated an extremely bloated 117KB generic fallback loop to maintain compatibility globally across weird BSD Unix arrays and macOS endpoints.
It severely misdiagnosed Linux Ubuntu nodes inside AWS clusters, generating `Unknown OS` fatal halts. 

## The SOC Pulse Architectural Alignment
We have entirely wiped the massive dependency tree. This extracted logic (`ubuntu-cert-manager.sh`) is built with bare-minimum latency purely to diagnose Certbot dependencies dynamically mapped explicitly to the AWS standard (`apt-get`).

## How it Integrates with SOC Pulse
The node backend (`api.js`) wires Module ID 5 explicitly to map the status flag output here:
```bash
bash ubuntu-cert-manager.sh --status
```
Clicking **[Check Status]** on your Dashboard fires this sequence locally. Because we completely excised the terminal prompts and generic installer bloat, the dependency outputs stream synchronously and natively to the front-end browser DOM without stalling!
