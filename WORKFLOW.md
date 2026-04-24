# 🌐 SOC Pulse — Full System Workflow & Architecture Diagram

> This document provides a complete, end-to-end visual map of how every layer of the SOC Pulse Command Center interacts — from the first browser click to the final bash execution on your Ubuntu AWS server. It has been updated to reflect the final, production-ready architecture.

---

## 🔁 System Overview Flow

```mermaid
flowchart TD
    User(["👤 Security Analyst\n(Web Browser)"])

    subgraph FRONTEND ["🖥️ Visualization Plane — React + Vite (Port 5173)"]
        direction TB
        UI["App.jsx\n(Main Dashboard)"]
        ModuleCard["ModuleCard.jsx\n(Scanner Sweep UI & Live Logs)"]
        DetailsView["Details Dashboards\n(3-Section Wazuh Layout)"]
        Parsers["React State Parsers\n(Regex / JSON Boundary extractors)"]
    end

    subgraph BACKEND ["⚙️ Orchestration Plane — Express + Socket.io (Port 5000)"]
        direction TB
        Server["server.js\nHTTP + WebSocket Server"]
        API["api.js\nREST Router (parseInt ID)"]
        Runner["moduleRunner.js\nchild_process (2000 line memory cap)"]
        Socket["Socket.io\nLive Log Broadcast"]
    end

    subgraph MODULES ["🛡️ Defensive Plane — Security Micro-Modules"]
        direction TB
        M1["🛡️ Module 1\n(node dist/index.js)"]
        M2["🌐 Module 2\n(node dist/cli/index.js)"]
        M3["🔐 Module 3\n(bash ubuntu-hardening-*.sh)"]
        M4["🩹 Module 4\n(bash cve-aws-orchestrator.sh)"]
        M5["🔑 Module 5\n(node audit.js)"]
    end

    subgraph OS ["🐧 Ubuntu AWS Host (EC2)"]
        APT["apt-get / dpkg"]
        Kernel["Sysctls / AIDE / Fail2Ban"]
        FileSystem["Local Code & lockfiles"]
        SSH["sshd_config.d\n(Safe Drop-ins)"]
        Certbot["/etc/letsencrypt\n(SSL Audit)"]
    end

    User -->|"Clicks 'Run Module'"| UI
    UI --> ModuleCard
    ModuleCard -->|"HTTP POST /api/modules/:id/start"| API
    ModuleCard -->|"Clicks 'Show Details'"| DetailsView
    DetailsView --> Parsers
    API --> Server
    Server --> Runner
    Runner -->|"Spawns child process\n(with timeouts)"| M1
    Runner -->|"Spawns child process"| M2
    Runner -->|"Spawns child process"| M3
    Runner -->|"Spawns child process"| M4
    Runner -->|"Spawns child process"| M5
    Runner -->|"stdout/stderr → Socket.io room"| Socket
    Socket -->|"WebSocket emit → log_stream"| ModuleCard

    M1 --> FileSystem
    M2 --> FileSystem
    M3 --> APT
    M3 --> Kernel
    M3 --> SSH
    M4 --> APT
    M4 --> Kernel
    M5 --> Certbot
```

---

## 🔄 Module Execution Lifecycle

```mermaid
sequenceDiagram
    actor Analyst as 👤 Analyst
    participant UI as React Dashboard
    participant WS as Socket.io
    participant API as Express REST API
    participant Runner as moduleRunner.js
    participant Script as Bash / Node Script
    participant OS as Ubuntu Host

    Analyst->>UI: Clicks "Run Module"
    UI->>API: POST /api/modules/:id/start
    API->>Runner: runModule(config)
    Runner->>Script: child_process.spawn(cmd, args, { cwd })
    Script->>OS: Executes securely on Ubuntu (DEBIAN_FRONTEND=noninteractive)

    loop Live Log Streaming
        OS-->>Script: stdout / stderr data
        Script-->>Runner: pipe data event (caps at 2000 lines to prevent OOM)
        Runner-->>WS: io.to(module_room).emit('log_stream')
        WS-->>UI: WebSocket push to ModuleCard
        UI-->>Analyst: Live terminal log renders visually
    end

    Script-->>Runner: Process exits (evaluates against allowedExitCodes)
    Runner-->>WS: emit('module_status_change') → Completed / Failed
    WS-->>UI: Status badge updates
    UI-->>Analyst: Analyst clicks "Show Details" for Forensic view
```

---

## 🗂️ Internal Module Architecture

```mermaid
flowchart LR
    subgraph M1 ["🛡️ Supply Chain Defense"]
        SC1["package.json Scanner"]
        SC2["790+ Threat DB Check"]
        SC3["SupplyChainDetails.jsx\n(Brace-Counting JSON Extraction)"]
        SC1 --> SC2 --> SC3
    end

    subgraph M2 ["🌐 Web App Scanner"]
        WA1["Framework Topology Scan"]
        WA2["CVE-2025-55182 (RCE) Check"]
        WA3["WebAppScannerDetails.jsx\n(Payload Boundary Slicer)"]
        WA1 --> WA2 --> WA3
    end

    subgraph M3 ["🔐 Endpoint Hardening"]
        SH1["OS Auto-Detect (22.04/24.04)"]
        SH2["Sysctls + AIDE + Fail2Ban"]
        SH3["SystemHardeningDetails.jsx\n(Emoji Matrix Parser)"]
        SH1 --> SH2 --> SH3
    end

    subgraph M4 ["🩹 CVE Auto-Remediation"]
        AR1["cve-aws-orchestrator.sh"]
        AR2["7 Distinct CVE Scripts\n(e.g., PwnKit, regreSSHion)"]
        AR3["CveRemediationDetails.jsx\n(Safe/Patched Log Parsing)"]
        AR1 --> AR2 --> AR3
    end

    subgraph M5 ["🔑 SSL/IP Cryptography"]
        IP1["node audit.js (Zero Network)"]
        IP2["8-Stage Crypto Validation"]
        IP3["MachineIpCryptoDetails.jsx\n(ANSI Stripping)"]
        IP1 --> IP2 --> IP3
    end
```

---

## 🏗️ Static Project Directory Map

```mermaid
graph TD
    Root["📁 soc-pulse/"]

    Root --> Boot["📄 soc-pulse-start.sh\n(Master Bootloader)"]

    Root --> BE["📁 backend/"]
    BE --> BEServer["server.js"]
    BE --> BEServices["services/moduleRunner.js\n(Process Orchestration)"]

    Root --> FE["📁 dashboard/src/"]
    FE --> FEApp["App.jsx\n(State Preservation)"]
    FE --> FEDet["📁 components/details/\n(3-Section Parsers)"]
    FEDet --> C1["SupplyChainDetails.jsx"]
    FEDet --> C2["WebAppScannerDetails.jsx"]
    FEDet --> C3["SystemHardeningDetails.jsx"]
    FEDet --> C4["CveRemediationDetails.jsx"]
    FEDet --> C5["MachineIpCryptoDetails.jsx"]

    Root --> MOD1["📁 module-supply-chain-defense/\n(TypeScript)"]
    Root --> MOD2["📁 module-webapp-scanner/\n(TypeScript)"]
    Root --> MOD3["📁 module-aws-hardening/\n(Bash: ubuntu-hardening-*.sh)"]
    Root --> MOD4["📁 module-ir-cve-patcher/\n(Bash: cve-aws-orchestrator.sh)"]
    Root --> MOD5["📁 module-aws-ssl-manager/\n(Node: audit.js)"]

    Root --> MEM["📁 memory/ & 📁 setup/"]
```

---

## 🔐 Security Threat Coverage Map

```mermaid
mindmap
  root((SOC Pulse))
    Supply Chain
      NPM Dependency Poisoning
      Typosquatting
      790 known threat signatures
      TruffleHog credential stealing
    Web Application
      CVE-2025-55182 RCE
      React Server Component exploit
      Next.js mutation injection
    OS Hardening
      Brute Force via Fail2Ban
      ICMP flood protection
      File integrity via AIDE
      AWS EC2 SSH Lockout Prevention
    Incident Response
      CVE-2024-3094 XZ-Backdoor
      CVE-2024-6387 regreSSHion
      CVE-2021-4034 PwnKit
      CVE-2023-4911 Looney Tunables
      CVE-2021-3156 Baron Samedit
      CVE-2022-0847 Dirty Pipe
      CVE-2021-44228 Log4Shell
    Cryptography
      Let's Encrypt bare IP certs
      Zero-Network ACME validation
      Certbot dependency validation
      TLS/SSL Downgrade defense
```

---

*Generated by SOC Pulse | Production Grade Architecture*
