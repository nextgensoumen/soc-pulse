# 🛡️ SOC Pulse Module 1: Supply Chain Defense

> **Source: [gensecaihq/Shai-Hulud-2.0-Detector](https://github.com/gensecaihq/Shai-Hulud-2.0-Detector) v2.1.0 — Cloned & Analyzed in Full**

Detects the **Shai-Hulud 2.0 npm supply chain attack** — a coordinated campaign launched on **November 24, 2025** that compromised **790+ npm packages** with **132M+ monthly downloads**, stealing credentials via TruffleHog and self-propagating across 100 packages per infection.

---

## 🦠 What Shai-Hulud 2.0 Is

### Attack Statistics
| Metric | Value |
|--------|-------|
| Compromised npm packages | **790+** |
| Monthly downloads at risk | **132+ million** |
| Malicious GitHub repos created | **25,000+** |
| Compromised GitHub accounts | **350+** |
| Attack launched | Nov 24, 2025 — 03:16 GMT |

### Major Organizations Hit
Zapier, ENS Domains, PostHog, AsyncAPI, Postman, Voiceflow, BrowserBase, Oku UI

### 9-Step Attack Chain (from `src/scanner.ts`)
```
npm install
   → preinstall hook fires
      → setup_bun.js downloads Bun runtime
         → bun_environment.js executes payload
            → TruffleHog scans for secrets
               → exfiltrates to attacker's GitHub repos
                  → infects 100+ more npm packages
                     → creates "SHA1HULUD" self-hosted GitHub runner
                        → wipes home dir on auth failure
```

---

## 🔍 Detection Capabilities (from `src/scanner.ts` — 78KB, 2334 lines)

### Critical Risk Detections
| Check | How It Works |
|-------|-------------|
| **790+ Compromised Packages** | Semver-precise matching against `compromised-packages.json` (121KB, daily auto-update from Datadog IOC DB) |
| **Malicious Scripts** | Regex scan for `setup_bun.js`, `bun_environment.js` in pre/postinstall hooks |
| **SHA256 Hash Matching** | File hashes verified against Datadog Security Labs known malware signatures |
| **SHA1HULUD Runner** | Detects `runs-on: SHA1HULUD` in GitHub Actions workflows |
| **Runner Installation** | Finds `.dev-env/` dirs and `actions-runner-linux-x64-2.330.0` tarballs |
| **`on: discussion` Trigger** | Detects workflow backdoor via GitHub Discussion event injection |
| **Secrets Exfiltration Files** | Finds `actionsSecrets.json`, `truffleSecrets.json`, `cloud.json`, `environment.json` |
| **Shai-Hulud Repos** | Git remote patterns matching `shai[-_]?hulud`, `SHA1HULUD`, `the second coming` |

### High Risk Detections
| Check | Patterns |
|-------|---------|
| **curl/wget piped to sh** | `curl ... | bash`, `wget ... | sh` |
| **Command substitution** | `$(curl ...)`, `$(wget ...)` |
| **eval() with code** | `eval(...)`, `eval "$VAR"` |
| **Base64 → shell** | `base64 -d ... | bash` |
| **Node -e with network** | `node -e '...fetch(...)'`, `node -e '...child_process'` |
| **npx auto-install** | `npx -y package@version` targeting specific versions |

### Medium Risk Detections
| Check | Patterns |
|-------|---------|
| **TruffleHog abuse** | TruffleHog in npm lifecycle scripts (not legitimate security configs) |
| **Webhook exfiltration** | `webhook.site` endpoints, known malicious UUID `bb8ca5f6-...` |
| **Suspicious branches** | git branches named `shai-hulud` |

### Low Risk Detections
| Check | Affected Namespaces |
|-------|-------------------|
| **Namespace warnings** | `@zapier`, `@posthog`, `@asyncapi`, `@postman`, `@ensdomains`, `@voiceflow`, `@browserbase`, `@ctrl`, `@crowdstrike`, `@oku-ui`, `@ngx`, `@nativescript-community` |

---

## 🧬 Architecture (from `src/`)

| File | Size | Role |
|------|------|------|
| `scanner.ts` | **78KB / 2334 lines** | Core detection engine — all patterns, parsers, hash matching |
| `index.ts` | 22KB | CLI entrypoint, argument parsing (yargs), output formatting |
| `types.ts` | 6.7KB | Full TypeScript type definitions |
| `allowlist.ts` | 9.4KB | False-positive exclusion system with AND-logic field matching |
| `compromised-packages.json` | **121KB** | 790+ packages with affected semver versions (daily auto-updated) |
| `dist/index.js` | **1.65MB** | Pre-compiled bundle (ncc) — no build step needed |

### Package Database Format
```json
{
  "packages": [
    {
      "name": "@zapier/secret-server",
      "severity": "critical",
      "affectedVersions": ["1.0.0", "1.0.1", ">=1.2.0 <1.3.0"]
    }
  ],
  "indicators": {
    "maliciousFiles": ["setup_bun.js", "bun_environment.js"],
    "fileHashes": {
      "setup_bun.js": { "sha256": "a3894003ad1..." },
      "bun_environment.js": { "sha256": ["62ee164b9b...", "cbb9bc5a84..."] }
    },
    "gitHubIndicators": {
      "runnerName": "SHA1HULUD",
      "workflowTrigger": "discussion"
    }
  }
}
```

---

## 🚀 How SOC Pulse Runs It

The backend registry runs:
```bash
node dist/index.js \
  --working-directory=../dashboard \
  --output-format=json \
  --fail-on-critical=false \
  --fail-on-high=false \
  --fail-on-any=false \
  --scan-lockfiles=true \
  --scan-node-modules=false
```

**Key flags explained:**
- `--output-format=json` → structured output streamed via WebSocket to dashboard
- `--fail-on-critical=false` → prevents `process.exit(1)` from crashing the Node.js runner
- `--scan-lockfiles=true` → scans `package-lock.json` (most accurate, resolves transitive deps)
- `--scan-node-modules=false` → skips `node_modules/` dir (too slow; lockfiles are sufficient)

---

## 📋 All Available CLI Options (from `src/index.ts`)

| Option | Default | Description |
|--------|---------|-------------|
| `--working-directory` | `.` | **Required** — path to project to scan |
| `--output-format` | `text` | `text` \| `json` \| `sarif` |
| `--fail-on-critical` | `true` | Exit code 1 on critical findings |
| `--fail-on-high` | `false` | Exit code 1 on high findings |
| `--fail-on-any` | `false` | Exit code 1 on any finding |
| `--scan-lockfiles` | `true` | Scan npm/yarn/pnpm/bun lockfiles |
| `--scan-node-modules` | `false` | Deep scan `node_modules/` directory |
| `--allowlist-path` | `.shai-hulud-allowlist.json` | Path to false-positive exclusion file |
| `--ignore-allowlist` | `false` | Skip allowlist processing entirely |
| `--warn-on-allowlist` | `false` | Show allowlisted items as warnings |

---

## 🔄 Supported Lockfile Parsers (from `src/scanner.ts`)

| Lockfile | Versions Supported |
|----------|--------------------|
| `package-lock.json` | v1, v2, v3 |
| `npm-shrinkwrap.json` | v1, v2, v3 |
| `yarn.lock` | Classic (v1) + Berry (v2/v3) |
| `pnpm-lock.yaml` | All versions |
| `bun.lock` | JSON5 format |

---

## 🧱 False Positive Prevention (from `src/scanner.ts`)

The scanner has sophisticated FP prevention built-in:
- **Trusted namespace bypass**: `@octokit`, `@microsoft`, `@types`, `@azure`, `@google-cloud`, `@aws-sdk`, `@angular`, `@nestjs`, `@prisma` — never flagged
- **TruffleHog legitimate context detection**: Homebrew formulas, `.pre-commit-config`, security CI workflows, documentation, test files — never flagged
- **Comment stripping**: JSDoc/block/line comments stripped before pattern matching (prevents `@microsoft/microsoft-graph-types` false positive)
- **Self-reference exclusion**: The detector's own source/dist files are excluded
- **Security research allowlist**: Datadog IOC DB, Wiz, Aikido, ReversingLabs, Socket.dev references allowed

---

## 🔐 Known Malware SHA256 Hashes (from `scanner.ts`)

```
setup_bun.js:
  a3894003ad1d293ba96d77881ccd2071446dc3f65f434669b49b3da92421901a

bun_environment.js (6 variants):
  62ee164b9b306250c1172583f138c9614139264f889fa99614903c12755468d0
  cbb9bc5a8496243e02f3cc080efbe3e4a1430ba0671f2e43a202bf45b05479cd
  f099c5d9ec417d4445a0328ac0ada9cde79fc37410914103ae9c609cbc0ee068
  f1df4896244500671eb4aa63ebb48ea11cee196fafaa0e9874e17b24ac053c02
  9d59fd0bcc14b671079824c704575f201b74276238dc07a9c12a93a84195648a
  e0250076c1d2ac38777ea8f542431daf61fcbaab0ca9c196614b28065ef5b918
```
