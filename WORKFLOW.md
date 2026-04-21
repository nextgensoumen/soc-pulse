# 🌐 SOC Pulse — Full System Workflow & Architecture Diagram

> This document provides a complete, end-to-end visual map of how every layer of the SOC Pulse Command Center interacts — from the first browser click to the final bash execution on your Ubuntu AWS server.

---

## 🔁 System Overview Flow

```mermaid
flowchart TD
    User(["👤 Security Analyst\n(Web Browser)"])

    subgraph FRONTEND ["🖥️ Visualization Plane — React + Vite (Port 5173)"]
        direction TB
        UI["Dashboard UI\nApp.jsx"]
        Sidebar["Sidebar.jsx\n(Language: EN / हिन्दी / বাংলা)"]
        ModuleCard["ModuleCard.jsx\n(Run / Stop / Live Logs)"]
        DocView["DocumentationView.jsx\n(Module Deep-Dive Pages)"]
        TopBar["TopBar.jsx"]
        Particles["🌻 FallingSunflowers\nParticle Engine"]
    end

    subgraph BACKEND ["⚙️ Orchestration Plane — Express + Socket.io (Port 5000)"]
        direction TB
        Server["server.js\nHTTP + WebSocket Server"]
        API["api.js\nREST Router /api/modules"]
        Runner["moduleRunner.js\nchild_process.spawn()"]
        Socket["Socket.io\nLive Log Broadcast"]
    end

    subgraph MODULES ["🛡️ Defensive Plane — Security Micro-Modules"]
        direction TB
        M1["🛡️ Module 1\nSupply Chain Defense\n(node dist/index.js)"]
        M2["🌐 Module 2\nWeb App Scanner\n(node dist/cli/index.js)"]
        M3["🔐 Module 3\nSystem Endpoint Hardening\n(bash ubuntu-aws-hardening.sh)"]
        M4["🩹 Module 4\nAutonomous Remediation\n(bash ubuntu-remediate.sh)"]
        M5["🔑 Module 5\nMachine IP Cryptography\n(bash ubuntu-cert-manager.sh)"]
    end

    subgraph OS ["🐧 Ubuntu AWS Host (EC2)"]
        APT["apt-get Package Manager"]
        Kernel["Linux Kernel / Sysctls"]
        FileSystem["File System\n(package.json, lockfiles)"]
        OSRELEASE["/etc/os-release\n(Dynamic OS Detection)"]
        AIDE["AIDE / AuditD / Fail2Ban"]
        XZUtils["xz-utils / liblzma\n(CVE-2024-3094 Check)"]
        Certbot["Certbot / OpenSSL\n(ACME IP Certificate)"]
    end

    User -->|"Clicks module or nav link"| UI
    UI --> Sidebar
    UI --> TopBar
    UI --> ModuleCard
    UI --> Particles
    ModuleCard -->|"Clicks 'View Docs'"| DocView
    ModuleCard -->|"HTTP POST /api/modules/:id/start"| API
    API --> Server
    Server --> Runner
    Runner -->|"Spawns child process"| M1
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
    M3 --> AIDE
    M4 --> XZUtils
    M4 --> APT
    M5 --> Certbot
    M5 --> OSRELEASE
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

    Analyst->>UI: Clicks "Run Module" button
    UI->>API: POST /api/modules/:id/start
    API->>Runner: runModule(id, dir, cmd, args, io)
    Runner->>Script: child_process.spawn(cmd, args, { cwd })
    Script->>OS: Executes on Ubuntu filesystem

    loop Live Log Streaming
        OS-->>Script: stdout / stderr data
        Script-->>Runner: pipe data event
        Runner-->>WS: io.to(module_room).emit('log_stream')
        WS-->>UI: WebSocket push to ModuleCard
        UI-->>Analyst: Live terminal log appears
    end

    Script-->>Runner: Process exits (code 0 or error)
    Runner-->>WS: emit('module_status_change') → Completed / Failed
    WS-->>UI: Status badge updates
    UI-->>Analyst: Module marked as "Completed"
```

---

## 🗂️ What Each Module Actually Does On The OS

```mermaid
flowchart LR
    subgraph M1 ["🛡️ Supply Chain Defense"]
        SC1["Reads package.json\n+ package-lock.json"]
        SC2["795-package threat DB\n(SOC Pulse Scanner)"]
        SC3["JSON Report Output\nto Dashboard"]
        SC1 --> SC2 --> SC3
    end

    subgraph M2 ["🌐 Web App Scanner"]
        WA1["Scans React/Next.js\nProject Structure"]
        WA2["CVE-2025-55182\nRSC Flight Exploit Check"]
        WA3["JSON Vulnerability\nReport Output"]
        WA1 --> WA2 --> WA3
    end

    subgraph M3 ["🔐 System Endpoint Hardening"]
        SH1["apt-get installs\naide, fail2ban, auditd"]
        SH2["Kernel Sysctls\n(ICMP / IPv4 spoof drops)"]
        SH3["Fail2Ban active\nAuditD rules loaded"]
        SH1 --> SH2 --> SH3
    end

    subgraph M4 ["🩹 Autonomous Remediation"]
        AR1["dpkg -l xz-utils\nawk version parse"]
        AR2["CVE-2024-3094\nBackdoor version check"]
        AR3["Safe downgrade or\n'System is Safe' report"]
        AR1 --> AR2 --> AR3
    end

    subgraph M5 ["🔑 Machine IP Cryptography"]
        IP1["/etc/os-release\nDynamic OS Detection"]
        IP2["certbot + openssl\ndependency scan"]
        IP3["/var/log/letsencrypt\nACME cron status"]
        IP1 --> IP2 --> IP3
    end
```

---

## 🏗️ Static Project Directory Map

```mermaid
graph TD
    Root["📁 soc-pulse/"]

    Root --> Boot["📄 soc-pulse-start.sh\n(Master Bootloader)"]
    Root --> License["📄 LICENSE (MIT)"]
    Root --> Readme["📄 README.md"]

    Root --> BE["📁 backend/"]
    BE --> BEServer["server.js\n(Express + Socket.io)"]
    BE --> BERoutes["routes/api.js\n(Module REST Router)"]
    BE --> BEServices["services/moduleRunner.js\n(child_process Engine)"]

    Root --> FE["📁 dashboard/"]
    FE --> FEIndex["index.html\n(Custom Logo Favicon)"]
    FE --> FESrc["📁 src/"]
    FESrc --> FEApp["App.jsx\n(Main Layout + Router)"]
    FESrc --> FECSS["index.css\n(Sunflower Theme)"]
    FESrc --> FEComp["📁 components/"]
    FEComp --> C1["Sidebar.jsx"]
    FEComp --> C2["ModuleCard.jsx"]
    FEComp --> C3["DocumentationView.jsx"]
    FEComp --> C4["TopBar.jsx"]

    Root --> MOD1["📁 module-supply-chain-defense/\n(TypeScript + NCC compiled)"]
    Root --> MOD2["📁 module-webapp-scanner/\n(TypeScript + NCC compiled)"]
    Root --> MOD3["📁 module-aws-hardening/\n(Bash)"]
    Root --> MOD4["📁 module-ir-cve-patcher/\n(Bash)"]
    Root --> MOD5["📁 module-aws-ssl-manager/\n(Bash + Dynamic OS)"]

    Root --> MEM["📁 memory/\n(Architecture Logs)"]
    Root --> SETUP["📁 setup/\n(Dependency Scripts)"]
```

---

## 🔐 Security Threat Coverage Map

```mermaid
mindmap
  root((SOC Pulse))
    Supply Chain
      NPM Dependency Poisoning
      Malicious package.json scripts
      795 known threat signatures
      Lockfile integrity verification
    Web Application
      CVE-2025-55182 RCE
      React Server Component exploit
      RSC Flight protocol abuse
      Next.js mutation injection
    OS Hardening
      Brute Force via Fail2Ban
      ICMP flood protection
      IPv4 source spoofing
      File integrity via AIDE
      Kernel audit via AuditD
    Incident Response
      XZ-Utils backdoor CVE-2024-3094
      liblzma compromised daemon
      Headless apt-get downgrade
      DPkg version parsing
    Cryptography
      Let's Encrypt bare IP certs
      ACME 6-day expiry tracking
      Certbot dependency validation
      OpenSSL version audit
```

---

*Generated by SOC Pulse | Designed & Developed by **ULTRON***
