# deep-analysis: module-webapp-scanner

## Overview
The `module-webapp-scanner` is internally known as **react2shell-guard**. It is a specialized, proactive defensive security orchestrator built entirely to combat a massive new zero-day known as **CVE-2025-55182 (React2Shell)**.

*Context:* Discovered recently in late 2025, CVE-2025-55182 is a CVSS 10.0 (maximum severity) unauthenticated Remote Code Execution (RCE) vulnerability. It exploits how React Server Components (RSC) and frameworks like Next.js decode server payloads sent to React Server Functions via the "Flight" protocol.

## Core Mechanisms
This TypeScript/Node.js module is an all-in-one Swiss Army Knife for defending against React2Shell:

1. **Passive Live URL Fingerprinting:** 
   It has the ability to scan deployed, live applications via URLs. To do this safely, it sends a benign but malformed `multipart/form-data` RSC payload to the server. If the server throws a specific HTTP 500 error matching the React Server Component digest stack trace, the scanner knows the server is unpatched, all without actually exploiting the server.
2. **Local Repository & Container Scanning:**
   It parses offline lockfiles (`package-lock.json`, `yarn.lock`) to determine if your exact `next` or `react-server-dom` versions fall within the highly specific vulnerable windows (like `15.2.0-15.2.5`). It can also locally mount and scan Docker Image layers for these same packages.
3. **Runtime Protection Middleware:**
   Most interestingly, this module isn't just a scanner. It contains actual Express.js and Next.js *protection middleware*. You can inject this scanner in front of your web servers, and it actively monitors incoming web requests to drop malicious Server Action tampering or prototype pollution payloads before they ever hit React.
4. **Auto-Remediation:**
   It features an automated patching system (`react2shell-guard fix`) that safely force-updates NPM dependencies to the patched Next.js sub-versions (e.g., bumping `15.0.x` safely to `15.0.5`).

## Integration with SOC Pulse
In our unified dashboard, this is represented by the **Web App Scanner** card. 
- It is currently flashing with a status of **Scanning** and a **Medium Threat Level**.
- The main button says **"Stop Scan"**, demonstrating that right now, it is likely constantly polling or iterating over your internal AWS URL fleets doing passive fingerprint checks.
