# 🌐 Module 2: Web App Scanner

## 🔍 What is it?
This module is a localized Dynamic Application Security Testing (DAST) suite specifically built to hunt for **CVE-2025-55182**—a catastrophic Remote Code Execution (RCE) vulnerability found in React Server Components.

## 🛑 Why is it needed?
Unauthenticated attackers can exploit improperly configured React Server Components to execute arbitrary terminal commands directly on your Node.js server. Because this is a framework-level application flaw, traditional network firewalls and Web Application Firewalls (WAFs) cannot easily block it. 

## ⚙️ How does it work?
The module safely evaluates your web directory's framework topology without sending your code to third-party APIs. It scans the internal project configuration to check if Next.js App Router or React Server Components are actively enabled, and exposes whether the server is improperly serializing components.

## 🛡️ How does it help the SOC?
It gives the SOC absolute visibility into the application layer. Rather than guessing if a web app is vulnerable to the latest CVSS 10.0 exploit, the SOC gets a definitive "Vulnerable" or "Safe" verdict based on local topology analysis. It prevents the SOC from relying on external penetration testers to verify a patch.

---

## 📊 Application Risk Assessment (Table Format)

| Framework Topology | Risk Level | Reason | SOC Impact |
|---|---|---|---|
| **React (Client-Only)** | 🟢 LOW | Runs purely in the user's browser. | Safe. No server components to exploit. |
| **Next.js (Pages Router)** | 🟡 MEDIUM | Server-Side Rendering (SSR) enabled, but no RSC. | Safe from this specific CVE, but requires monitoring. |
| **Next.js (App Router)** | 🔴 HIGH | React Server Components active. | Highly vulnerable to CVE-2025-55182 if unpatched. |

---

## 🚀 What is Unique About This Project's Dashboard?
* **Zero Third-Party Dependency:** Unlike commercial DAST scanners that upload your code to the cloud for analysis, the SOC Pulse dashboard orchestrates this scanner locally on your AWS instance, ensuring zero proprietary code leakage.
* **Intelligent Framework Mapping:** The dashboard doesn't just say "Safe". It dynamically maps *why* the project is safe by rendering the underlying framework topology (e.g., Client-only vs App Router).

## 🛠️ What We Modified & Engineered
The base `react2shell-scanner` was modified to integrate seamlessly into an autonomous SOC environment:
* **No-Exit Execution:** We added the `--no-exit-on-vuln` flag. Originally, the scanner would exit the node process if a vulnerability was found, which would crash our WebSocket connection. Our modification allows the scanner to finish gracefully so the dashboard can report the threat.
* **JSON Boundary Parsing:** We built a custom parser in `WebAppScannerDetails.jsx` that slices the exact JSON payload boundaries from the stdout stream, filtering out NPM execution noise.

---

## 🖥️ Dashboard Features: What It Actually Shows
When you click **"Show Details"** in the SOC Pulse Dashboard, you are presented with a highly-structured, 3-section Wazuh-inspired interface:

1. **🔴 Problems Found (Actionable Intelligence):** 
   * If vulnerable, it explicitly lists the Next.js projects at risk.
   * Provides auto-generated mitigation flags and `npm update` paths to secure the React Server Components instantly.
2. **✅ Passed Items:** 
   * **🔎 CVE Knowledge Card:** A plain-English educational box explaining what CVE-2025-55182 is and how the exploit works.
   * Explains *why* the server passed (e.g., "No Server Components active").
3. **🖥️ Raw Forensic Logs:** 
   * A collapsible toggle revealing the exact JSON and stdout streams from the binary execution, allowing SOC engineers to verify the scanner's raw output.
