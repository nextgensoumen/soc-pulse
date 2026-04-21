# deep-analysis: module-webapp-scanner 

## Overview
This module acts as the core Web Application vulnerability scanner endpoint for the SOC Pulse Orchestrator. It specifically targets **CVE-2025-55182** (the highly critical CVSS 10.0 React2Shell vulnerability that exploits React Server Components).

## Vulnerability Specifics
The flaw fundamentally involves manipulating the payload decryption phase of `react-server-dom-webpack` and specific versions of `next` (Next.js v15 to v16). Unauthenticated hackers send malicious server-action flight protocols that execute direct root-level payloads on the host processing the mutation. Because SOC Pulse features a React Dashboard frontend, hardening the user interface boundary layer is vital.

## The Architectural Refactor
Originally the node orchestration backend (`api.js`) simply triggered an external CLI payload via `npx react2shell-guard`. This fundamentally poses a supply chain risk, as downloading executable scanner packages over `npm` on demand dynamically connects to uncontrollable remote registries.

*   **Compilation Flow:** We forced the application to securely compile its TypeScript structure locally (`npm run build`). This generated `dist/cli/index.js`, dropping the need to pull `npx` down remotely.
*   **Documentation Adjustments:** We totally overwrote the massive original repository `README.md` and explicitly refactored it to explain why this exists specifically inside the isolated SOC Pulse universe.

## How it Integrates with SOC Pulse
It maps directly to **Module 2** (Web App Security) inside the `backend/routes/api.js` Express router.
When the user clicks "Run Module" via the React Dashboard, the node server intercepts the event and dynamically triggers the fully compiled localized payload:
```bash
node dist/cli/index.js ../dashboard --json
```
The exact output payload parsing your React Dashboard for these unpatched vectors is streamed beautifully back to the UI logger window.
