# Setup Scripts — Current State (v3.0 — PRODUCTION STABLE ✅)

## Single Entry Point
```bash
./soc-pulse-start.sh   # run as root — does EVERYTHING
```

## CONFIRMED WORKING — Clean Deploy Log (2026-04-23)
- Ubuntu 22.04 LTS (AWS EC2)
- Node.js v20.20.2 via **NodeSource** → `/usr/bin/node`
- pm2 v6.0.14 at `/usr/bin/pm2`
- Backend: **online, 64.8mb, health check passed in 1s**
- Dashboard: **online, 18.3mb**
- Zero errors, zero manual intervention

## What soc-pulse-start.sh v3.0 Does (in order)
1. `apt-get update -y -qq` — non-interactive (DEBIAN_FRONTEND=noninteractive)
2. Install system tools: curl wget git python3 python3-pip gcc make jq unzip
3. **Node.js install — two methods:**
   - **Method 1 (primary):** `curl -o /tmp/node_setup.sh && bash /tmp/node_setup.sh` — file download avoids pipe error
   - **Method 2 (fallback):** snap install if NodeSource fails
4. `ln -sf $NODE_BIN /usr/local/bin/node` — always create symlink
5. `pm2 install` via full path (`/usr/local/bin/npm`)
6. Build Web App Scanner TypeScript (skip if dist/ exists)
7. `npm install` backend + dashboard dependencies
8. `fuser -k 5000/tcp && fuser -k 5173/tcp` — clear ports
9. `pm2 start --interpreter $NODE_BIN` — full binary path (no PATH guessing)
10. `pm2 save + pm2 startup` — survives reboot
11. **30s health check loop** — on failure prints actual error logs
12. Print public IP + access URLs

## All Bugs — Fixed Permanently

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `curl: (23) Failed writing body` | `curl \| bash` pipe conflict | Download to file first |
| pm2 silent crash (empty logs) | snap node not in pm2 daemon PATH | symlink + `--interpreter` full path |
| ESM `import` crash | missing `--cwd backend/` | `--cwd $SOC_ROOT/backend` added |
| Script aborts on minor error | `set -e` too aggressive | `set -uo pipefail` + `\|\| true` per command |
| Port conflict on re-run | nothing cleared | `fuser -k 5000/tcp` before launch |
| Health check failure silent | just warning printed | auto-prints error logs on failure |

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

## Fresh Deploy (new server)
```bash
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse && chmod +x soc-pulse-start.sh && ./soc-pulse-start.sh
```

## Access After Deploy
- Dashboard: `http://<PUBLIC_IP>:5173`
- Backend API: `http://<PUBLIC_IP>:5000/api/health`
- **AWS: open ports 5173 + 5000 in Security Group inbound rules**
