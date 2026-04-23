# 🌐 SOC Pulse — Module 2: Web App Scanner (react2shell-guard)

> **Source: [gensecaihq/react2shell-scanner](https://github.com/gensecaihq/react2shell-scanner) — Cloned & Analyzed in Full**

Hunts **CVE-2025-55182** — CVSS 10.0 Critical — Unauthenticated RCE in React Server Components via the RSC Flight protocol deserialization.

---

## 🧬 What CVE-2025-55182 Is

Discovered **November 29, 2025** by Lachlan Davidson. An attacker crafts a malicious HTTP POST to any Server Function endpoint — no auth, no user interaction. React deserializes the payload → **remote code execution on the server**.

**Affected packages:**
| Package | Vulnerable Versions | Fixed |
|---------|-------------------|-------|
| `react-server-dom-webpack` | ≥19.0.0 <19.0.1, ≥19.1.0 <19.1.2, ≥19.2.0 <19.2.1 | 19.0.1 / 19.1.2 / 19.2.1 |
| `react-server-dom-parcel` | same | same |
| `react-server-dom-turbopack` | same | same |
| `next` | 15.0.0–15.5.6, 16.0.0–16.0.6 | 15.x.y+1 / 16.0.7 |

**NOT affected:** React 18.x, Next.js Pages Router, client-only React apps, React Native.

---

## 🚀 How SOC Pulse Runs It

The backend registry calls:
```bash
node dist/cli/index.js ../dashboard --json
```
This scans the SOC Pulse dashboard itself for vulnerable RSC packages and streams JSON output via WebSocket to the dashboard.

---

## 📋 Full Capability Map (from cloned source)

### Scan Modes
| Command | What It Does |
|---------|-------------|
| `node dist/cli/index.js <path>` | Lockfile scan (npm/pnpm/yarn) — offline, no installs needed |
| `scan-url <url>` | Live passive fingerprinting — probes RSC endpoint for Flight protocol errors |
| `verify-patch <url>` | 3-probe scan with confidence scoring (HIGH/MEDIUM/LOW) |
| `scan-image <image>` | Docker/OCI image scan (requires Docker daemon) |
| `scan-sbom <file>` | CycloneDX SBOM scanning |
| `fix` | Auto-updates package.json to patched versions |
| `fix --dry-run` | Preview what fix would change |
| `fix --install` | Fix + run package manager install |
| `create-pr` | Auto-creates GitHub PR with fix commit |
| `init-hooks` | Pre-commit hook (husky/lefthook/standalone) |
| `vercel-check` | Blocks vulnerable Vercel deployments |
| `mcp-server` | AI assistant MCP integration |

### Output Formats
| Flag | Format |
|------|--------|
| `--json` | Machine-readable JSON (used by SOC Pulse backend) |
| `--sarif` | SARIF 2.1.0 for GitHub Security tab |
| `--html report.html` | Standalone HTML report |

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | No vulnerabilities |
| 1 | Vulnerabilities detected |
| 2+ | Fatal error |

---

## 🔍 How Live URL Scanning Works (from `url-scanner.ts`)

1. **Probe**: POST to RSC endpoint with `multipart/form-data` + `Next-Action` header
2. **Detect**: Looks for HTTP 500 + RSC Flight protocol signatures:
   - `^[0-9]+:E{` — RSC Flight error format
   - `"digest":"...RSC"` — RSC digest in error response
   - `ReactServerComponentsError` — React error class
   - `text/x-component.*error` — Component error content type
3. **Non-destructive**: No exploit payload — purely passive fingerprinting

---

## 🛡️ Runtime Middleware (from `middleware/express.ts`)

Express.js middleware detects and blocks **live exploit attempts**:
```typescript
app.use(createExpressMiddleware({
  action: 'block',  // 'block' | 'log' | 'alert'
  onAlert: (result, req) => { /* send to Slack/PagerDuty */ },
  skipPaths: ['/health', '/metrics'],
}));
```

**Detected patterns:**
- Serialized function injection
- Prototype pollution
- Malformed module references
- Server action tampering
- Encoded malicious payloads
- RSC streaming format abuse

---

## 🧩 Architecture (from `src/core/`)

| File | Role |
|------|------|
| `scanner.ts` | Main lockfile scan orchestrator |
| `workspace.ts` | Monorepo discovery (recursive project finder) |
| `matcher.ts` | semver range matching against `rules/cve-2025-55182.json` |
| `rules.ts` | JSON rule loader |
| `fixer.ts` | package.json patch writer |
| `url-scanner.ts` | Live HTTP probing engine |
| `container-scanner.ts` | Docker image extractor + scanner |
| `hooks.ts` | Pre-commit hook installer |
| `classifier/nextjs.ts` | App Router vs Pages Router detector |
| `parsers/` | npm / pnpm / yarn lockfile parsers |
| `formatters/html.ts` | Standalone HTML report generator |
| `formatters/sarif.ts` | SARIF 2.1.0 formatter |
| `middleware/detector.ts` | Runtime exploit pattern detector |

---

## 🔧 SOC Pulse Integration Points

### Already wired ✅
- Module 2 in `modules.registry.js` runs `node dist/cli/index.js ../dashboard --json`
- `04-run-backend.sh` builds TypeScript before starting backend: `npm run build`
- Output streamed via WebSocket to dashboard

### Available to add 🔮
- **`scan-url`**: Scan the AWS EC2 public IP for CVE-2025-55182 live detection
- **`verify-patch`**: Confirm patch applied after `fix --install`
- **`scan-image`**: Scan the SOC Pulse Docker image if deployed as container
- **Runtime middleware**: Add to Express backend for live protection
