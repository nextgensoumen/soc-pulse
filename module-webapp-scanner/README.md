# 🌐 Module 2: Web App Scanner

## What is it?
A localized Dynamic Application Security Testing (DAST) suite specifically built to hunt for **CVE-2025-55182**—a catastrophic vulnerability in React Server Components.

## Why is it needed?
Unauthenticated attackers can exploit improperly configured React Server Components to achieve Remote Code Execution (RCE) on your Node.js server. Because this is a framework-level flaw, traditional network firewalls cannot block it. 

## How does it work?
The module safely evaluates your web directory's framework topology without sending data to third-party APIs. It checks if Next.js App Router or React Server Components are actively enabled and exposes whether the server is improperly serializing components.

## How does it help the SOC?
It gives the SOC absolute visibility into the application layer. Rather than guessing if a web app is vulnerable to the latest CVSS 10.0 exploit, the SOC gets a definitive "Vulnerable" or "Safe" verdict based on local topology analysis.

## What the Dashboard Shows:
* **🔎 CVE Knowledge Card:** A plain-English explanation of what CVE-2025-55182 is and how an attacker might exploit it.
* **🔴 Problems Found:** If vulnerable, it lists the exact Next.js projects at risk and provides upgrade paths or mitigation flags.
* **✅ Passed Items:** If the app uses `react-client-only` or older, non-vulnerable frameworks, it explains *why* the server is safe (e.g., "No Server Components active").
* **🖥️ Raw Forensic Logs:** The exact JSON and stdout streams from the binary.
