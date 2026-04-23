# Setup Scripts — Current State (v3.0 — Bulletproof)

## Single Entry Point
```bash
./soc-pulse-start.sh   # run as root — does EVERYTHING
```

## Confirmed Working On
- Ubuntu 22.04 LTS (AWS EC2)
- Node.js v20.20.2 (snap or NodeSource)
- pm2 v6.0.14

## What soc-pulse-start.sh v3.0 Does (in order)
1. `apt-get update -y -qq` — non-interactive (DEBIAN_FRONTEND=noninteractive)
2. Install system tools: curl wget git python3 python3-pip gcc make jq unzip
3. Install Node.js v20 LTS:
   - **Method 1:** Download NodeSource script to file (`-o /tmp/node_setup.sh`) then run
   - **Method 2:** snap fallback if NodeSource fails
4. `ln -sf $NODE_BIN /usr/local/bin/node` — always create symlink (pm2 fix)
5. Install pm2 via `/usr/local/bin/npm` (full path — no PATH guessing)
6. Build Web App Scanner TypeScript (skip if dist/ exists)
7. `npm install` backend and dashboard dependencies
8. `fuser -k 5000/tcp && fuser -k 5173/tcp` — clear ports before launch
9. pm2 start backend with `--interpreter $NODE_BIN` (full binary path)
10. pm2 start dashboard
11. `pm2 save` + `pm2 startup`
12. Health check loop (30s). On failure: **auto-prints backend error logs**
13. Print public IP + access URL

## All Bugs Fixed (never recurring)

### Bug 1: `curl: (23) Failed writing body` (NodeSource pipe broken)
- **Old:** `curl ... | bash` — pipe breaks when apt output interferes
- **Fix:** `curl -o /tmp/node_setup.sh && bash /tmp/node_setup.sh`
- **Result:** NodeSource installs to `/usr/bin/node` (no snap needed)

### Bug 2: pm2 silent backend crash (snap node not in pm2 PATH)
- **Symptom:** pm2 shows blank status + 0b memory, log files completely empty
- **Cause:** snap node at `/snap/bin/node`, pm2 daemon PATH has no `/snap/bin`
- **Fix:** `ln -sf $NODE_BIN /usr/local/bin/node` + `pm2 start --interpreter $NODE_BIN`
- **Proven:** `node server.js` ran fine, client connected — only pm2 spawn broken

### Bug 3: ESM crash (`import` statement fails)
- **Cause:** pm2 ran server.js from project root, not `backend/` — no `package.json` with `"type":"module"`
- **Fix:** `--cwd $SOC_ROOT/backend` on pm2 start

### Bug 4: `set -e` aborts script on non-fatal errors
- **Old:** `set -euo pipefail` — any non-zero exit kills entire script
- **Fix:** `set -uo pipefail` + `|| true` on every non-critical command

### Bug 5: Port conflict on re-run
- **Fix:** `fuser -k 5000/tcp && fuser -k 5173/tcp` before pm2 launch

### Bug 6: Health check fails silently
- **Old:** Printed a warning message, nothing else
- **Fix:** Auto-prints last 20 lines of `backend-err.log` + `backend-out.log`

## pm2 Management (on server)
```bash
pm2 list                                    # view all processes
pm2 logs soc-pulse-backend --lines 30       # backend logs
pm2 logs soc-pulse-dashboard --lines 30     # dashboard logs
pm2 restart all                             # restart both
pm2 stop all                                # stop both
pm2 save                                    # persist for reboot
```

## Re-deploy on Existing Server
```bash
cd /home/ubuntu/soc-pulse
git pull
./soc-pulse-start.sh
```

## Access After Deploy
- Dashboard: `http://<PUBLIC_IP>:5173`
- Backend API: `http://<PUBLIC_IP>:5000/api/health`
- **AWS: ports 5173 + 5000 must be open in Security Group inbound rules**
