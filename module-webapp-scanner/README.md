# 🛡️ SOC Pulse Module: Web App Scanner (React2Shell Guard)

## Overview
This module acts as the core Web Application protection endpoint for the SOC Pulse Orchestrator. It specifically targets **CVE-2025-55182**, an extremely critical (CVSS 10.0) unauthenticated Remote Code Execution (RCE) vulnerability involving React Server Components.

## The Threat Model
Because the SOC Pulse Dashboard is built heavily on React paradigms, we must guarantee our own infrastructure remains safe from the notorious React2Shell vulnerability. Hackers exploit this vulnerability by injecting specialized flight protocols into server component mutations.

## How The Scanner Operates
This module is built completely on TypeScript. 
Before execution, compiling the scanner (via `npm run build`) generates the localized `dist/cli/index.js` sequence. This circumvents the need to download `npx react2shell-guard` dynamically from the internet, protecting SOC pulse gracefully within airgapped or strictly monitored node environments.

The scanner reads internal JSON models, aggressively pattern-matching nested project hierarchies against:
- Vulnerable ranges within `next` (v15.0 to v16.0.6)
- Vulnerable packages of `react-server-dom-webpack`

## Integration with SOC Pulse
The node backend router expressly utilizes Module ID 2 to run standard static analysis dynamically on the neighboring dashboard ecosystem.
```bash
node dist/cli/index.js ../dashboard --json
```
Clicking **[Run Scan]** inside the Dashboard seamlessly streams the output arrays via Websockets, granting you complete visibility into the security architecture of the User Interface!
