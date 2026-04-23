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
