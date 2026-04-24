# Backend Architecture — v2.0 (Current State)

## Stack
- Node.js + Express + Socket.io
- Process manager: pm2
- Entry: `backend/server.js`

## Services
| File | Role |
|------|------|
| `server.js` | Express + Socket.io server, process guards, HTTP logging |
| `routes/api.js` | All REST endpoints |
| `services/moduleRunner.js` | Child process spawner + WebSocket streamer |
| `services/scanHistory.js` | Persistent scan history (JSON file, in-memory cache) |
| `services/logger.js` | Structured logger (console + file: logs/backend.log) |
| `config/modules.registry.js` | Module definitions (cmd, args, timeout, threatLevel) |

## REST API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Server health + uptime + memory |
| GET | /api/stats | Platform-wide threat counts |
| GET | /api/system/info | OS, kernel, CPU, RAM info |
| GET | /api/modules | All modules + status + stats |
| GET | /api/modules/active | Currently running module IDs |
| GET | /api/modules/stats | Platform threat aggregation |
| GET | /api/modules/history | Last N scans (all modules) |
| GET | /api/modules/:id | Single module detail + stats |
| GET | /api/modules/:id/history | Module-specific history |
| GET | /api/modules/:id/stats | successRate, avgDuration, totalRuns |
| POST | /api/modules/:id/start | Launch a module |
| POST | /api/modules/:id/stop | Force-stop a module |

## Module Timeouts (per registry)
| Module | Timeout |
|--------|---------|
| 1 Supply Chain Defense | 5 min |
| 2 Web App Scanner | 5 min |
| 3 System Hardening | 45 min |
| 4 CVE Remediation | 30 min |
| 5 SSL Manager | 10 min |

## WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe_module` | client→server | moduleId |
| `log_stream` | server→client | {moduleId, type, message, timestamp} |
| `module_status_change` | server→client | {moduleId, status, isRunning, exitCode} |
| `connected` | server→client | {ts, server} |

## WebSocket Stability (cloud-hardened)
- pingInterval: 25000ms (beats AWS ALB 60s idle timeout)
- pingTimeout: 60000ms
- Client: 100 reconnect attempts, 1-30s exponential backoff, polling fallback

## Scan History
- File: `backend/data/scan-history.json`
- In-memory cache (O(1) reads)
- Atomic writes (tmp → rename, no corruption on crash)
- Threat verdict extracted from log output: VULNERABLE / PATCHED / CLEAN / ERROR
- 500 records on disk, 200 in memory

## Process Guards
- uncaughtException handler (never crashes on module error)
- unhandledRejection handler
- Graceful SIGTERM → server.close() → process.exit(0) in 10s
- pm2 max-restarts: 10, restart-delay: 2000ms

## Security Headers (no extra deps)
X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy

## Logger
- Console: colorized with log level
- File: logs/backend.log (10MB rotation → backend.log.1)
- Levels: INFO, START, DONE, WARN, ERROR, SYSTEM, REQUEST

## Session 12 — SSH Hardening Drop-in Config Critical Fix (2026-04-25)

### Problem
After Module 3 (System Hardening) ran, EC2 Instance Connect broke.
SSH daemon crashed because the drop-in config 99-hardening.conf had invalid directives
for OpenSSH 9.x (Ubuntu 24.04):
  - Protocol 2 -> FATAL: removed from OpenSSH 7.6+
  - HostKey /etc/ssh/... -> NOT allowed in drop-in configs
  - ListenAddress 0.0.0.0 -> redundant/conflicting in drop-ins

### Files Fixed
- ubuntu-hardening-24-04.sh: SSH drop-in block cleaned
- ubuntu-hardening-25.sh: SSH drop-in block cleaned
- ubuntu-hardening-original.sh: SSH drop-in block cleaned

### Safe Drop-in Config Rule
SSH sshd_config.d/*.conf drop-in files MUST NOT contain:
  Protocol, Port, HostKey, ListenAddress, AddressFamily
These are MAIN sshd_config directives only.

Drop-ins CAN safely contain:
  Authentication settings (PermitRootLogin, PubkeyAuthentication, etc.)
  AuthenticationMethods
  Forwarding settings (X11Forwarding no, etc.)
  Logging (LogLevel VERBOSE)
  Cipher suites (Ciphers, MACs, KexAlgorithms)
  Connection timeouts (ClientAliveInterval, LoginGraceTime)
  Banner

### EC2 Instance Connect Preservation
EC2 Instance Connect uses AuthorizedKeysCommand in its own drop-in:
  /etc/ssh/sshd_config.d/60-ec2-instance-connect.conf
Our 99-hardening.conf (named 99-* so it loads last) does NOT override AuthorizedKeysCommand.
EC2 IC now works correctly after hardening.

*Last updated: 2026-04-25 (Session 12 — Critical SSH fix. Protocol 2 removed from all 3 hardening scripts.)*
