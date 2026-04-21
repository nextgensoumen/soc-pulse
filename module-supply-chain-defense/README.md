# 🛡️ SOC Pulse Module: Supply Chain Defense

## Overview
This module, officially labeled **Supply Chain Defense**, acts as a static vulnerability scanner designed to protect node-based applications against sophisticated supply chain attacks (specifically the Shai-Hulud 2.0 npm backdoor attack).

## Why This Exists in SOC Pulse
Modern Web Services (like the SOC Pulse Dashboard itself) rely on hundreds of massive open-source Node.js libraries managed via `npm`. Supply chain attacks occur when hackers implant stealthy exfiltration tools directly into these public libraries. If your server blindly installs the libraries, it unknowingly brings the hacker's malware securely inside the internal network.

This Node.js/TypeScript-powered scanner works to meticulously parse `package.json` arrays, lockfiles, and `node_module` source distributions on the server.
- It guarantees mathematically accurate **Semantic Version Matching** against a community-sourced database of over 790+ documented compromised dependency states.
- It runs cryptographic `SHA256` hashing to search local files for specific payload structures like hidden `setup_bun.js` scripts that attempt to exfiltrate secret keys.

## Orchestration Details
Originally packaged as a disconnected GitHub Action tool, this module has been cleanly refactored for the isolated ecosystem of SOC Pulse. 
The system does not need to rebuild the TypeScript engine inside this directory; instead, the orchestrator backend (`api.js`) simply triggers the massive pre-compiled payload mapping exactly at `dist/index.js`, targeting external directories.

### Local Execution Target
By default, the Express Backend binds this scanner to specifically protect the main SOC Pulse Dashboard codebase, running identically to the following bash schema:
```bash
node dist/index.js --working-directory="../dashboard"
```
You can invoke this scan directly through the User Interface by clicking **[Run Module]** on Module ID 1. All JSON output logic is strictly bound and streamed seamlessly directly into the web-app interface logs.
